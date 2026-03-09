export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch (e) {
    return new Response(JSON.stringify({ approved: false, reason: "bad json" }), { headers: { "Content-Type": "application/json" } });
  }

  const message = body.message || "";

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
        messages: [{ role: "user", content: `You are a content moderator for Cosmic Capsule, a positive anonymous letter app.
REJECT if: profanity, violence, threats, hate speech, bullying, sexual content, self-harm, negativity, insults, personal info (emails, phones, social handles, URLs), spam, or promotion.
APPROVE only if genuinely kind, warm, uplifting, or positive.
Respond ONLY with valid JSON: {"approved": true, "reason": "..."} or {"approved": false, "reason": "..."}
Letter: "${message.replace(/"/g, '\\"')}"` }],
      }),
    });
    d = await r.json();
  } catch (e) {
    return new Response(JSON.stringify({ approved: true, reason: "moderation unavailable" }), { headers: { "Content-Type": "application/json" } });
  }

  if (d.error) {
    return new Response(JSON.stringify({ approved: true, reason: "moderation unavailable" }), { headers: { "Content-Type": "application/json" } });
  }

  try {
    const text = d.content?.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ approved: true, reason: "moderation parse error" }), { headers: { "Content-Type": "application/json" } });
  }
}
