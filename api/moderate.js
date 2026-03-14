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
          { role: "user", content: `You are moderating anonymous letters for Cosmic Capsule, a letter exchange app. Letters can be warm, uplifting, reflective, sad, vulnerable, or honest — real human emotion is welcome. REJECT only if the letter contains: bullying or insults directed at someone, threats or violent language, hate speech or discrimination, sexual content, self-harm encouragement, personal information (emails, phone numbers, addresses, locations), links or URLs, spam or repetitive content, promotion or advertising. APPROVE letters that are genuine and human, even if they express sadness, loneliness, grief, or pain — as long as they are not harmful. Respond ONLY with: {"approved": true, "reason": "..."} or {"approved": false, "reason": "..."}
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
