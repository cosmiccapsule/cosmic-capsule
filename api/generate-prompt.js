export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch (e) {
    return new Response(JSON.stringify({ prompt: "" }), { headers: { "Content-Type": "application/json" } });
  }

  const theme = body.theme || {};
  const label = theme.label || "Open Heart";
  const themePrompt = theme.prompt || "";

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
        model: "claude-opus-4-5",
        max_tokens: 200,
        messages: [{ role: "user", content: `Generate a short inspiring writing prompt for someone writing a positive anonymous letter. Theme: "${label}" — ${themePrompt}. One sentence, max 20 words, start with "Write about..." or "Tell a stranger..." or "Share...". Prompt only, nothing else.` }],
      }),
    });
    d = await r.json();
  } catch (e) {
    return new Response(JSON.stringify({ prompt: "", error: e.message }), { headers: { "Content-Type": "application/json" } });
  }

  if (d.error) {
    return new Response(JSON.stringify({ prompt: "", error: d.error.message || JSON.stringify(d.error) }), { headers: { "Content-Type": "application/json" } });
  }

  const prompt = d.content?.map(b => b.text || "").join("").trim() || "";
  return new Response(JSON.stringify({ prompt }), { headers: { "Content-Type": "application/json" } });
}
