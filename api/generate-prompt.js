export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ prompt: "" }), { headers: { "Content-Type": "application/json" } });
  }

  const theme = body.theme || {};
  const label = theme.label || "Open Heart";
  const themePrompt = theme.prompt || "";

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 60,
        messages: [
          { role: "system", content: "You generate short, inspiring writing prompts. One sentence only, no extra commentary." },
          { role: "user", content: `Generate a short inspiring writing prompt for someone writing a positive anonymous letter. Theme: "${label}" — ${themePrompt}. One sentence, max 20 words, start with "Write about..." or "Tell a stranger..." or "Share...". Prompt only, nothing else.` }
        ],
      }),
    });
    const d = await r.json();
    if (d.error) return new Response(JSON.stringify({ prompt: "", error: d.error.message }), { headers: { "Content-Type": "application/json" } });
    const prompt = d.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ prompt }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ prompt: "", error: e.message }), { headers: { "Content-Type": "application/json" } });
  }
}
