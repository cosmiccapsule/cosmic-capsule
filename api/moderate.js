export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { message } = await req.json();

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
      messages: [{ role: "user", content: `You moderate Cosmic Capsule, an anonymous positive letter app. Anonymity is sacred.

REJECT if the message contains ANY of:
- Email addresses, phone numbers, URLs, or social media handles
- The sender's real name or any identifying signature (e.g. "- John", "Love, Sarah", "From Mike", "Sincerely, Alex")
- Profanity, threats, violence, hate speech, bullying, or harassment
- Sexual content, self-harm references, or anything hurtful
- Spam, promotions, requests to contact or meet the sender
- Negativity or content that could hurt the reader

APPROVE only if: genuinely kind, warm, uplifting, no personal info whatsoever.

Reply ONLY with JSON, no extra text:
{"approved":true,"reason":"ok"} or {"approved":false,"reason":"short reason"}

Letter: "${message.replace(/"/g, '\\"')}"` }],
    }),
  });

  const d = await r.json();
  const text = d.content?.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
  return new Response(text, { headers: { "Content-Type": "application/json" } });
}
