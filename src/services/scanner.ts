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
    const dedupeKey = `${cleanServ}::${cleanUser}::${cleanPass}`;
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

  // 1. OpenAI API Keys (sk-..., sk-proj-...)
  const openAiMatches = rawText.matchAll(/\b(sk-(?:proj-)?[a-zA-Z0-9_\-]{20,})\b/g);
  for (const m of openAiMatches) {
    addCandidate("OpenAI API", "api", "api_key", m[1], "https://api.openai.com", "Auto-detected OpenAI API Key");
  }

  // 2. Anthropic Claude API Keys (sk-ant-...)
  const anthropicMatches = rawText.matchAll(/\b(sk-ant-[a-zA-Z0-9_\-]{20,})\b/g);
  for (const m of anthropicMatches) {
    addCandidate("Anthropic Claude", "api", "api_key", m[1], "https://api.anthropic.com", "Auto-detected Anthropic Key");
  }

  // 3. Google Gemini / Cloud Keys (AIza...)
  const googleMatches = rawText.matchAll(/\b(AIza[0-9A-Za-z\-_]{35})\b/g);
  for (const m of googleMatches) {
    addCandidate("Google Gemini AI", "api", "api_key", m[1], "https://generativelanguage.googleapis.com", "Auto-detected Google Cloud API Key");
  }

  // 4. GitHub Personal Access Tokens / OAuth (ghp_..., github_pat_...)
  const githubMatches = rawText.matchAll(/\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/g);
  for (const m of githubMatches) {
    addCandidate("GitHub Token", "api", "token", m[1], "https://github.com", "Auto-detected GitHub Access Token");
  }

  // 5. Stripe API Keys (sk_live_..., rk_live_..., pk_live_...)
  const stripeMatches = rawText.matchAll(/\b([rs]k_(?:test|live)_[0-9a-zA-Z]{24,}|pk_(?:test|live)_[0-9a-zA-Z]{24,})\b/g);
  for (const m of stripeMatches) {
    const isSecret = m[1].startsWith("sk_") || m[1].startsWith("rk_");
    addCandidate("Stripe API", "api", isSecret ? "secret_key" : "publishable_key", m[1], "https://api.stripe.com", "Auto-detected Stripe Key");
  }

  // 6. AWS Access Keys (AKIA...)
  const awsMatches = rawText.matchAll(/\b(AKIA[0-9A-Z]{16})\b/g);
  for (const m of awsMatches) {
    addCandidate("AWS Access Key", "token", m[1], m[1], "https://aws.amazon.com", "Auto-detected AWS IAM Access Key");
  }

  // 7. Database Connection URIs (postgres://, mysql://, mongodb://, redis://)
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

  // 8. Line-by-Line Key-Value Parser (.env, ini, notes, exports)
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    const kvMatch = trimmed.match(/^(?:export\s+)?([A-Za-z0-9_.\-]+)\s*[:=]\s*["']?([^"'\r\n]+)["']?$/);
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

    // Pattern: username : password or email : password
    const userPassMatch = trimmed.match(/^([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|[a-zA-Z0-9_.\-]+)\s*[:|,\t]\s*([^\s]{5,})$/);
    if (userPassMatch && !trimmed.includes("http") && !trimmed.includes("://") && !trimmed.includes("=") && !trimmed.startsWith("sk-")) {
      const u = userPassMatch[1].trim();
      const p = userPassMatch[2].trim();
      addCandidate("Account Login", "login", u, p, "", `User/Pass combo (${u})`);
    }
  }

  return candidates;
}
