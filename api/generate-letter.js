export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ text: "" }), { headers: { "Content-Type": "application/json" } }); }

  const theme = body.theme || {};
  const label = theme.label || "Open Heart";
  const prompt = theme.prompt || "Write a warm, open-hearted letter to a stranger.";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: `Write a warm anonymous positive letter to a stranger for Cosmic Capsule.\nTheme: "${label}" — ${prompt}\nRules:\n- 3-5 sentences, heartfelt and genuine\n- Sound like a real human wrote this, not an AI\n- No names or personal info or social handles\n- No em dashes, no hyphens as pauses, no ampersands\n- No lists, no bullet points\n- Keep it grounded and real\n- Vary sentence length naturally\n- No sign-off or signature\n- End with one fitting emoji\nRespond with ONLY the letter text.` }],
    }),
  });

  const d = await r.json();
  const text = d.content?.map(b => b.text || "").join("").trim() || "";
  return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
}
