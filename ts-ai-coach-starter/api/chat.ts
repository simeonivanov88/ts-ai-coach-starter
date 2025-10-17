// api/chat.ts
export const config = { runtime: "edge" };

// Replace these with your real origins later (Step 3).
// Example: "https://your-subdomain.mykajabi.com"
const ALLOWED_ORIGINS = [
  "https://YOUR-KAJABI-DOMAIN",
  "https://YOUR-FRONTEND-DOMAIN"
];

const SYSTEM_PROMPT = `
You are the official Trading Singularity AI Coach for Simeon Ivanov's community.
Tone: direct, motivating, data-driven, zero fluff. 
Scope: performance & discipline coaching, trade journaling best-practices, pattern discovery, 
risk management hygiene, compounding logic, weekly reviews, habit building.
Never give personalized financial advice. Do not promise profits. 
End each reply with one actionable next step or reflection question.
`;

function okCors(origin: string | null) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return ALLOWED_ORIGINS.some(o => o === `${u.protocol}//${u.host}`);
  } catch { return false; }
}

function corsHeaders(origin: string | null) {
  const base: Record<string, string> = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (okCors(origin)) base["Access-Control-Allow-Origin"] = origin!;
  return base;
}

export default async function handler(req: Request) {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (!okCors(origin)) {
    return new Response("Origin not allowed", { status: 403, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response("Use POST", { status: 405, headers: corsHeaders(origin) });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing OPENAI_API_KEY", { status: 500 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  const userMessages = Array.isArray(body?.messages) ? body.messages : [];
  const model = body?.model || "gpt-4o-mini";
  const temperature = Math.max(0, Math.min(1, body?.temperature ?? 0.4));
  const max_tokens = Math.min(800, body?.max_tokens ?? 500);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...userMessages
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      stream: true,
      messages
    })
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.text().catch(() => "Upstream error");
    return new Response(err, { status: 500, headers: corsHeaders(origin) });
  }

  const headers = {
    ...corsHeaders(origin),
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive"
  };

  return new Response(resp.body, { status: 200, headers });
}
