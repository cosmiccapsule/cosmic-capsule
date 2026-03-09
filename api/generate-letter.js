export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { theme } = await req.json();

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
      messages: [{ role: "user", content: `Write a warm anonymous positive letter to a stranger for Cosmic Capsule.
Theme: "${theme.label}" — ${theme.prompt}
Rules:
- 3-5 sentences, heartfelt and genuine
- Sound like a real human wrote this, not an AI
- No names or personal info or social handles
- No em dashes (—), no hyphens used as pauses, no ampersands (&)
- No lists, no bullet points, no colons introducing things
- No overly poetic or flowery language — keep it grounded and real
- Vary sentence length naturally, like how people actually write
- End with one fitting emoji
Respond with ONLY the letter text.` }],
    }),
  });

  const d = await r.json();
  const text = d.content?.map(b => b.text || "").join("").trim();
  return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
}
