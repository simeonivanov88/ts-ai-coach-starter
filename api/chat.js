// api/chat.js
// Trading Singularity AI Coach — fixed to GPT-5-mini
// Fast, stable, safe CORS, no fallback, no buy/sell advice.

const MODEL = "gpt-5-mini";
const MAX_TOKENS = 900;
const TEMP = 0.3;

// Whitelist the domains allowed to call this API
// Example: "https://ts-ai-coach-front.vercel.app,https://yourname.mykajabi.com"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// ---------- System Prompt ----------
const SYSTEM_PROMPT = `
You are the official Trading Singularity AI Coach.
Be an elite performance analyst — quantify, diagnose, and teach.
Do NOT give buy/sell recommendations or individualized financial advice.

When the user provides trade or journal data (text or CSV-like), do ALL of this:
1. Compute metrics: count, win rate, average R, expectancy (E = WinRate*AvgWinR - (1-WinRate)*AvgLossR),
   profit factor, average hold time, streaks, and any pattern metrics visible.
2. Diagnose discipline leaks: overtrading, revenge trading, size creep, stop violations, FOMO, hesitation.
3. Identify ONE highest-leverage fix and 2–3 supporting rules.
4. Create a short weekly plan (checklist) and a KPI to track progress.

FORMAT OUTPUT AS:
- Snapshot (key metrics)
- Pattern insights
- Risks & discipline leaks
- One Big Fix (why it matters)
- 3 Rules for next 5 sessions (numbered)
- KPI to track (definition + target)
- Reflection question

If data is missing, ask for: date, symbol, direction, entry, stop, exit, size, R result, and notes.
Tone: direct, motivating, zero fluff. End with one reflection question.
`.trim();

// ---------- Helper: set CORS headers ----------
function setCors(res, origin) {
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (ALLOWED_ORIGINS.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  setCors(res, origin);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const userMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: TEMP,
        max_tokens: MAX_TOKENS,
        messages
      })
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = data?.error?.message || `OpenAI error (${r.status})`;
      res.status(r.status).json({ error: msg, model_used: MODEL });
      return;
    }

    const reply = data?.choices?.[0]?.message?.content || "";
    res.status(200).json({
      reply,
      model_used: MODEL,
      usage: data?.usage
    });
  } catch (e) {
    res.status(500).json({ error: "Network error", detail: String(e) });
  }
}
