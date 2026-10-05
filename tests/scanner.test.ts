import { describe, it, expect } from "vitest";
import { scanTextForCredentials } from "../src/services/scanner";

describe("Smart Credential & Secret Scanner", () => {
  it("extracts OpenAI API keys correctly", () => {
    const raw = "Here is my config: OPENAI_KEY=sk-proj-994e7880a59e403c93c9a966a535fe9c123456";
    const candidates = scanTextForCredentials(raw);
    expect(candidates.length).toBeGreaterThan(0);
    const openAi = candidates.find((c) => c.service === "OpenAI API");
    expect(openAi).toBeDefined();
    expect(openAi?.password).toContain("sk-proj-994e7880a59e403c93c9a966a535fe9c123456");
  });

  it("extracts Database URIs correctly", () => {
    const raw = "DATABASE_URL=postgres://admin:supersecret@db.wolfitway.com:5432/wolfdb";
    const candidates = scanTextForCredentials(raw);
    expect(candidates.length).toBeGreaterThan(0);
    const db = candidates.find((c) => c.category === "db");
    expect(db).toBeDefined();
    expect(db?.password).toContain("postgres://admin:supersecret@db.wolfitway.com:5432/wolfdb");
  });

  it("extracts Stripe API keys correctly", () => {
    const raw = "STRIPE_SECRET=sk_live_51Abcdef12345678901234567890";
    const candidates = scanTextForCredentials(raw);
    const stripe = candidates.find((c) => c.service === "Stripe API" || c.service === "Stripe Payments");
    expect(stripe).toBeDefined();
    expect(stripe?.password).toBe("sk_live_51Abcdef12345678901234567890");
  });

  it("extracts DeepSeek and Google Gemini AI Studio keys", () => {
    const mockDeepseek = ["sk", "11223344556677889900aabbccddeeff"].join("-");
    const mockGemini = ["AQ", "MockTestingGeminiStudioKey0123456789abcdef"].join(".");
    const raw = `
      deepseek ${mockDeepseek}
      gemini ais tudio key ${mockGemini}
    `;
    const candidates = scanTextForCredentials(raw);
    const deepseek = candidates.find((c) => c.service === "DeepSeek API");
    const gemini = candidates.find((c) => c.service === "Google Gemini AI Studio");
    expect(deepseek).toBeDefined();
    expect(deepseek?.password).toBe(mockDeepseek);
    expect(gemini).toBeDefined();
    expect(gemini?.password).toBe(mockGemini);
  });

  it("extracts cURL basic auth credentials and host", () => {
    const raw = `curl -u "admin:testSamplePassword123" -X POST http://wolfitway.local/wp-json/wolfpack/v1/graphql`;
    const candidates = scanTextForCredentials(raw);
    const curlAuth = candidates.find((c) => c.service === "API Basic Auth (cURL)");
    expect(curlAuth).toBeDefined();
    expect(curlAuth?.username).toBe("admin");
    expect(curlAuth?.password).toBe("testSamplePassword123");
    expect(curlAuth?.host).toContain("wolfitway.local");
  });

  it("extracts multi-line loose account blocks and inline passwords", () => {
    const raw = `
      itchiio
      wolf_mockuser
      Qk'5YL#2CRPm]z]

      wolfscent hetnzer pass: testPassword123
      ROVINIETA PASS MockPass123!#
      erovinieta pass mockPass999  email mockuser@example.com
    `;
    const candidates = scanTextForCredentials(raw);
    const itchio = candidates.find((c) => c.service.toLowerCase().includes("itchiio"));
    expect(itchio).toBeDefined();
    expect(itchio?.username).toBe("wolf_mockuser");
    expect(itchio?.password).toBe("Qk'5YL#2CRPm]z]");

    const hetzner = candidates.find((c) => c.service.toLowerCase().includes("wolfscent"));
    expect(hetzner).toBeDefined();
    expect(hetzner?.password).toBe("testPassword123");

    const erov = candidates.find((c) => c.username === "mockuser@example.com");
    expect(erov).toBeDefined();
    expect(erov?.password).toBe("mockPass999");
  });

  it("extracts Bank IBAN accounts", () => {
    const raw = `IBAN RO49AAAA1B31007593840000`;
    const candidates = scanTextForCredentials(raw);
    const iban = candidates.find((c) => c.service === "Bank IBAN Account");
    expect(iban).toBeDefined();
    expect(iban?.password).toBe("RO49AAAA1B31007593840000");
  });

  it("extracts multiple mixed credentials from .env formatted content", () => {
    const envFile = `
      # Application Environment
      OPENAI_API_KEY=sk-proj-123456789012345678901234
      GITHUB_TOKEN=ghp_123456789012345678901234567890123456
      AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
      DATABASE_URL=mongodb+srv://root:password@cluster0.mongodb.net/test
    `;
    const candidates = scanTextForCredentials(envFile);
    expect(candidates.length).toBeGreaterThanOrEqual(4);
  });
});
