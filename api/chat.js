// api/chat.js — Node.js Serverless Function (returns JSON, with errors surfaced)
export default async function handler(req, res) {
  // Basic CORS (tighten later)
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const userMessages = Array.isArray(body.messages) ? body.messages : [];

  const messages = [
    { role: "system", content: `
      You are the official Trading Singularity AI Coach for Simeon Ivanov's community.
      Tone: direct, motivating, data-driven, zero fluff.
      Focus on trading performance, discipline and consistency. No financial advice.
      End each reply with one actionable insight.
    `},
    ...userMessages
  ];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 400,
        temperature: 0.4
      })
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // Surface upstream error message
      return res.status(r.status).json({ error: data?.error?.message || "OpenAI error" });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(200).json({ error: "Empty response from model" });

    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
}
