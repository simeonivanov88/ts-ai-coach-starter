// api/chat.js
// Simple Node.js Serverless Function for Vercel

export default async function handler(req, res) {
  // Allow basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Use POST");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).send("Missing OPENAI_API_KEY");
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const messages = [
    { role: "system", content: `
      You are the official Trading Singularity AI Coach for Simeon Ivanov's community.
      Tone: direct, motivating, data-driven, zero fluff.
      Focus on trading performance, mindset, and consistency.
      Never give financial advice. Always end with one actionable insight.
    `},
    ...(body.messages || [])
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content || "No response";
  res.status(200).json({ reply });
}
