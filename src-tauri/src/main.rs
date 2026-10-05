#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{engine::general_purpose, Engine as _};
use chrono::{DateTime, Local, Utc};
use rand::seq::SliceRandom;
use rand::RngCore;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use sha2::{Digest, Sha256};

// ---------- Data types ----------

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Note {
    pub id: i64,
    pub created_at: String, // RFC3339
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub kind: String,         // "idea" | "link" | "post" | "milestone"
    pub status: String,       // "backlog" | "in_progress" | "shipped"
    pub funnel_stage: String, // "awareness" | "lead_magnet" | "product" | "revenue"
    pub remind_at: Option<String>, // ISO string or YYYY-MM-DD
    pub url: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct NewNote {
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub kind: Option<String>,
    pub status: Option<String>,
    pub funnel_stage: Option<String>,
    pub remind_at: Option<String>,
    pub url: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateNote {
    pub id: i64,
    pub title: Option<String>,
    pub body: Option<String>,
    pub tags: Option<Vec<String>>,
    pub kind: Option<String>,
    pub status: Option<String>,
    pub funnel_stage: Option<String>,
    pub remind_at: Option<String>,
    pub url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RadarResponse {
    pub due_items: Vec<Note>,
    pub overdue_items: Vec<Note>,
    pub gems: Vec<Note>,
    pub active_builds: Vec<Note>,
}

pub struct AppState {
    pub db: Mutex<Connection>,
    pub key: [u8; 32],
}

// ---------- Paths ----------

fn app_data_dir() -> PathBuf {
    let mut dir = dirs::data_dir().expect("no data dir on this OS");
    dir.push("dev-timeline");
    fs::create_dir_all(&dir).expect("could not create app data dir");
    dir
}

fn db_path() -> PathBuf {
    let mut p = app_data_dir();
    p.push("notes.db");
    p
}

fn key_path() -> PathBuf {
    let mut p = app_data_dir();
    p.push("local.key");
    p
}

// ---------- Encryption ----------

fn load_or_create_key() -> [u8; 32] {
    let path = key_path();
    if let Ok(bytes) = fs::read(&path) {
        if bytes.len() == 32 {
            let mut key = [0u8; 32];
            key.copy_from_slice(&bytes);
            return key;
        }
    }
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    fs::write(&path, key).expect("failed to write key file");

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = fs::metadata(&path) {
            let mut perms = meta.permissions();
            perms.set_mode(0o600); // owner read/write only
            let _ = fs::set_permissions(&path, perms);
        }
    }

    key
}

fn encrypt(key: &[u8; 32], plaintext: &str) -> String {
    let cipher = Aes256Gcm::new_from_slice(key).expect("bad key length");
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .expect("encryption failure");
    format!(
        "{}:{}",
        general_purpose::STANDARD.encode(nonce_bytes),
        general_purpose::STANDARD.encode(ciphertext)
    )
}

fn decrypt(key: &[u8; 32], stored: &str) -> String {
    let cipher = Aes256Gcm::new_from_slice(key).expect("bad key length");
    let mut parts = stored.splitn(2, ':');
    let nonce_b64 = parts.next().unwrap_or_default();
    let ct_b64 = parts.next().unwrap_or_default();
    let nonce_bytes = general_purpose::STANDARD
        .decode(nonce_b64)
        .unwrap_or_default();
    let ciphertext = general_purpose::STANDARD.decode(ct_b64).unwrap_or_default();
    let nonce = Nonce::from_slice(&nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .unwrap_or_default();
    String::from_utf8(plaintext).unwrap_or_default()
}

// ---------- DB setup & migration ----------

fn init_db(conn: &Connection) {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at   TEXT NOT NULL,
            title_enc    TEXT NOT NULL,
            body_enc     TEXT NOT NULL,
            tags         TEXT NOT NULL DEFAULT '',
            kind         TEXT NOT NULL DEFAULT 'idea',
            status       TEXT NOT NULL DEFAULT 'backlog',
            funnel_stage TEXT NOT NULL DEFAULT 'lead_magnet',
            remind_at    TEXT DEFAULT NULL,
            url          TEXT DEFAULT NULL
        )",
        [],
    )
    .expect("failed to create notes table");

    // Seamlessly add columns if table previously existed with v1 schema
    let _ = conn.execute("ALTER TABLE notes ADD COLUMN kind TEXT NOT NULL DEFAULT 'idea'", []);
    let _ = conn.execute("ALTER TABLE notes ADD COLUMN status TEXT NOT NULL DEFAULT 'backlog'", []);
    let _ = conn.execute("ALTER TABLE notes ADD COLUMN funnel_stage TEXT NOT NULL DEFAULT 'lead_magnet'", []);
    let _ = conn.execute("ALTER TABLE notes ADD COLUMN remind_at TEXT DEFAULT NULL", []);
    let _ = conn.execute("ALTER TABLE notes ADD COLUMN url TEXT DEFAULT NULL", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS secrets_vault (
            id           TEXT PRIMARY KEY,
            service      TEXT NOT NULL,
            username     TEXT NOT NULL DEFAULT '',
            category     TEXT NOT NULL DEFAULT 'api',
            ciphertext   TEXT NOT NULL,
            iv           TEXT NOT NULL,
            salt         TEXT NOT NULL,
            notes        TEXT NOT NULL DEFAULT '',
            created_at   TEXT NOT NULL,
            updated_at   TEXT NOT NULL
        )",
        [],
    )
    .expect("failed to create secrets_vault table");

    conn.execute(
        "CREATE TABLE IF NOT EXISTS secrets_meta (
            key          TEXT PRIMARY KEY,
            value        TEXT NOT NULL
        )",
        [],
    )
    .expect("failed to create secrets_meta table");
}

// ---------- Commands ----------

#[tauri::command]
fn add_note(state: State<AppState>, note: NewNote) -> Result<Note, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let created_at = Utc::now().to_rfc3339();
    let title_enc = encrypt(&state.key, &note.title);
    let body_enc = encrypt(&state.key, &note.body);
    let tags_joined = note.tags.join(",");
    let kind = note.kind.unwrap_or_else(|| "idea".to_string());
    let status = note.status.unwrap_or_else(|| "backlog".to_string());
    let funnel_stage = note.funnel_stage.unwrap_or_else(|| "lead_magnet".to_string());

    conn.execute(
        "INSERT INTO notes (created_at, title_enc, body_enc, tags, kind, status, funnel_stage, remind_at, url)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            created_at,
            title_enc,
            body_enc,
            tags_joined,
            kind,
            status,
            funnel_stage,
            note.remind_at,
            note.url
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Note {
        id,
        created_at,
        title: note.title,
        body: note.body,
        tags: note.tags,
        kind,
        status,
        funnel_stage,
        remind_at: note.remind_at,
        url: note.url,
    })
}

#[tauri::command]
fn list_notes(state: State<AppState>) -> Result<Vec<Note>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, created_at, title_enc, body_enc, tags, kind, status, funnel_stage, remind_at, url 
             FROM notes ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let id: i64 = row.get(0)?;
            let created_at: String = row.get(1)?;
            let title_enc: String = row.get(2)?;
            let body_enc: String = row.get(3)?;
            let tags_raw: String = row.get(4)?;
            let kind: String = row.get(5).unwrap_or_else(|_| "idea".to_string());
            let status: String = row.get(6).unwrap_or_else(|_| "backlog".to_string());
            let funnel_stage: String = row.get(7).unwrap_or_else(|_| "lead_magnet".to_string());
            let remind_at: Option<String> = row.get(8).ok();
            let url: Option<String> = row.get(9).ok();
            Ok((
                id,
                created_at,
                title_enc,
                body_enc,
                tags_raw,
                kind,
                status,
                funnel_stage,
                remind_at,
                url,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for r in rows {
        let (
            id,
            created_at,
            title_enc,
            body_enc,
            tags_raw,
            kind,
            status,
            funnel_stage,
            remind_at,
            url,
        ) = r.map_err(|e| e.to_string())?;
        let title = decrypt(&state.key, &title_enc);
        let body = decrypt(&state.key, &body_enc);
        let tags: Vec<String> = if tags_raw.is_empty() {
            vec![]
        } else {
            tags_raw.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
        };
        notes.push(Note {
            id,
            created_at,
            title,
            body,
            tags,
            kind,
            status,
            funnel_stage,
            remind_at,
            url,
        });
    }
    Ok(notes)
}

#[tauri::command]
fn update_note(state: State<AppState>, update: UpdateNote) -> Result<Note, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // First fetch existing
    let mut stmt = conn
        .prepare("SELECT id, created_at, title_enc, body_enc, tags, kind, status, funnel_stage, remind_at, url FROM notes WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let existing = stmt
        .query_row(params![update.id], |row| {
            let id: i64 = row.get(0)?;
            let created_at: String = row.get(1)?;
            let title_enc: String = row.get(2)?;
            let body_enc: String = row.get(3)?;
            let tags_raw: String = row.get(4)?;
            let kind: String = row.get(5).unwrap_or_else(|_| "idea".to_string());
            let status: String = row.get(6).unwrap_or_else(|_| "backlog".to_string());
            let funnel_stage: String = row.get(7).unwrap_or_else(|_| "lead_magnet".to_string());
            let remind_at: Option<String> = row.get(8).ok();
            let url: Option<String> = row.get(9).ok();
            Ok((
                id,
                created_at,
                title_enc,
                body_enc,
                tags_raw,
                kind,
                status,
                funnel_stage,
                remind_at,
                url,
            ))
        })
        .map_err(|e| e.to_string())?;

    let title = if let Some(t) = update.title {
        t
    } else {
        decrypt(&state.key, &existing.2)
    };

    let body = if let Some(b) = update.body {
        b
    } else {
        decrypt(&state.key, &existing.3)
    };

    let tags = update.tags.unwrap_or_else(|| {
        if existing.4.is_empty() {
            vec![]
        } else {
            existing.4.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
        }
    });

    let kind = update.kind.unwrap_or(existing.5);
    let status = update.status.unwrap_or(existing.6);
    let funnel_stage = update.funnel_stage.unwrap_or(existing.7);
    let remind_at = if update.remind_at.is_some() {
        update.remind_at
    } else {
        existing.8
    };
    let url = if update.url.is_some() {
        update.url
    } else {
        existing.9
    };

    let title_enc = encrypt(&state.key, &title);
    let body_enc = encrypt(&state.key, &body);
    let tags_joined = tags.join(",");

    conn.execute(
        "UPDATE notes SET title_enc = ?1, body_enc = ?2, tags = ?3, kind = ?4, status = ?5, funnel_stage = ?6, remind_at = ?7, url = ?8 WHERE id = ?9",
        params![
            title_enc,
            body_enc,
            tags_joined,
            kind,
            status,
            funnel_stage,
            remind_at,
            url,
            update.id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Note {
        id: update.id,
        created_at: existing.1,
        title,
        body,
        tags,
        kind,
        status,
        funnel_stage,
        remind_at,
        url,
    })
}

#[tauri::command]
fn delete_note(state: State<AppState>, id: i64) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_radar_items(state: State<AppState>) -> Result<RadarResponse, String> {
    let notes = list_notes(state)?;
    let now = Utc::now();
    let today_str = now.format("%Y-%m-%d").to_string();

    let mut due_items = Vec::new();
    let mut overdue_items = Vec::new();
    let mut backlog_pool = Vec::new();
    let mut active_builds = Vec::new();

    for note in notes {
        if note.status == "in_progress" || (note.kind == "milestone" && note.status != "shipped") {
            active_builds.push(note.clone());
        }

        if let Some(ref rem) = note.remind_at {
            if !rem.trim().is_empty() {
                let rem_clean = rem.trim();
                if rem_clean.as_bytes() <= today_str.as_bytes() {
                    if rem_clean == today_str.as_str() {
                        due_items.push(note.clone());
                    } else {
                        overdue_items.push(note.clone());
                    }
                }
            }
        }

        if note.status == "backlog" && (note.kind == "idea" || note.kind == "link" || note.kind == "post") {
            backlog_pool.push(note);
        }
    }

    // Pick 2 random backlog gems for serendipitous review
    let mut rng = rand::thread_rng();
    backlog_pool.shuffle(&mut rng);
    let gems = backlog_pool.into_iter().take(2).collect();

    Ok(RadarResponse {
        due_items,
        overdue_items,
        gems,
        active_builds,
    })
}

#[tauri::command]
fn generate_timeline_md(state: State<AppState>) -> Result<String, String> {
    let notes = list_notes(state)?;
    let mut md = String::new();
    md.push_str("# 🐺 Wolfitway Dev Timeline & Funnel Architecture\n\n");
    md.push_str(&format!(
        "_Generated on {}_\n\n",
        Local::now().format("%Y-%m-%d %H:%M")
    ));

    // 1. Next Steps / Active Builds
    let in_progress: Vec<&Note> = notes.iter().filter(|n| n.status == "in_progress").collect();
    let milestones: Vec<&Note> = notes.iter().filter(|n| n.kind == "milestone" && n.status != "shipped").collect();

    md.push_str("## 🎯 Active Priorities & Next Steps\n\n");
    if !in_progress.is_empty() {
        for item in &in_progress {
            md.push_str(&format!("* ⚡ **[IN PROGRESS]** {}\n", item.title));
            if !item.body.trim().is_empty() {
                md.push_str(&format!("  > {}\n", item.body.trim().replace('\n', "\n  > ")));
            }
        }
        md.push_str("\n");
    } else if let Some(latest) = milestones.first().copied().or_else(|| notes.first()) {
        md.push_str(&format!("* 📌 **[NEXT UP]** {}\n\n", latest.title));
        if !latest.body.trim().is_empty() {
            md.push_str(&format!("  {}\n\n", latest.body.trim()));
        }
    } else {
        md.push_str("_No active tasks in progress. Capture an idea or milestone to start._\n\n");
    }

    md.push_str("---\n\n");

    // 2. Funnel Architecture View
    md.push_str("## ⚡ Funnel Mapping\n\n");
    let funnel_stages = [
        ("awareness", "📣 1. Top of Funnel (Content, Posts & Ideas)"),
        ("lead_magnet", "🧲 2. Middle of Funnel (Free Tools & Magnets)"),
        ("product", "🛡️ 3. Core Engine (Sovereign Apps & Systems)"),
        ("revenue", "💎 4. Bottom of Funnel (Monetization & Retainers)"),
    ];

    for (stage_key, stage_title) in funnel_stages {
        let stage_notes: Vec<&Note> = notes.iter().filter(|n| n.funnel_stage == stage_key).collect();
        if !stage_notes.is_empty() {
            md.push_str(&format!("### {}\n\n", stage_title));
            for n in stage_notes {
                let badge = match n.kind.as_str() {
                    "idea" => "💡 [Idea]",
                    "link" => "🔗 [Link]",
                    "post" => "📝 [Post]",
                    "milestone" => "🗺️ [Build]",
                    _ => "📌",
                };
                let status_icon = match n.status.as_str() {
                    "shipped" => "✅",
                    "in_progress" => "⚡",
                    _ => "⏳",
                };
                md.push_str(&format!("* {} {} **{}**", status_icon, badge, n.title));
                if let Some(ref u) = n.url {
                    if !u.is_empty() {
                        md.push_str(&format!(" — <{}>", u));
                    }
                }
                md.push_str("\n");
                if !n.body.trim().is_empty() {
                    md.push_str(&format!("  _{}_\n", n.body.trim().replace('\n', " ")));
                }
            }
            md.push_str("\n");
        }
    }

    md.push_str("---\n\n");

    // 3. Chronological Log
    md.push_str("## 📜 Chronological Log\n\n");
    for note in &notes {
        let dt: DateTime<Utc> = note
            .created_at
            .parse()
            .unwrap_or_else(|_| Utc::now());
        let local_dt: DateTime<Local> = dt.with_timezone(&Local);
        let kind_icon = match note.kind.as_str() {
            "idea" => "💡",
            "link" => "🔗",
            "post" => "📝",
            "milestone" => "🗺️",
            _ => "📌",
        };
        md.push_str(&format!(
            "### {} {} — {} `[{}]`\n\n",
            kind_icon,
            local_dt.format("%Y-%m-%d %H:%M"),
            note.title,
            note.status.to_uppercase()
        ));
        if let Some(ref u) = note.url {
            if !u.is_empty() {
                md.push_str(&format!("🌐 **URL:** {}\n\n", u));
            }
        }
        if !note.tags.is_empty() {
            let tag_str = note
                .tags
                .iter()
                .map(|t| format!("`#{}`", t))
                .collect::<Vec<_>>()
                .join(" ");
            md.push_str(&format!("{}\n\n", tag_str));
        }
        if !note.body.trim().is_empty() {
            md.push_str(&format!("{}\n\n", note.body.trim()));
        }
    }

    Ok(md)
}

#[tauri::command]
fn export_timeline(state: State<AppState>, target_path: String) -> Result<String, String> {
    let md = generate_timeline_md(state)?;
    fs::write(&target_path, md).map_err(|e| e.to_string())?;
    Ok(target_path)
}

#[tauri::command]
fn export_ecosystem_json(state: State<AppState>) -> Result<String, String> {
    let notes = list_notes(state)?;
    serde_json::to_string_pretty(&notes).map_err(|e| e.to_string())
}

// =========================================================================
// HARDWARE FINGERPRINTING & SOVEREIGN CRYPTOGRAPHIC LICENSING
// =========================================================================

const MASTER_SIGNING_SECRET: &str = "WOLF_SOVEREIGN_ALPHA_SIGNING_SECRET_2026";
const DEVICE_SALT: &str = "WOLF_DEVICE_SALT_2026";
const MASTER_FOUNDER_KEY: &str = "WOLF-FOUNDER-MASTER-ACCESS-2026";

fn get_raw_machine_id() -> String {
    #[cfg(target_os = "linux")]
    {
        if let Ok(id) = fs::read_to_string("/etc/machine-id") {
            let trimmed = id.trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
        if let Ok(id) = fs::read_to_string("/var/lib/dbus/machine-id") {
            let trimmed = id.trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("ioreg")
            .args(&["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.contains("IOPlatformUUID") {
                    if let Some(uuid) = line.split('"').nth(3) {
                        return uuid.to_string();
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("reg")
            .args(&["query", "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.contains("MachineGuid") {
                    if let Some(guid) = line.split_whitespace().last() {
                        return guid.to_string();
                    }
                }
            }
        }
    }

    // Universal fallback: persistent hardware file in app_data_dir()
    let mut fallback_path = app_data_dir();
    fallback_path.push("machine.id");
    if let Ok(content) = fs::read_to_string(&fallback_path) {
        let trimmed = content.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    let mut rng = rand::thread_rng();
    let new_id = format!("{:016x}{:016x}", rng.next_u64(), rng.next_u64());
    let _ = fs::write(&fallback_path, &new_id);
    new_id
}

fn compute_device_fingerprint(raw: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    hasher.update(DEVICE_SALT.as_bytes());
    let result = hasher.finalize();
    let hex = format!("{:02X}", result);
    let clean: String = hex.chars().filter(|c| c.is_ascii_hexdigit()).collect();
    let p1 = &clean[0..4];
    let p2 = &clean[4..8];
    let p3 = &clean[8..12];
    format!("WOLF-DEV-{}-{}-{}", p1, p2, p3)
}

fn compute_license_key(machine_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(machine_id.as_bytes());
    hasher.update(MASTER_SIGNING_SECRET.as_bytes());
    let result = hasher.finalize();
    let hex = format!("{:02X}", result);
    let clean: String = hex.chars().filter(|c| c.is_ascii_hexdigit()).collect();
    let p1 = &clean[0..4];
    let p2 = &clean[4..8];
    let p3 = &clean[8..12];
    format!("WOLF-KEY-{}-{}-{}", p1, p2, p3)
}

#[allow(dead_code)]
const COMMERCIAL_PREFIX: &str = "WOLF-COMM-";
#[allow(dead_code)]
const TEAM_PREFIX: &str = "WOLF-TEAM-";

fn compute_license_key_for_tier(machine_id: &str, tier_type: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(machine_id.as_bytes());
    hasher.update(tier_type.as_bytes());
    hasher.update(MASTER_SIGNING_SECRET.as_bytes());
    let result = hasher.finalize();
    let hex = format!("{:02X}", result);
    let clean: String = hex.chars().filter(|c| c.is_ascii_hexdigit()).collect();
    let p1 = &clean[0..4];
    let p2 = &clean[4..8];
    let p3 = &clean[8..12];

    match tier_type {
        "commercial_solo" => format!("WOLF-COMM-{}-{}-{}", p1, p2, p3),
        "team" => format!("WOLF-TEAM-5S-{}-{}-{}", p1, p2, p3),
        _ => format!("WOLF-KEY-{}-{}-{}", p1, p2, p3),
    }
}

fn verify_key_internal(machine_id: &str, entered_key: &str) -> (bool, String, String) {
    let trimmed = entered_key.trim().to_uppercase();
    if trimmed == MASTER_FOUNDER_KEY {
        return (true, "Founder Sovereign VIP".to_string(), "commercial_solo".to_string());
    }

    // Free tier bypass/default
    if trimmed.starts_with("WOLF-FREE-") {
        return (true, "Solo Personal (Free Sovereign Node)".to_string(), "solo_free".to_string());
    }

    // Check Commercial Solo
    let expected_comm = compute_license_key_for_tier(machine_id, "commercial_solo");
    if trimmed == expected_comm {
        return (true, "Commercial Solo License".to_string(), "commercial_solo".to_string());
    }

    // Check Team Pack (5 Seats default)
    let expected_team = compute_license_key_for_tier(machine_id, "team");
    if trimmed == expected_team || (trimmed.starts_with(TEAM_PREFIX) && trimmed.contains(&compute_license_key(machine_id)[9..18])) {
        return (true, "Team / Pack Mesh License (5 Seats)".to_string(), "team".to_string());
    }

    // Check Legacy / General Alpha key
    let expected_alpha = compute_license_key(machine_id);
    if trimmed == expected_alpha {
        return (true, "Commercial Solo (Alpha Seat)".to_string(), "commercial_solo".to_string());
    }

    (false, "Invalid License".to_string(), "solo_free".to_string())
}

fn license_file_path() -> PathBuf {
    let mut p = app_data_dir();
    p.push("license.key");
    p
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LicenseInfo {
    pub activated: bool,
    pub machine_id: String,
    pub key: Option<String>,
    pub tier: String,
    pub tier_label: String,
    pub company_name: Option<String>,
    pub seats: Option<u32>,
    pub activated_at: Option<String>,
    pub features: Vec<String>,
}

#[tauri::command]
fn get_machine_fingerprint() -> Result<String, String> {
    let raw = get_raw_machine_id();
    Ok(compute_device_fingerprint(&raw))
}

#[tauri::command]
fn check_license_status() -> Result<LicenseInfo, String> {
    let raw = get_raw_machine_id();
    let machine_id = compute_device_fingerprint(&raw);
    let path = license_file_path();
    
    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(info) = serde_json::from_str::<LicenseInfo>(&content) {
            let (is_valid, label, tier) = verify_key_internal(&machine_id, info.key.as_deref().unwrap_or_default());
            if info.machine_id == machine_id && is_valid {
                let mut updated = info;
                updated.tier = tier;
                updated.tier_label = label;
                return Ok(updated);
            }
        }
    }

    Ok(LicenseInfo {
        activated: false,
        machine_id,
        key: None,
        tier: "solo_free".to_string(),
        tier_label: "Solo Personal Node (Free)".to_string(),
        company_name: None,
        seats: Some(1),
        activated_at: None,
        features: vec![
            "Local AES-256-GCM vault".to_string(),
            "Unlimited solo notes & timeline".to_string(),
            "Standard Markdown/JSON export".to_string(),
        ],
    })
}

#[tauri::command]
fn activate_license(key: String) -> Result<LicenseInfo, String> {
    let raw = get_raw_machine_id();
    let machine_id = compute_device_fingerprint(&raw);
    
    let (is_valid, label, tier) = verify_key_internal(&machine_id, &key);
    if !is_valid {
        return Err("Invalid license key for this device. Please check key or select a tier.".to_string());
    }

    let is_team = tier == "team";
    let seats = if is_team { Some(5) } else { Some(1) };
    let features = if is_team {
        vec![
            "Multi-Seat Pack mesh".to_string(),
            "Team shared credentials locker".to_string(),
            "Unbranded clean export suite".to_string(),
            "Multi-author event attribution".to_string(),
        ]
    } else if tier == "commercial_solo" {
        vec![
            "Commercial & client usage rights".to_string(),
            "Unbranded white-label export suite".to_string(),
            "Priority AI decision studio".to_string(),
        ]
    } else {
        vec![
            "Local AES-256-GCM vault".to_string(),
            "Solo personal projects".to_string(),
        ]
    };
    
    let info = LicenseInfo {
        activated: tier != "solo_free",
        machine_id: machine_id.clone(),
        key: Some(key.trim().to_uppercase()),
        tier,
        tier_label: label,
        company_name: if is_team { Some("Sovereign Pack Org".to_string()) } else { None },
        seats,
        activated_at: Some(Utc::now().to_rfc3339()),
        features,
    };

    let json = serde_json::to_string_pretty(&info).map_err(|e| e.to_string())?;
    fs::write(license_file_path(), json).map_err(|e| e.to_string())?;

    Ok(info)
}

#[tauri::command]
fn generate_self_license() -> Result<String, String> {
    let raw = get_raw_machine_id();
    let machine_id = compute_device_fingerprint(&raw);
    Ok(compute_license_key(&machine_id))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VaultSecretItem {
    pub id: String,
    pub service: String,
    pub username: Option<String>,
    pub category: String,
    pub ciphertext: String,
    pub iv: String,
    pub salt: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
fn get_vault_secrets(state: State<AppState>) -> Result<Vec<VaultSecretItem>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, service, username, category, ciphertext, iv, salt, notes, created_at, updated_at FROM secrets_vault ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(VaultSecretItem {
                id: row.get(0)?,
                service: row.get(1)?,
                username: row.get(2).ok(),
                category: row.get(3)?,
                ciphertext: row.get(4)?,
                iv: row.get(5)?,
                salt: row.get(6)?,
                notes: row.get(7).ok(),
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        if let Ok(item) = r {
            list.push(item);
        }
    }
    Ok(list)
}

#[tauri::command]
fn save_vault_secret(state: State<AppState>, item: VaultSecretItem) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO secrets_vault (id, service, username, category, ciphertext, iv, salt, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(id) DO UPDATE SET
            service = excluded.service,
            username = excluded.username,
            category = excluded.category,
            ciphertext = excluded.ciphertext,
            iv = excluded.iv,
            salt = excluded.salt,
            notes = excluded.notes,
            updated_at = excluded.updated_at",
        rusqlite::params![
            item.id,
            item.service,
            item.username.unwrap_or_default(),
            item.category,
            item.ciphertext,
            item.iv,
            item.salt,
            item.notes.unwrap_or_default(),
            item.created_at,
            item.updated_at
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_vault_secret(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM secrets_vault WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_vault_meta(state: State<AppState>, key: String) -> Result<Option<String>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM secrets_meta WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(rusqlite::params![key]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        return Ok(Some(val));
    }
    Ok(None)
}

#[tauri::command]
fn set_vault_meta(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO secrets_meta (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn deactivate_license() -> Result<(), String> {
    let path = license_file_path();
    if path.exists() {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

fn main() {
    let key = load_or_create_key();
    let conn = Connection::open(db_path()).expect("failed to open sqlite db");
    init_db(&conn);

    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(conn),
            key,
        })
        .invoke_handler(tauri::generate_handler![
            add_note,
            list_notes,
            update_note,
            delete_note,
            get_radar_items,
            generate_timeline_md,
            export_timeline,
            export_ecosystem_json,
            get_machine_fingerprint,
            check_license_status,
            activate_license,
            generate_self_license,
            deactivate_license,
            get_vault_secrets,
            save_vault_secret,
            delete_vault_secret,
            get_vault_meta,
            set_vault_meta
        ])
        .run(tauri::generate_context!())
        .expect("error while running dev-timeline");
}
