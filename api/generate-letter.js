export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ text: "", error: "bad json" }), { headers: { "Content-Type": "application/json" } });
  }

  const theme = body.theme || {};
  const label = theme.label || "Open Heart";
  const prompt = theme.prompt || "Write a warm, open-hearted letter to a stranger.";

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 300,
        messages: [
          { role: "system", content: "You write warm, heartfelt anonymous letters to strangers. Write naturally like a real human — no em dashes, no lists, no structured writing. Just genuine warmth." },
          { role: "user", content: `Write a warm anonymous positive letter to a stranger. Theme: "${label}" — ${prompt}. Rules: 3-5 sentences, heartfelt, genuine, no names or handles, end with a fitting emoji. Write the letter only, nothing else.` }
        ],
      }),
    });
    const d = await r.json();
    if (d.error) return new Response(JSON.stringify({ text: "", error: d.error.message }), { headers: { "Content-Type": "application/json" } });
    const text = d.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ text: "", error: e.message }), { headers: { "Content-Type": "application/json" } });
  }
}
