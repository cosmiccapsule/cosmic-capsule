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
          { role: "system", content: "You write short anonymous notes to strangers. Sound like a real person — warm, genuine, a little unpolished. Not a greeting card. No grand declarations or flowery language. Short, honest sentences. Never use em dashes or hyphens to join clauses." },
          { role: "user", content: `Write a short anonymous note to a stranger. Theme: "${label}" — ${prompt}. 3-4 sentences max. Warm and human. No dashes. End with one emoji. Just the note.` }
        ],
      }),
    });
    const d = await r.json();
    if (d.error) return new Response(JSON.stringify({ text: "", error: d.error.message }), { headers: { "Content-Type": "application/json" } });
    const raw = d.choices?.[0]?.message?.content?.trim() || "";
    const text = raw.replace(/—/g, ",").replace(/ - /g, ", ").replace(/–/g, ",");
    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ text: "", error: e.message }), { headers: { "Content-Type": "application/json" } });
  }
}
