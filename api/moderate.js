export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ approved: false, reason: "bad json" }), { headers: { "Content-Type": "application/json" } });
  }

  const message = body.message || "";

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 100,
        messages: [
          { role: "system", content: `You are a content moderator for Cosmic Capsule, a positive anonymous letter app. Respond ONLY with valid JSON, no other text.` },
          { role: "user", content: `REJECT if: profanity, violence, threats, hate speech, bullying, sexual content, self-harm, negativity, insults, personal info (emails, phones, social handles, URLs), spam, or promotion. APPROVE only if genuinely kind, warm, uplifting, or positive. Respond ONLY with: {"approved": true, "reason": "..."} or {"approved": false, "reason": "..."}
Letter: "${message.replace(/"/g, '\\"')}"` }
        ],
      }),
    });
    const d = await r.json();
    if (d.error) return new Response(JSON.stringify({ approved: true, reason: "moderation unavailable" }), { headers: { "Content-Type": "application/json" } });
    const text = d.choices?.[0]?.message?.content?.trim().replace(/```json|```/g, "") || "";
    const result = JSON.parse(text);
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ approved: true, reason: "moderation unavailable" }), { headers: { "Content-Type": "application/json" } });
  }
}
