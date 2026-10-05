import type { ScannedCredentialCandidate } from "@/types";

export function scanTextForCredentials(rawText: string): ScannedCredentialCandidate[] {
  if (!rawText || typeof rawText !== "string") return [];

  const candidates: ScannedCredentialCandidate[] = [];
  const seenMap = new Set<string>();

  function addCandidate(
    service: string,
    category: "api" | "login" | "db" | "token",
    username: string,
    password: string,
    host: string,
    notes: string
  ) {
    if (!password || password.length < 3) return;
    const cleanPass = password.trim();
    const cleanUser = (username || "").trim();
    const cleanServ = (service || "Detected Credential").trim();
    const dedupeKey = `${cleanServ.toLowerCase()}::${cleanUser.toLowerCase()}::${cleanPass}`;
    if (seenMap.has(dedupeKey)) return;
    seenMap.add(dedupeKey);

    candidates.push({
      id: `scanned_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      service: cleanServ,
      category: category || "api",
      username: cleanUser,
      password: cleanPass,
      host: (host || "").trim(),
      notes: (notes || "").trim(),
      selected: true,
    });
  }

  // 1. DeepSeek API Keys (sk-[hex]{32})
  const deepseekMatches = rawText.matchAll(/\b(sk-[a-f0-9]{32})\b/gi);
  for (const m of deepseekMatches) {
    addCandidate("DeepSeek API", "api", "api_key", m[1], "https://api.deepseek.com", "Auto-detected DeepSeek API Key");
  }

  // 2. OpenAI API Keys (sk-..., sk-proj-...)
  const openAiMatches = rawText.matchAll(/\b(sk-(?:proj-)?[a-zA-Z0-9_\-]{20,})\b/g);
  for (const m of openAiMatches) {
    // Avoid re-matching 32-hex DeepSeek keys
    if (/^[a-f0-9]{32}$/i.test(m[1].replace(/^sk-/, ""))) continue;
    addCandidate("OpenAI API", "api", "api_key", m[1], "https://api.openai.com", "Auto-detected OpenAI API Key");
  }

  // 3. Anthropic Claude API Keys (sk-ant-...)
  const anthropicMatches = rawText.matchAll(/\b(sk-ant-[a-zA-Z0-9_\-]{20,})\b/g);
  for (const m of anthropicMatches) {
    addCandidate("Anthropic Claude", "api", "api_key", m[1], "https://api.anthropic.com", "Auto-detected Anthropic Key");
  }

  // 4. Google Gemini / Cloud Keys (AIza... or AQ.Ab8...)
  const googleMatches = rawText.matchAll(/\b(AIza[0-9A-Za-z\-_]{35})\b/g);
  for (const m of googleMatches) {
    addCandidate("Google Gemini / Cloud API", "api", "api_key", m[1], "https://generativelanguage.googleapis.com", "Auto-detected Google API Key");
  }
  const geminiStudioMatches = rawText.matchAll(/\b(AQ\.[A-Za-z0-9_\-]{30,})\b/g);
  for (const m of geminiStudioMatches) {
    addCandidate("Google Gemini AI Studio", "api", "api_key", m[1], "https://aistudio.google.com", "Auto-detected Gemini AI Studio Key");
  }

  // 5. GitHub Personal Access Tokens / OAuth (ghp_..., github_pat_...)
  const githubMatches = rawText.matchAll(/\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/g);
  for (const m of githubMatches) {
    addCandidate("GitHub Token", "api", "token", m[1], "https://github.com", "Auto-detected GitHub Access Token");
  }

  // 6. Stripe API Keys (sk_live_..., rk_live_..., pk_live_...)
  const stripeMatches = rawText.matchAll(/\b([rs]k_(?:test|live)_[0-9a-zA-Z]{24,}|pk_(?:test|live)_[0-9a-zA-Z]{24,})\b/g);
  for (const m of stripeMatches) {
    const isSecret = m[1].startsWith("sk_") || m[1].startsWith("rk_");
    addCandidate("Stripe API", "api", isSecret ? "secret_key" : "publishable_key", m[1], "https://api.stripe.com", "Auto-detected Stripe Key");
  }

  // 7. Fal.ai API Keys (uuid:hash format)
  const falMatches = rawText.matchAll(/\b([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:[a-f0-9]{32})\b/gi);
  for (const m of falMatches) {
    addCandidate("Fal.ai API", "api", "api_key", m[1], "https://fal.ai", "Auto-detected Fal.ai Key Secret");
  }

  // 8. Paddle Merchant API Keys
  const paddleMatches = rawText.matchAll(/\b(pdl_(?:sdbx|live)_apikey_[0-9a-zA-Z_]+)\b/g);
  for (const m of paddleMatches) {
    addCandidate("Paddle Payments", "api", "api_key", m[1], "https://paddle.com", "Auto-detected Paddle API Key");
  }

  // 9. Hugging Face Tokens (hf_...)
  const hfMatches = rawText.matchAll(/\b(hf_[A-Za-z0-9]{34,})\b/g);
  for (const m of hfMatches) {
    addCandidate("Hugging Face", "api", "token", m[1], "https://huggingface.co", "Auto-detected Hugging Face Token");
  }

  // 10. Slack Tokens (xoxb-, xoxp-, etc.)
  const slackMatches = rawText.matchAll(/\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g);
  for (const m of slackMatches) {
    addCandidate("Slack Token", "token", "bot_or_user", m[1], "https://slack.com", "Auto-detected Slack API Token");
  }

  // 11. JWT Tokens (eyJ...)
  const jwtMatches = rawText.matchAll(/\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g);
  for (const m of jwtMatches) {
    addCandidate("JWT Bearer Token", "token", "bearer", m[1], "", "Auto-detected JSON Web Token");
  }

  // 12. AWS Access Keys (AKIA...)
  const awsMatches = rawText.matchAll(/\b(AKIA[0-9A-Z]{16})\b/g);
  for (const m of awsMatches) {
    addCandidate("AWS Access Key", "token", m[1], m[1], "https://aws.amazon.com", "Auto-detected AWS IAM Access Key");
  }

  // 13. Database Connection URIs (postgres://, mysql://, mongodb://, redis://)
  const dbMatches = rawText.matchAll(/((?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|sqlite|mssql):\/\/[^\s"'`]+)/gi);
  for (const m of dbMatches) {
    const uri = m[1];
    let host = "";
    let user = "";
    let serv = "Database URI";

    try {
      const parsed = new URL(uri);
      serv = `${parsed.protocol.replace(":", "").toUpperCase()} Database`;
      host = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      user = parsed.username || "";
    } catch {
      if (uri.startsWith("postgres")) serv = "PostgreSQL DB";
      else if (uri.startsWith("mysql")) serv = "MySQL DB";
      else if (uri.startsWith("mongodb")) serv = "MongoDB";
      else if (uri.startsWith("redis")) serv = "Redis Instance";
    }

    addCandidate(serv, "db", user, uri, host, "Auto-detected connection string");
  }

  // 14. Curl Basic Auth credentials: curl -u "user:pass" or curl -u user:pass
  const curlAuthMatches = rawText.matchAll(/curl\b[^;\n]*?-[uU]\s*(?:"([^:"\r\n]+):([^"\r\n]+)"|'([^:'\r\n]+):([^'\r\n]+)'|([^\s:"']+):([^\s"']+))/g);
  for (const m of curlAuthMatches) {
    const user = (m[1] || m[3] || m[5] || "").trim();
    const pass = (m[2] || m[4] || m[6] || "").trim();
    if (user && pass) {
      const idx = typeof m.index === "number" ? m.index : 0;
      const lineOfCurl = rawText.slice(idx).split(/\r?\n/)[0];
      const urlMatch = lineOfCurl.match(/https?:\/\/[^\s"']+/);
      const host = urlMatch ? urlMatch[0] : "";
      addCandidate("API Basic Auth (cURL)", "api", user, pass, host, "Extracted from cURL basic authentication");
    }
  }

  // 15. Bank IBAN Numbers (e.g. RO65BTRL...)
  const ibanMatches = rawText.matchAll(/\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/g);
  for (const m of ibanMatches) {
    const iban = m[1];
    if (iban.length >= 15 && iban.length <= 34) {
      addCandidate("Bank IBAN Account", "token", "IBAN", iban, "", "Auto-detected International Bank Account Number");
    }
  }

  // 16. Vehicle VIN / Chassis ID (17 chars standard ISO 3779)
  const vinMatches = rawText.matchAll(/\b([A-HJ-NPR-Z0-9]{17})\b/g);
  for (const m of vinMatches) {
    const vin = m[1];
    if (/[A-Z]/.test(vin) && /[0-9]/.test(vin) && !/^[0-9a-f]{17}$/i.test(vin)) {
      addCandidate("Vehicle VIN / Chassis", "token", "VIN", vin, "", "Auto-detected Vehicle Chassis / VIN ID");
    }
  }

  // 17. Multi-line Blocks & Contextual Password Scraper
  const lines = rawText.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;

    // Pattern A: .env / ini format (KEY=VALUE or KEY: VALUE)
    const kvMatch = line.match(/^(?:export\s+)?([A-Za-z0-9_.\-]+)\s*[:=]\s*["']?([^"'\r\n]+)["']?$/);
    if (kvMatch) {
      const keyName = kvMatch[1].trim();
      const val = kvMatch[2].trim();

      const sensitivePattern = /(?:PASS|PASSWORD|SECRET|KEY|TOKEN|AUTH|CREDENTIAL|PRIVATE|DATABASE_URL|CLIENT_SECRET|JWT|HASH|SALT|ACCESS_KEY|API_KEY|BEARER|PIN)/i;
      if (sensitivePattern.test(keyName) && val.length >= 4) {
        let cat: "api" | "login" | "db" | "token" = "api";
        let servName = keyName.replace(/_/g, " ");

        if (/PASS|PASSWORD|PWD|PIN/i.test(keyName)) {
          cat = "login";
        } else if (/DB|DATABASE|POSTGRES|MYSQL|MONGO|REDIS/i.test(keyName)) {
          cat = "db";
        } else if (/TOKEN|SSH|PGP|KEY/i.test(keyName)) {
          cat = "token";
        }

        if (/OPENAI/i.test(keyName)) servName = "OpenAI API";
        else if (/ANTHROPIC|CLAUDE/i.test(keyName)) servName = "Anthropic Claude";
        else if (/GEMINI|GOOGLE/i.test(keyName)) servName = "Google Gemini";
        else if (/STRIPE/i.test(keyName)) servName = "Stripe Payments";
        else if (/GITHUB|GIT/i.test(keyName)) servName = "GitHub API";
        else if (/SUPABASE/i.test(keyName)) servName = "Supabase API";
        else if (/VERCEL/i.test(keyName)) servName = "Vercel Token";

        addCandidate(servName, cat, keyName.toLowerCase(), val, "", `Extracted from key "${keyName}"`);
      }
    }

    // Pattern B: Explicit service & password on single line:
    // e.g. "wolfscent hetnzer pass: jfaXCXU4Ckef" or "hetzner pass: fT4drNRwVaJu" or "wordpress pass local: M7T1fWjvAJRU"
    // e.g. "asura host:o29M5~*04R6*" or "ROVINIETA PASS 4RyrQ#WqvJD+@@="
    const inlinePassMatch = line.match(/^(.+?)\s*(?:pass|password|parola|pwd|host|key|scerte key)\s*[:=]\s*([^\s]{4,})$/i);
    if (inlinePassMatch && !line.includes("http://") && !line.includes("https://")) {
      const sName = inlinePassMatch[1].replace(/[:=_-]/g, " ").trim() || "Service Account";
      if (!/^(?:pass|password|pwd|parola|user|username|email)$/i.test(sName)) {
        const pass = inlinePassMatch[2].trim();
        addCandidate(sName, "login", "", pass, "", `Inline password detected for ${sName}`);
      }
    }

    // Pattern C: Dual pass & email on single line:
    // e.g. "erovinieta pass lU022201o email dragutaenache58@gmail.com"
    const dualMatch = line.match(/(?:pass|password|parola)\s+([^\s]{4,})\s+(?:email|user|username)\s+([^\s@]+@[^\s@]+\.[^\s@]+|[^\s]{3,})/i) ||
                      line.match(/(?:email|user|username)\s+([^\s@]+@[^\s@]+\.[^\s@]+|[^\s]{3,})\s+(?:pass|password|parola)\s+([^\s]{4,})/i);
    if (dualMatch) {
      const pass = dualMatch[1].includes("@") ? dualMatch[2] : dualMatch[1];
      const user = dualMatch[1].includes("@") ? dualMatch[1] : dualMatch[2];
      const serviceName = line.split(/\s+/)[0] || "Online Service";
      addCandidate(serviceName, "login", user, pass, "", `Account credentials for ${serviceName}`);
    }

    // Pattern D: "email: ... \n pass ..." or "user: ... \n pass: ..." in consecutive lines
    if (/^(?:user|username|email|cont|login)\s*[:=]?\s*([^\s]{3,})$/i.test(line)) {
      const uMatch = line.match(/^(?:user|username|email|cont|login)\s*[:=]?\s*([^\s]{3,})$/i);
      const user = uMatch ? uMatch[1] : "";
      let serv = "Account Login";
      // Look back up to 3 lines for a meaningful service name
      for (let b = 1; b <= 3 && i - b >= 0; b++) {
        const bline = lines[i - b].trim();
        if (bline && !bline.includes("://") && !bline.includes("=") && bline.length <= 40 && !/^(user|pass|email|login|cont)/i.test(bline)) {
          serv = bline;
          break;
        }
      }
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
      const pMatch = nextLine.match(/^(?:pass|password|parola|pwd)\s*[:=]?\s*([^\s]{4,})$/i) ||
                     nextLine.match(/^([^\s]{4,})\s+(?:pass|password)$/i);
      if (pMatch) {
        const pass = pMatch[1];
        addCandidate(serv, "login", user, pass, "", `Extracted user/pass pair for ${serv}`);
      }
    }

    // Pattern E: Three-line block: Service \n Username/Email \n Password
    // e.g.:
    // mail chimp
    // wolfitway@gmail.com
    // A&rJ:ez])rqQ5]r
    if (i + 2 < lines.length) {
      const l1 = line;
      const l2 = lines[i + 1].trim();
      const l3 = lines[i + 2].trim();

      const isL1Title = l1.length >= 2 && l1.length <= 40 && !l1.includes("://") && !l1.includes("=") && !/^(user|pass|email|login)/i.test(l1);
      const isL2User = l2.length >= 3 && l2.length <= 50 && (!l2.includes(" ") || l2.includes("@")) && !l2.includes("://");
      const isL3Pass = l3.length >= 6 && l3.length <= 60 && !l3.includes(" ") && !l3.includes("://") && /[0-9A-Z]/.test(l3) && /[^a-zA-Z0-9]/.test(l3);

      if (isL1Title && isL2User && isL3Pass) {
        addCandidate(l1, "login", l2, l3, "", `Multi-line account block (${l1})`);
      }
    }

    // Pattern F: Standalone 2-line block: Service \n Password
    // e.g.:
    // asurhosting
    // 'HEE>Vw@&9+yL~R
    if (i + 1 < lines.length) {
      const l1 = line;
      const l2 = lines[i + 1].trim();
      const isL1Service = l1.length >= 3 && l1.length <= 35 && !l1.includes("://") && !l1.includes("=") && /^[a-zA-Z0-9\s_\-]+$/.test(l1) && !/^(https?|curl|export|const|let|var|function|return|import)/i.test(l1);
      const isL2Secret = l2.length >= 8 && l2.length <= 50 && !l2.includes(" ") && /[A-Z]/.test(l2) && /[0-9]/.test(l2) && /[^a-zA-Z0-9]/.test(l2);
      if (isL1Service && isL2Secret && /hosting|host|server|pass|secret|account|vpn|db|key/i.test(l1)) {
        addCandidate(l1, "login", "", l2, "", `Detected service credentials for ${l1}`);
      }
    }

    // Pattern G: "username : password" or "email : password"
    const userPassMatch = line.match(/^([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|[a-zA-Z0-9_.\-]+)\s*[:|,\t]\s*([^\s]{5,})$/);
    if (userPassMatch && !line.includes("http") && !line.includes("://") && !line.includes("=") && !line.startsWith("sk-")) {
      const u = userPassMatch[1].trim();
      const p = userPassMatch[2].trim();
      // Skip label headers like "user: ..." or "email: ..." or "pass: ..."
      if (!/^(?:user|username|email|pass|password|pwd|host|login|cont)$/i.test(u)) {
        addCandidate("Account Login", "login", u, p, "", `User/Pass combo (${u})`);
      }
    }

    // Pattern H: "bt online p!iXMwv--=.7J6S" or "sevici comisariat vamal 69ZwPp4UEP6"
    const loosePassMatch = line.match(/^([a-zA-Z0-9\s]{3,30})\s+([a-zA-Z0-9~!@#$%^&*()_+=\-{}[\]|\\:;"'<>,.?/]{8,35})$/);
    if (loosePassMatch && !line.includes("://") && !line.toLowerCase().startsWith("http") && !line.includes("euro")) {
      const servCandidate = loosePassMatch[1].trim();
      const passCandidate = loosePassMatch[2].trim();
      if (/[0-9]/.test(passCandidate) && /[a-zA-Z]/.test(passCandidate) && !/^(true|false|null|undefined)$/i.test(passCandidate)) {
        if (/online|vamal|servici|comisariat|pass|token|net/i.test(servCandidate)) {
          addCandidate(servCandidate, "login", "", passCandidate, "", `Detected credential string for ${servCandidate}`);
        }
      }
    }
  }

  return candidates;
}
