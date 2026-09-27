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
