export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch (e) {
    return new Response(JSON.stringify({ text: "", error: "bad json" }), { headers: { "Content-Type": "application/json" } });
  }

  const theme = body.theme || {};
  const label = theme.label || "Open Heart";
  const prompt = theme.prompt || "Write a warm, open-hearted letter to a stranger.";

  let d;
  try {
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
        messages: [{ role: "user", content: `Write a warm anonymous positive letter to a stranger. Theme: "${label}". 3-5 sentences, heartfelt, end with an emoji. Letter only, no sign-off.` }],
      }),
    });
    d = await r.json();
  } catch (e) {
    return new Response(JSON.stringify({ text: "", error: e.message }), { headers: { "Content-Type": "application/json" } });
  }

  if (d.error) {
    return new Response(JSON.stringify({ text: "", error: d.error.message || JSON.stringify(d.error) }), { headers: { "Content-Type": "application/json" } });
  }

  const text = d.content?.map(b => b.text || "").join("").trim() || "";
  return new Response(JSON.stringify({ text, debug: d.stop_reason }), { headers: { "Content-Type": "application/json" } });
}
