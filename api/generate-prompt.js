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
      max_tokens: 200,
      messages: [{ role: "user", content: `Generate a short inspiring writing prompt for someone writing a positive anonymous letter.
Theme: "${theme.label}" — ${theme.prompt}
Rules: One sentence max 20 words, spark emotion, start with "Write about..." or "Tell a stranger..." or "Share..."
Respond with ONLY the prompt.` }],
    }),
  });

  const d = await r.json();
  const text = d.content?.map(b => b.text || "").join("").trim();
  return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
}
