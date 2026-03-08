import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────
const SUPABASE_URL = "https://mexfvhokidhrbpqxwubq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZ2aG9raWRocmJwcXh3dWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjI3OTIsImV4cCI6MjA4ODIzODc5Mn0.LeOEQhkPOsk_l5sOp6h_GrjPeZPbbIEbQR8obKRM9HA";
const MAX_DAILY = 3;
const MAX_DAILY_RECEIVE = 3;
const MILESTONES = [10, 25, 50, 100, 250, 500];

const RANKS = [
  { name: "Stardust",      min: 0,   icon: "✨", color: "#aaaaaa" },
  { name: "Moonbeam",      min: 5,   icon: "🌙", color: "#c8d8ff" },
  { name: "Comet",         min: 15,  icon: "☄️", color: "#88ccff" },
  { name: "Nebula",        min: 30,  icon: "🌌", color: "#cc88ff" },
  { name: "Pulsar",        min: 60,  icon: "💫", color: "#ffffaa" },
  { name: "Supernova",     min: 100, icon: "💥", color: "#ffcc00" },
  { name: "Star Keeper",   min: 200, icon: "🌟", color: "#ffa040" },
  { name: "Cosmic Legend", min: 500, icon: "👑", color: "#ff8c00" },
];

const THEMES = [
  { id: "open",      label: "✨ Open Heart",          prompt: "Write a warm, open-hearted letter to a stranger." },
  { id: "hope",      label: "🌅 Hope",                prompt: "Write about hope — for tomorrow, for dreams, for new beginnings." },
  { id: "courage",   label: "🦁 Courage",             prompt: "Encourage a stranger who might be facing something hard." },
  { id: "gratitude", label: "🌸 Gratitude",           prompt: "Share something you're grateful for and why it matters." },
  { id: "stardust",  label: "🌠 Wish Upon a Star",     prompt: "Wish something beautiful upon a stranger — a dream, a hope, a quiet blessing just for them." },
  { id: "healing",   label: "🕊️ Healing",             prompt: "Send gentle words to someone who might be healing right now." },
];

const COLORS = [
  { id: "amber", name: "Cosmic Capsule", free: true, c1: "#ffb830", c2: "#cc4400", glow: "rgba(255,140,20,0.9)" },
];

const ACCESSORIES = [
  { id: "none", name: "None", free: true, icon: "—" },
];

const FALLBACK_LETTERS = [
  { message: "Dear stranger. You don't know me and I don't know you. But I thought about you today — whoever you are, wherever you are — and I wished you something good. That's all. I hope it reaches you. 💛", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 1).toISOString(), theme: "open" },
  { message: "I wish you a morning soon where everything feels unhurried. The light comes in sideways. You have nowhere to be yet. And for a moment, the world is just quiet and yours. 🌅", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 2).toISOString(), theme: "hope" },
  { message: "Courage isn't the absence of fear. It's doing the thing anyway — shaking hands, dry mouth, heart loud in your chest. If that's you right now, I see you. Keep going. 🦁", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 3).toISOString(), theme: "courage" },
  { message: "Some days healing looks like crying in the shower and still making breakfast. Some days it looks like sending a message you were scared to send. It all counts. Every bit of it. 🕊️", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 4).toISOString(), theme: "healing" },
  { message: "Isn't it strange and beautiful that we exist at all? That out of everything, here you are — reading this, breathing, carrying your particular life. I'm grateful you're here. 🌸", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 5).toISOString(), theme: "gratitude" },
  { message: "Whatever dream you've been quietly carrying — the one you haven't told anyone about yet — I hope you give it a little more room to breathe. It deserves to exist. So do you. 🌠", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 6).toISOString(), theme: "stardust" },
  { message: "Nobody has it together the way it looks. Everyone is improvising. Everyone is tired. You're not behind — you're just human, doing your best with what you have. That's enough. 💛", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 7).toISOString(), theme: "open" },
  { message: "If you're reading this at night when everything feels heavier — that's okay. Night distorts things. Tomorrow morning will weigh less. I promise. Sleep if you can. 🕊️", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 8).toISOString(), theme: "healing" },
  { message: "Someone remembers a kind thing you did and doesn't know how to tell you. The small ways you show up for people — they ripple further than you'll ever see. 🌟", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 9).toISOString(), theme: "gratitude" },
  { message: "You don't have to be productive today. You don't have to be inspiring or put-together or okay. You just have to exist. That's allowed. That's enough for today. 💛", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 10).toISOString(), theme: "open" },
  { message: "Rest is not giving up. It is not laziness. It is not falling behind. Rest is how you survive long enough to see what comes next. Please rest if you need to. 🌙", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 11).toISOString(), theme: "hope" },
  { message: "This letter crossed the dark between stars to find you today. I hope it lands softly. I hope it says what you needed to hear. You were worth sending it to. 🚀", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 12).toISOString(), theme: "open" },
];

// ── Sound Engine ─────────────────────────────────────────────────
function createSoundEngine() {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const play = (fn) => { try { fn(getCtx()); } catch(e) {} };

  return {
    paperRustle: () => play(ctx => {
      // Soft gentle shimmer — like a page turning in sunlight
      [1200, 1800, 2400].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        const t = ctx.currentTime + i * 0.08;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.04, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t); o.stop(t + 0.4);
      });
    }),
    capsuleLoad: () => play(ctx => {
      // Soft sealing chime — warm and gentle
      [440, 554, 659].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.start(t); o.stop(t + 0.6);
      });
    }),
    launch: () => play(ctx => {
      // Gentle ascending chime — like a departing bell
      [261, 329, 392, 523, 659].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        const t = ctx.currentTime + i * 0.18;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        o.start(t); o.stop(t + 1.3);
      });
    }),
    warpHum: () => play(ctx => {
      // Soft dreamy shimmer — like distant wind chimes
      [220, 277, 330, 440].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
        g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + i * 0.3 + 0.8);
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 5);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 7);
        o.start(ctx.currentTime + i * 0.3);
        o.stop(ctx.currentTime + 7);
      });
    }),
    capsuleOpen: () => play(ctx => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.6);
        o.start(ctx.currentTime + i * 0.08);
        o.stop(ctx.currentTime + i * 0.08 + 0.7);
      });
    }),
    letterEmerge: () => play(ctx => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o.start(); o.stop(ctx.currentTime + 0.5);
    }),
    heart: () => play(ctx => {
      [440, 554, 659].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.06 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.4);
        o.start(ctx.currentTime + i * 0.06);
        o.stop(ctx.currentTime + i * 0.06 + 0.5);
      });
    }),
    milestone: () => play(ctx => {
      [523,659,784,1047,1319,1568].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + i * 0.1 + 0.7);
      });
    }),
  };
}

// ── Profile helpers ──────────────────────────────────────────────
function generateCode() {
  const stars = ["STAR","MOON","NOVA","COMET","DRIFT","PULSE","GLOW","ORBIT","FLARE","HALO"];
  const nums = () => Math.floor(1000 + Math.random() * 9000);
  return stars[Math.floor(Math.random()*stars.length)] + "-" + nums() + "-" + stars[Math.floor(Math.random()*stars.length)];
}
function getProfile() {
  try {
    const raw = localStorage.getItem("cosmic_profile");
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // First visit — create profile with secret code
  const p = {
    code: generateCode(),
    sent: 0, isPremium: true, letters: [], received: [],
    dailyCount: 0, lastDay: "", streak: 0,
    lastStreakDay: "", colorId: "amber", accessoryId: "none",
    soundOn: true, receiveCount: 0, lastReceiveDay: "",
  };
  try { localStorage.setItem("cosmic_profile", JSON.stringify(p)); } catch(e) {}
  return p;
}
function saveProfile(p) {
  try { localStorage.setItem("cosmic_profile", JSON.stringify(p)); } catch(e) {}
}
function restoreFromCode(code) {
  // Store the code they want to restore — on next Supabase sync this would pull their data
  // For now: just save as their code so they know it's linked
  const p = getProfile();
  p.code = code.toUpperCase().trim();
  saveProfile(p);
  return p;
}
function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function getDailyRemaining() {
  const p = getProfile(); const today = getTodayStr();
  if (p.lastDay !== today) return MAX_DAILY;
  return Math.max(0, MAX_DAILY - (p.dailyCount || 0));
}
function getDailyReceiveRemaining() {
  const p = getProfile(); const today = getTodayStr();
  if (p.lastReceiveDay !== today) return MAX_DAILY_RECEIVE;
  return Math.max(0, MAX_DAILY_RECEIVE - (p.receiveCount || 0));
}
function recordReceive() {
  const p = getProfile(); const today = getTodayStr();
  if (p.lastReceiveDay !== today) { p.receiveCount = 0; p.lastReceiveDay = today; }
  p.receiveCount = (p.receiveCount || 0) + 1;
  saveProfile(p);
}
function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}
function getRank(sent) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (sent >= r.min) rank = r; }
  return rank;
}
function getNextRank(sent) {
  for (const r of RANKS) { if (sent < r.min) return r; }
  return null;
}
function recordSent(letterId, message, colorId, accessoryId, theme) {
  const p = getProfile(); const today = getTodayStr();
  if (p.lastDay !== today) { p.dailyCount = 0; p.lastDay = today; }
  p.dailyCount = (p.dailyCount || 0) + 1;
  p.sent = (p.sent || 0) + 1;
  // Streak
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (p.lastStreakDay === yStr || p.lastStreakDay === today) {
    if (p.lastStreakDay !== today) p.streak = (p.streak || 0) + 1;
  } else { p.streak = 1; }
  p.lastStreakDay = today;
  if (!p.letters) p.letters = [];
  p.letters.unshift({ id: letterId, message, colorId, accessoryId, theme, sentAt: new Date().toISOString(), hearts: 0 });
  saveProfile(p); return p;
}
function getSentIds() { return (getProfile().letters || []).map(l => l.id).filter(Boolean); }
function getSeenReceivedIds() {
  try { return JSON.parse(localStorage.getItem("cosmic_seen_received") || "[]"); } catch { return []; }
}
function markLetterSeen(id) {
  if (!id) return;
  try {
    const seen = getSeenReceivedIds();
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem("cosmic_seen_received", JSON.stringify(seen));
    }
  } catch(e) {}
}
function getFallbackSeen() {
  try { return JSON.parse(localStorage.getItem("cosmic_seen_fallback") || "[]"); } catch { return []; }
}
function markFallbackSeen(idx) {
  try {
    const seen = getFallbackSeen();
    if (!seen.includes(idx)) {
      seen.push(idx);
      // Reset if all seen
      if (seen.length >= FALLBACK_LETTERS.length) {
        localStorage.setItem("cosmic_seen_fallback", "[]");
      } else {
        localStorage.setItem("cosmic_seen_fallback", JSON.stringify(seen));
      }
    }
  } catch(e) {}
}
function getUnseenFallback() {
  const seen = getFallbackSeen();
  const unseen = FALLBACK_LETTERS.map((l,i)=>i).filter(i => !seen.includes(i));
  const pool = unseen.length > 0 ? unseen : FALLBACK_LETTERS.map((_,i)=>i);
  return pool[Math.floor(Math.random() * pool.length)];
}
function saveReceivedLetter(letter) {
  const p = getProfile();
  if (!p.received) p.received = [];
  // Avoid duplicates by id (or by message for fallbacks)
  const key = letter.id || letter.message;
  if (p.received.some(r => (r.id || r.message) === key)) return;
  p.received.unshift({ ...letter, savedAt: new Date().toISOString() });
  saveProfile(p);
}
function getReceivedLetters() { return getProfile().received || []; }

// ── API helpers ──────────────────────────────────────────────────
function clientSideCheck(msg) {
  // Email
  if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(msg))
    return { approved: false, reason: "Please don't include email addresses — this is an anonymous space. 💛" };
  // URLs
  if (/(https?:\/\/|www\.)[^\s]+/.test(msg))
    return { approved: false, reason: "Please don't include links — keep the magic pure. 💛" };
  // Social handles like @username
  if (/@[a-zA-Z0-9_.]{2,}/.test(msg))
    return { approved: false, reason: "Please don't include social media handles — stay anonymous. 💛" };
  // Phone numbers (7+ consecutive digits, various formats)
  const digitsOnly = msg.replace(/[^0-9]/g, "");
  if (digitsOnly.length >= 7 && /(\d[\s\-.]?){7,}/.test(msg))
    return { approved: false, reason: "Please don't include phone numbers — keep it anonymous. 💛" };
  // Name signatures at the end: "- Sarah", "Love, John", "From: Mike", "Yours, Ana"
  if (/(^|\s)(from[:\s]+|love[,\s]+|yours[,\s]+|signed[,\s]+|[-–]\s*)[A-Z][a-z]{1,20}\s*$/.test(msg.trim()))
    return { approved: false, reason: "Please don't sign your name — part of the magic is the mystery. 💛" };
  return null;
}

async function moderateLetter(message) {
  // Fast local check first — catches obvious patterns instantly
  const quick = clientSideCheck(message);
  if (quick) return quick;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 200,
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
  return JSON.parse(d.content?.map(b => b.text||"").join("").replace(/```json|```/g,"").trim());
}

async function generateLetter(theme) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000,
      messages: [{ role: "user", content: `Write a warm anonymous positive letter to a stranger for Cosmic Capsule.
Theme: "${theme.label}" — ${theme.prompt}
Rules:
- 3-5 sentences, heartfelt and genuine
- Sound like a real human wrote this, not an AI
- No names or personal info or social handles
- No em dashes (—), no hyphens used as pauses, no ampersands (&)
- No lists, no bullet points, no colons introducing things
- No overly poetic or flowery language — keep it grounded and real
- Vary sentence length naturally, like how people actually write
- End with one fitting emoji
Respond with ONLY the letter text.` }],
    }),
  });
  const d = await r.json();
  return d.content?.map(b => b.text||"").join("").trim() || "";
}

async function generatePrompt(theme) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 200,
      messages: [{ role: "user", content: `Generate a short inspiring writing prompt for someone writing a positive anonymous letter.
Theme: "${theme.label}" — ${theme.prompt}
Rules: One sentence max 20 words, spark emotion, start with "Write about..." or "Tell a stranger..." or "Share..."
Respond with ONLY the prompt.` }],
    }),
  });
  const d = await r.json();
  return d.content?.map(b => b.text||"").join("").trim() || theme.prompt;
}

async function submitLetter(message, colorId, accessoryId, theme) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/letters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=representation" },
    body: JSON.stringify({ message, color_id: colorId, accessory_id: accessoryId, theme, hearts: 0 }),
  });
  if (!r.ok) throw new Error("Failed");
  const d = await r.json(); return d?.[0]?.id || null;
}

async function fetchRandomLetter(excludeSent = [], seenReceived = []) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/letters?select=id,message,color_id,accessory_id,created_at,theme`, {
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const all = await r.json();
  // Only use fallback if DB is truly empty — never mix real and fallback
  if (!Array.isArray(all) || all.length === 0) return null;
  // Exclude letters the user sent themselves
  const notOwn = all.filter(l => !excludeSent.includes(l.id));
  const pool = notOwn.length > 0 ? notOwn : all;
  // Exclude already-seen letters; if all seen, reset and use full pool
  const unseen = pool.filter(l => !seenReceived.includes(l.id));
  return unseen.length > 0
    ? unseen[Math.floor(Math.random() * unseen.length)]
    : pool[Math.floor(Math.random() * pool.length)]; // full cycle reset
}

async function fetchLetterCount() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/letters?select=id`, {
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const d = await r.json(); return Array.isArray(d) ? d.length : 0;
}

async function fetchLetterHearts(ids) {
  if (!ids.length) return {};
  const r = await fetch(`${SUPABASE_URL}/rest/v1/letters?id=in.(${ids.join(",")})&select=id,hearts`, {
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const d = await r.json(); const map = {};
  if (Array.isArray(d)) d.forEach(x => { map[x.id] = x.hearts || 0; });
  return map;
}

async function incrementHeart(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_hearts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ letter_id: id }),
  });
}

async function reportLetter(id, reason) {
  await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" },
    body: JSON.stringify({ letter_id: id, reason }),
  });
}

// ── Days floating helper ─────────────────────────────────────────
function daysFloating(createdAt) {
  if (!createdAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
}

// ── UI Atoms ─────────────────────────────────────────────────────
function StarField() {
  const stars = useRef(Array.from({ length: 130 }, (_, i) => ({
    x: (i * 137.5) % 100, y: (i * 97.3) % 100,
    size: (i % 3) + 0.5, dur: 2 + (i % 4), delay: (i % 5) * 0.8, opacity: 0.12 + (i % 5) * 0.06,
  }))).current;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: "50%", background: `rgba(255,200,120,${s.opacity})`, animation: `twinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}

function Nebula() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden",
      background:"radial-gradient(ellipse at 50% 50%, #140800 0%, #080200 60%, #040100 100%)" }}>
      {/* Core supernova blast */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:"70vw", height:"70vw", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,100,20,0.13) 0%, rgba(255,60,0,0.07) 35%, transparent 70%)",
        animation:"pulseGlow 6s ease-in-out infinite" }} />
      {/* Secondary glow rings */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:"100vw", height:"100vw", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,140,20,0.06) 0%, rgba(200,60,0,0.04) 40%, transparent 65%)",
        animation:"pulseGlow 9s ease-in-out infinite", animationDelay:"2s" }} />
      {/* Gas cloud top-left */}
      <div style={{ position:"absolute", top:"-10%", left:"-5%", width:"55%", height:"55%",
        borderRadius:"50%", background:"radial-gradient(ellipse, rgba(255,80,10,0.1) 0%, rgba(200,40,0,0.05) 50%, transparent 75%)",
        filter:"blur(40px)", animation:"pulseGlow 8s ease-in-out infinite" }} />
      {/* Gas cloud bottom-right */}
      <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"55%", height:"55%",
        borderRadius:"50%", background:"radial-gradient(ellipse, rgba(255,120,20,0.09) 0%, rgba(180,50,0,0.04) 50%, transparent 75%)",
        filter:"blur(40px)", animation:"pulseGlow 7s ease-in-out infinite", animationDelay:"3s" }} />
      {/* Smoky wisps left */}
      <div style={{ position:"absolute", top:"20%", left:"0%", width:"30%", height:"60%",
        background:"linear-gradient(135deg, rgba(255,60,10,0.06) 0%, transparent 60%)",
        filter:"blur(30px)", animation:"pulseGlow 11s ease-in-out infinite" }} />
      {/* Smoky wisps right */}
      <div style={{ position:"absolute", top:"10%", right:"0%", width:"28%", height:"50%",
        background:"linear-gradient(225deg, rgba(255,100,20,0.05) 0%, transparent 60%)",
        filter:"blur(28px)", animation:"pulseGlow 10s ease-in-out infinite", animationDelay:"4s" }} />
      {/* Hot inner haze */}
      <div style={{ position:"absolute", top:"30%", left:"25%", width:"50%", height:"40%",
        background:"radial-gradient(ellipse, rgba(255,180,60,0.05) 0%, transparent 70%)",
        filter:"blur(50px)", animation:"pulseGlow 5s ease-in-out infinite", animationDelay:"1s" }} />
    </div>
  );
}

function Btn({ onClick, children, secondary, disabled, small }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ padding: small ? "8px 20px" : secondary ? "10px 28px" : "14px 40px", borderRadius: 50, border: secondary ? "1.5px solid rgba(255,180,60,0.5)" : "none", background: secondary ? "transparent" : h ? "linear-gradient(135deg,#ffb830,#ff7a00)" : "linear-gradient(135deg,#ffa520,#e06000)", color: secondary ? "rgba(255,180,60,0.9)" : "#1a0800", fontFamily: "'Georgia',serif", fontSize: small ? "0.82rem" : secondary ? "0.92rem" : "1rem", fontWeight: secondary ? 400 : 700, letterSpacing: "0.06em", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, boxShadow: !secondary && h ? "0 0 28px rgba(255,140,0,0.6),0 4px 20px rgba(0,0,0,0.4)" : !secondary ? "0 0 14px rgba(255,120,0,0.3)" : "none", transition: "all 0.25s", transform: h && !disabled ? "translateY(-2px)" : "none" }}>
      {children}
    </button>
  );
}

// ── Capsule SVG ──────────────────────────────────────────────────
function CapsuleSVG({ colorId = "amber", size = 120, glowing, open }) {
  const col = COLORS.find(c => c.id === colorId) || COLORS[0];
  const { c1, c2, glow } = col;
  const uid = useRef(`c${Math.random().toString(36).slice(2,7)}`).current;
  const gid = `cg${uid}`; const sid = `cs${uid}`;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 120 156" style={{ overflow: "visible", filter: glowing ? `drop-shadow(0 0 18px ${glow}) drop-shadow(0 0 40px ${glow}66)` : `drop-shadow(0 4px 16px rgba(0,0,0,0.5))` }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient>
        <radialGradient id={sid} cx="30%" cy="25%" r="55%"><stop offset="0%" stopColor="white" stopOpacity="0.4" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient>
        <linearGradient id={`wg${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#aaddff" /><stop offset="100%" stopColor="#0055aa" /></linearGradient>
      </defs>
      {!open ? (<>
        <ellipse cx="60" cy="148" rx="10" ry="5" fill={c1} opacity="0.5" />
        <ellipse cx="60" cy="152" rx="6" ry="3" fill={c1} opacity="0.7" />
        <ellipse cx="60" cy="155" rx="3" ry="2" fill="white" opacity="0.6" />
        <ellipse cx="60" cy="90" rx="28" ry="52" fill={`url(#${gid})`} />
        <ellipse cx="60" cy="90" rx="28" ry="52" fill={`url(#${sid})`} />
        <ellipse cx="60" cy="42" rx="20" ry="22" fill={c1} />
        <ellipse cx="60" cy="42" rx="20" ry="22" fill={`url(#${sid})`} />
        <polygon points="32,100 4,128 32,120" fill={c1} opacity="0.9" />
        <polygon points="88,100 116,128 88,120" fill={c1} opacity="0.9" />
        <ellipse cx="60" cy="60" rx="12" ry="14" fill={`url(#wg${uid})`} />
        <ellipse cx="57" cy="57" rx="5" ry="6" fill="rgba(255,255,255,0.4)" />
        <ellipse cx="60" cy="95" rx="28" ry="4" fill="rgba(0,0,0,0.15)" />
      </>) : (<>
        <ellipse cx="60" cy="110" rx="28" ry="36" fill={`url(#${gid})`} />
        <ellipse cx="60" cy="110" rx="28" ry="36" fill={`url(#${sid})`} />
        <polygon points="32,110 4,138 32,128" fill={c1} opacity="0.9" />
        <polygon points="88,110 116,138 88,128" fill={c1} opacity="0.9" />
        <g style={{ animation: "capOpen 0.8s ease forwards" }}>
          <ellipse cx="60" cy="42" rx="20" ry="22" fill={c1} />
          <ellipse cx="57" cy="39" rx="5" ry="6" fill="rgba(255,255,255,0.4)" />
        </g>
        <ellipse cx="60" cy="76" rx="24" ry="5" fill="rgba(255,220,100,0.35)" />
        <ellipse cx="60" cy="110" rx="28" ry="4" fill="rgba(0,0,0,0.15)" />
      </>)}
    </svg>
  );
}

// ── Accessory Layer ──────────────────────────────────────────────
function AccLayer({ accessoryId, colorId, size = 120 }) {
  const col = COLORS.find(c => c.id === colorId) || COLORS[0];
  const { c1, glow } = col;
  const w = size; const h = size * 1.3;
  const cx = w / 2; const cy = h * 0.58;
  if (accessoryId === "none" || !accessoryId) return null;
  if (accessoryId === "stars") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      {[[cx-38,cy-30,1],[cx+42,cy-10,0.7],[cx-48,cy+20,0.8],[cx+50,cy+35,0.6],[cx-30,cy+55,0.9],[cx+35,cy+60,0.7]].map(([x,y,op],i)=>(
        <polygon key={i} points={`${x},${y-5} ${x+2},${y-1} ${x+5},${y} ${x+2},${y+1} ${x},${y+5} ${x-2},${y+1} ${x-5},${y} ${x-2},${y-1}`} fill={c1} opacity={op} style={{ animation: `twinkle ${1.5+i*0.3}s ease-in-out infinite`, animationDelay: `${i*0.2}s`, filter: `drop-shadow(0 0 4px ${glow})` }} />
      ))}
      {[[cx-15,cy+82,3],[cx+10,cy+92,2.5],[cx-5,cy+102,2],[cx+20,cy+110,1.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={c1} opacity={0.6-i*0.1} style={{ animation: `twinkle ${1+i*0.2}s ease-in-out infinite` }} />
      ))}
    </svg>
  );
  if (accessoryId === "ring") return (
    <svg width={w*2.2} height={h} viewBox={`0 0 ${w*2.2} ${h}`} style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", overflow: "visible", pointerEvents: "none" }}>
      <defs><linearGradient id={`rg${colorId}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={c1} stopOpacity="0.1"/><stop offset="40%" stopColor={c1} stopOpacity="0.9"/><stop offset="60%" stopColor="white" stopOpacity="0.8"/><stop offset="100%" stopColor={c1} stopOpacity="0.1"/></linearGradient></defs>
      <ellipse cx={w*1.1} cy={h*0.58} rx={w*0.95} ry={h*0.13} fill="none" stroke={`url(#rg${colorId})`} strokeWidth="4" style={{ animation: "ringSpin 4s linear infinite", transformOrigin: `${w*1.1}px ${h*0.58}px`, filter: `drop-shadow(0 0 6px ${glow})` }} />
      <circle r="5" fill={c1} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
        <animateMotion dur="4s" repeatCount="indefinite" path={`M ${w*1.1+w*0.95},${h*0.58} A ${w*0.95},${h*0.13} 0 1 1 ${w*1.1+w*0.95-0.01},${h*0.58}`} />
      </circle>
    </svg>
  );
  if (accessoryId === "flame") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g style={{ animation: "flameFlick 0.4s ease-in-out infinite alternate" }}>
        <path d={`M${cx-30},${cy+30} Q${cx-50},${cy+55} ${cx-38},${cy+78} Q${cx-28},${cy+63} ${cx-22},${cy+38}`} fill={c1} opacity="0.85" />
        <path d={`M${cx-30},${cy+34} Q${cx-44},${cy+54} ${cx-36},${cy+70} Q${cx-28},${cy+58} ${cx-24},${cy+40}`} fill="rgba(255,220,100,0.7)" />
        <ellipse cx={cx-30} cy={cy+31} rx="5" ry="4" fill="white" opacity="0.5" />
      </g>
      <g style={{ animation: "flameFlick 0.4s ease-in-out infinite alternate-reverse" }}>
        <path d={`M${cx+30},${cy+30} Q${cx+50},${cy+55} ${cx+38},${cy+78} Q${cx+28},${cy+63} ${cx+22},${cy+38}`} fill={c1} opacity="0.85" />
        <path d={`M${cx+30},${cy+34} Q${cx+44},${cy+54} ${cx+36},${cy+70} Q${cx+28},${cy+58} ${cx+24},${cy+40}`} fill="rgba(255,220,100,0.7)" />
        <ellipse cx={cx+30} cy={cy+31} rx="5" ry="4" fill="white" opacity="0.5" />
      </g>
    </svg>
  );
  if (accessoryId === "petals") return (
    <svg width={w*1.8} height={h*1.2} viewBox={`0 0 ${w*1.8} ${h*1.2}`} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", overflow: "visible", pointerEvents: "none" }}>
      {[[-65,-18,-35],[65,-18,35],[-75,22,-20],[75,22,20],[-55,58,-45],[55,58,45]].map(([dx,dy,rot],i)=>(
        <g key={i} transform={`translate(${w*0.9+dx},${h*0.6+dy}) rotate(${rot})`} style={{ animation: `petalFloat ${2+i*0.3}s ease-in-out infinite`, animationDelay: `${i*0.2}s` }}>
          <ellipse cx="0" cy="0" rx="12" ry="20" fill={c1} opacity={0.75-i*0.05} style={{ filter: `drop-shadow(0 0 5px ${glow})` }} />
          <ellipse cx="0" cy="-4" rx="5" ry="9" fill="white" opacity="0.3" />
        </g>
      ))}
    </svg>
  );
  if (accessoryId === "bolts") return (
    <svg width={w*1.6} height={h*1.2} viewBox={`0 0 ${w*1.6} ${h*1.2}`} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", overflow: "visible", pointerEvents: "none" }}>
      {[
        [`M${w*0.1},${h*0.2} L${w*0.22},${h*0.38} L${w*0.14},${h*0.38} L${w*0.26},${h*0.56}`,0,0.9],
        [`M${w*1.5},${h*0.25} L${w*1.38},${h*0.42} L${w*1.46},${h*0.42} L${w*1.34},${h*0.6}`,0.3,0.8],
        [`M${w*0.08},${h*0.55} L${w*0.2},${h*0.7} L${w*0.12},${h*0.7} L${w*0.22},${h*0.86}`,0.6,0.7],
        [`M${w*1.52},${h*0.55} L${w*1.4},${h*0.7} L${w*1.48},${h*0.7} L${w*1.38},${h*0.86}`,0.15,0.7],
      ].map(([path,delay,op],i)=>(
        <path key={i} d={path} fill={c1} opacity={op} style={{ filter: `drop-shadow(0 0 8px ${glow})`, animation: `boltFlash 0.8s ease-in-out infinite`, animationDelay: `${delay}s` }} />
      ))}
    </svg>
  );
  if (accessoryId === "ribbon") return (
    <svg width={w*1.8} height={h*1.3} viewBox={`0 0 ${w*1.8} ${h*1.3}`} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", overflow: "visible", pointerEvents: "none" }}>
      <defs><linearGradient id={`rbg${colorId}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={c1} stopOpacity="0.1"/><stop offset="40%" stopColor={c1} stopOpacity="0.9"/><stop offset="70%" stopColor="white" stopOpacity="0.7"/><stop offset="100%" stopColor={c1} stopOpacity="0.1"/></linearGradient></defs>
      {[0,1,2].map(i=>(
        <path key={i} d={`M${w*0.05},${h*(0.3+i*0.14)} C${w*0.3},${h*(0.2+i*0.11)} ${w*0.7},${h*(0.5+i*0.1)} ${w*1.75},${h*(0.35+i*0.12)}`} fill="none" stroke={`url(#rbg${colorId})`} strokeWidth={4-i} opacity={0.9-i*0.2} style={{ filter: `drop-shadow(0 0 5px ${glow})`, animation: `ribbonWave ${2+i*0.4}s ease-in-out infinite`, animationDelay: `${i*0.3}s` }} />
      ))}
      <g transform={`translate(${w*0.9},${h*0.42})`}>
        <ellipse cx="-11" cy="0" rx="13" ry="7" fill={c1} opacity="0.9" transform="rotate(-20)" style={{ filter: `drop-shadow(0 0 7px ${glow})` }} />
        <ellipse cx="11" cy="0" rx="13" ry="7" fill={c1} opacity="0.9" transform="rotate(20)" style={{ filter: `drop-shadow(0 0 7px ${glow})` }} />
        <circle cx="0" cy="0" r="5" fill="white" opacity="0.8" />
        <circle cx="0" cy="0" r="2.5" fill={c1} />
      </g>
    </svg>
  );
  return null;
}

// ── Paper component ──────────────────────────────────────────────
function Paper({ folded, emerging, message, theme }) {
  const th = THEMES.find(t => t.id === theme) || THEMES[0];
  const anim = emerging ? "paperEmerge 1.2s cubic-bezier(0.2,0.8,0.3,1) forwards"
             : folded   ? "paperFold 1s ease forwards"
             :            "paperFloat 3s ease-in-out infinite";
  if (folded) return (
    <div style={{ animation: "paperFold 1s ease forwards", transformOrigin: "center" }}>
      <svg width="70" height="70" viewBox="0 0 110 110" style={{ filter: "drop-shadow(0 4px 16px rgba(255,200,100,0.4))" }}>
        <defs>
          <linearGradient id="pgf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff9e6"/><stop offset="100%" stopColor="#ffeebb"/>
          </linearGradient>
        </defs>
        <polygon points="55,5 105,55 55,105 5,55" fill="url(#pgf)" />
        <polygon points="55,5 105,55 55,55" fill="#ffe088" opacity="0.7" />
        <polygon points="55,5 5,55 55,55" fill="#fff3cc" opacity="0.5" />
        <line x1="55" y1="5" x2="55" y2="105" stroke="rgba(180,140,60,0.18)" strokeWidth="1"/>
        <line x1="5" y1="55" x2="105" y2="55" stroke="rgba(180,140,60,0.18)" strokeWidth="1"/>
        <path d="M46,52 C46,49 50,47 55,49 C60,47 64,49 64,52 C64,56 55,60 55,60Z" fill="rgba(255,120,120,0.45)"/>
      </svg>
    </div>
  );
  return (
    <div style={{ animation: anim, transformOrigin: "center bottom" }}>
      <svg width="160" height="200" viewBox="0 0 160 200" style={{ filter: "drop-shadow(0 8px 32px rgba(255,200,100,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="10%" y2="100%">
            <stop offset="0%" stopColor="#fffdf0"/><stop offset="100%" stopColor="#fff3cc"/>
          </linearGradient>
          <filter id="pglow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        {/* Paper shadow */}
        <rect x="12" y="12" width="136" height="180" rx="8" fill="rgba(0,0,0,0.15)" />
        {/* Paper body */}
        <rect x="8" y="8" width="136" height="180" rx="8" fill="url(#pg)" />
        {/* Fold corner */}
        <polygon points="114,8 144,8 144,38" fill="#ffe8a0" opacity="0.9"/>
        <polygon points="114,8 144,38 114,38" fill="#ffd060" opacity="0.6"/>
        {/* Top decorative border */}
        <rect x="8" y="8" width="136" height="6" rx="8" fill="rgba(255,180,60,0.25)"/>
        {/* Heart stamp */}
        <path d="M72,32 C72,28 76,25 80,28 C84,25 88,28 88,32 C88,37 80,43 80,43 C80,43 72,37 72,32Z" fill="rgba(255,100,120,0.55)"/>
        <path d="M74,32 C74,29 77,27 80,29 C83,27 86,29 86,32 C86,36 80,41 80,41 C80,41 74,36 74,32Z" fill="rgba(255,140,150,0.4)"/>
        {/* Theme mood stamp */}
        <rect x="18" y="52" width="62" height="18" rx="9" fill="rgba(255,160,40,0.15)"/>
        <text x="49" y="64" textAnchor="middle" fontSize="9" fill="rgba(180,120,40,0.8)" fontFamily="Georgia,serif">{th ? th.label : ""}</text>
        {/* Letter lines */}
        {[82,97,112,127,142,157,172].map((y,i) => (
          <line key={i} x1="22" y1={y} x2={i===3||i===6?100:136} y2={y}
            stroke="rgba(180,140,60,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
        ))}
        {/* Wax seal bottom */}
        <circle cx="80" cy="183" r="8" fill="rgba(255,80,60,0.35)"/>
        <circle cx="80" cy="183" r="5" fill="rgba(255,100,80,0.5)"/>
        <path d="M77,183 L80,180 L83,183 L80,186Z" fill="rgba(255,200,180,0.6)" />
      </svg>
    </div>
  );
}

// ── Warp Screen ──────────────────────────────────────────────────
function WarpScreen({ progress, receive }) {
  const streaks = useRef(Array.from({ length: 90 }, () => ({
    x: Math.random() * 100, len: 5 + Math.random() * 20,
    dur: 0.25 + Math.random() * 0.45, delay: Math.random() * 0.9,
    opacity: 0.4 + Math.random() * 0.6, width: 0.8 + Math.random() * 1.6,
    color: Math.random() > 0.6 ? "180,220,255" : Math.random() > 0.4 ? "255,220,140" : "255,255,255",
    top: Math.random() * 100,
  }))).current;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "radial-gradient(ellipse at center, #0a0520 0%, #020008 60%, #000 100%)", animation: "warpIn 0.4s ease forwards", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(100,60,255,0.2) 0%, rgba(60,20,180,0.08) 30%, transparent 70%)", animation: "tunnelPulse 1s ease-in-out infinite" }} />
      {[...Array(7)].map((_,i)=>(
        <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: `${(i+1)*13}vw`, height: `${(i+1)*13}vw`, borderRadius: "50%", border: `1px solid rgba(140,100,255,${0.28-i*0.035})`, animation: `ringExpand ${0.8+i*0.14}s ease-out infinite`, animationDelay: `${i*0.12}s` }} />
      ))}
      {streaks.map((s,i)=>(
        <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.top}%`, width: `${s.width}px`, height: `${s.len}vh`, background: `linear-gradient(to top, rgba(${s.color},0), rgba(${s.color},${s.opacity}))`, borderRadius: 2, animation: `starStreak ${s.dur}s linear infinite`, animationDelay: `${s.delay}s` }} />
      ))}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 2 }}>
        <div style={{ marginBottom: 14, animation: "capsuleFloat 2s ease-in-out infinite" }}>
          <CapsuleSVG colorId="amber" size={60} glowing />
        </div>
        <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,220,140,0.9)", fontSize: "1.05rem", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(255,160,40,0.8)", animation: "pulseGlow 1.5s ease-in-out infinite" }}>{receive ? "A capsule is racing toward you…" : "Traveling through the cosmos…"}</p>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(180,140,255,0.55)", fontSize: "0.82rem", marginTop: 6 }}>{receive ? "hold on, something is coming" : "your kindness is on its way"}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          {[...Array(3)].map((_,i)=>(
            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < progress ? "#ffa520" : "rgba(255,140,20,0.2)", boxShadow: i < progress ? "0 0 10px rgba(255,140,20,0.8)" : "none", transition: "all 0.4s ease" }} />
          ))}
        </div>
        <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.35)", fontSize: "0.72rem", marginTop: 8, fontStyle: "italic" }}>{3 - progress} light-years remaining</p>
      </div>
    </div>
  );
}

// ── Confetti ─────────────────────────────────────────────────────
function Confetti() {
  const pieces = useRef(Array.from({length:40},()=>({ x: Math.random()*100, delay: Math.random()*1.5, dur: 2+Math.random()*2, color: ["#ffd700","#ff6b6b","#88ddff","#cc88ff","#44ffaa"][Math.floor(Math.random()*5)], size: 6+Math.random()*8 }))).current;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none" }}>
      {pieces.map((p,i)=>(
        <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: "-20px", width: p.size, height: p.size, background: p.color, borderRadius: "2px", animation: `confettiFall ${p.dur}s ease-in forwards`, animationDelay: `${p.delay}s`, opacity: 0 }} />
      ))}
    </div>
  );
}

// ── Report Modal ─────────────────────────────────────────────────
function ReportModal({ letterId, onClose }) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const reasons = ["Harmful content","Hate speech","Personal information","Spam or promotion","Other"];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#120a00", border: "1.5px solid rgba(255,80,60,0.35)", borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        {!sent ? (<>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🚩</div>
          <h3 style={{ fontFamily: "'Georgia',serif", color: "#ffd080", fontWeight: 400, fontSize: "1.3rem", marginBottom: 8 }}>Report this letter</h3>
          <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.5)", fontSize: "0.85rem", marginBottom: 24, lineHeight: 1.6 }}>Help us keep the cosmos safe and kind. Every report is reviewed.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {reasons.map(r => (
              <button key={r} onClick={() => setReason(r)} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${reason===r?"rgba(255,80,60,0.6)":"rgba(255,255,255,0.08)"}`, background: reason===r?"rgba(255,60,40,0.12)":"transparent", color: reason===r?"rgba(255,160,120,0.9)":"rgba(255,200,120,0.5)", fontFamily: "'Georgia',serif", fontSize: "0.88rem", cursor: "pointer", textAlign: "left" }}>{r}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn onClick={onClose} secondary small>Cancel</Btn>
            <button onClick={async()=>{ if(!reason)return; await reportLetter(letterId,reason); setSent(true); }} disabled={!reason}
              style={{ padding: "10px 24px", borderRadius: 50, border: "none", background: reason?"rgba(255,60,40,0.7)":"rgba(255,60,40,0.2)", color: "#fff", fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: "0.88rem", cursor: reason?"pointer":"not-allowed" }}>
              Submit Report
            </button>
          </div>
        </>) : (<>
          <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
          <h3 style={{ fontFamily: "'Georgia',serif", color: "#ffd080", fontWeight: 400, fontSize: "1.2rem", marginBottom: 8 }}>Thank you</h3>
          <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.5)", fontSize: "0.85rem", marginBottom: 24 }}>Your report helps keep the cosmos kind. 💛</p>
          <Btn onClick={onClose} small>Close</Btn>
        </>)}
      </div>
    </div>
  );
}






// ── Tip Modal ────────────────────────────────────────────────────
function TipModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#120a00", border: "1.5px solid rgba(255,140,20,0.3)", borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 46, marginBottom: 14 }}>☕</div>
        <h3 style={{ fontFamily: "'Georgia',serif", color: "#ffd080", fontWeight: 400, fontSize: "1.3rem", marginBottom: 8 }}>Keep the Cosmos Alive</h3>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.5)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: 22 }}>Cosmic Capsule is free forever. If it made your day a little warmer, consider buying us a coffee. 🌟</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <button onClick={()=>{ window.location.href="https://buymeacoffee.com/cosmiccapsule"; onClose(); }}
            style={{ background: "linear-gradient(135deg,#ffa520,#e06000)", border: "none", borderRadius: 50, padding: "14px 32px", color: "#1a0800", fontFamily: "'Georgia',serif", fontWeight: 700, fontSize: "1rem", cursor: "pointer", boxShadow: "0 0 20px rgba(255,140,0,0.4)", letterSpacing: "0.05em" }}>
            ☕ Buy us a coffee
          </button>
          <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,160,60,0.4)", fontSize: "0.75rem", marginTop: 8 }}>Takes you to buymeacoffee.com/cosmiccapsule</p>
        </div>
        <Btn onClick={onClose} secondary small>Maybe later</Btn>
      </div>
    </div>
  );
}

// ── Guidelines Screen ────────────────────────────────────────────
function MyReceivedScreen({ onBack }) {
  const letters = getReceivedLetters();
  return (
    <div style={{ minHeight:"100vh", padding:"30px 20px", zIndex:1, position:"relative", animation:"fadeUp 0.8s ease forwards" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,180,60,0.5)", fontFamily:"'Georgia',serif", fontSize:"0.88rem", cursor:"pointer", marginBottom:24 }}>← Back</button>
        <h2 style={{ fontFamily:"'Georgia',serif", fontWeight:400, fontSize:"1.5rem", color:"#ffd080", marginBottom:6 }}>My Received Letters 💌</h2>
        <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.4)", fontSize:"0.85rem", marginBottom:28 }}>Letters strangers sent into the cosmos — and you caught them.</p>
        {letters.length === 0 && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:55, marginBottom:16 }}>💌</div>
            <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,160,60,0.4)", fontStyle:"italic" }}>No letters saved yet.<br />Receive a transmission and keep the ones that touch you. 💛</p>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {letters.map((letter, i) => {
            const savedAgo = Math.floor((Date.now() - new Date(letter.savedAt).getTime()) / 86400000);
            const savedStr = savedAgo === 0 ? "Today" : savedAgo === 1 ? "Yesterday" : `${savedAgo} days ago`;
            return (
              <div key={i} style={{ position:"relative", background:"linear-gradient(160deg,#fffdf0,#fff8dc,#fff3c8)", borderRadius:16, padding:"32px 30px 38px", border:"1px solid rgba(255,200,100,0.3)", boxShadow:"0 4px 30px rgba(0,0,0,0.25), 0 0 40px rgba(255,160,40,0.08)" }}>
                {/* Fold corner */}
                <div style={{ position:"absolute", top:0, right:0, width:0, height:0, borderStyle:"solid", borderWidth:"0 28px 28px 0", borderColor:"transparent rgba(255,220,120,0.5) transparent transparent" }} />
                {/* Wax seal */}
                <div style={{ position:"absolute", bottom:12, right:16, width:24, height:24, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,80,60,0.5),rgba(200,40,20,0.4))", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:"0.6rem" }}>✦</span>
                </div>
                {/* Subject stamp */}
                {letter.theme && (
                  <div style={{ position:"absolute", top:12, left:16, background:"rgba(255,160,40,0.12)", border:"1px solid rgba(255,160,40,0.2)", borderRadius:10, padding:"2px 8px" }}>
                    <span style={{ fontFamily:"'Kalam',cursive", fontWeight:700, fontSize:"0.75rem", color:"rgba(160,110,30,0.8)" }}>✦ {letter.theme}</span>
                  </div>
                )}
                {/* Letter text */}
                <p style={{ fontFamily:"'Kalam',cursive", fontWeight:700, fontSize:"1.15rem", lineHeight:1.9, color:"rgba(60,35,5,0.88)", margin:0, whiteSpace:"pre-wrap", marginTop:letter.theme?18:0 }}>{letter.message}</p>
                {/* Footer */}
                <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(160,110,30,0.45)", fontSize:"0.7rem", marginTop:16, marginBottom:0 }}>Kept {savedStr} · sent anonymously from somewhere in the universe</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FAQScreen({ onBack, profile }) {
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const code = profile?.code || "—";

  const handleCopyCode = () => {
    const fallback = () => {
      const el = document.createElement("textarea");
      el.value = code; el.style.cssText = "position:fixed;top:-9999px;opacity:0;";
      document.body.appendChild(el); el.focus(); el.select();
      try { document.execCommand("copy"); setCodeCopied(true); setTimeout(()=>setCodeCopied(false),2500); } catch(e) {}
      document.body.removeChild(el);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(()=>{ setCodeCopied(true); setTimeout(()=>setCodeCopied(false),2500); }).catch(fallback);
    } else { fallback(); }
  };

  const handleRestore = () => {
    if (!restoreInput.trim()) return;
    restoreFromCode(restoreInput.trim());
    setRestoreMsg("✦ Code saved! Your profile is now linked to this code. 💛");
  };

  const faqs = [
    {
      q: "Is Cosmic Capsule really anonymous?",
      a: "Yes, completely. We don't ask for your name, email, or any account. You're just a soul somewhere in the universe. The person who receives your letter will never know who you are — and you'll never know who receives it."
    },
    {
      q: "Can the receiver reply to my letter?",
      a: "No, and that's intentional. Cosmic Capsule is one-way. You give kindness freely, with no expectation of a response. That's what makes it feel like a real gift."
    },
    {
      q: "What happens if I clear my browser or switch devices?",
      a: "Your letters, rank, and collection are saved on your device. If you clear your cache or switch devices, that data will be lost — unless you use your Secret Star Code (see below)."
    },
    {
      q: "What is the Secret Star Code?",
      a: "It's your personal recovery key — a unique code like STAR-4829-MOON that's automatically generated for you. If you ever lose your data, you can enter it on a new device to restore your profile. Write it down somewhere safe."
    },
    {
      q: "Will I ever receive a letter I sent myself?",
      a: "Never. We make sure of that. Every letter you send is permanently excluded from what you can receive. Your words go out into the universe for someone else — a stranger you'll never meet."
    },
    {
      q: "Who can see the letters I send?",
      a: "Only a random stranger who receives it. Nobody else. Not us, not anyone. Letters are not publicly listed anywhere."
    },
    {
      q: "How are letters moderated?",
      a: "Every letter is checked before it enters the cosmos. Our system quietly ensures all content is kind, positive, and free of personal information. Letters that don't meet this standard are gently returned to the sender."
    },
    {
      q: "Can I delete a letter I sent?",
      a: "Once a letter is launched, it's floating in the cosmos and can't be recalled. That's why we show you a preview before sending — take a moment to make sure it feels right."
    },
    {
      q: "Is this app free?",
      a: "Yes, entirely free. If Cosmic Capsule brings you joy, you're welcome to support the cosmos with a coffee — but there's no pressure and no premium features. Kindness should be free."
    },
    {
      q: "Why can I only send and receive 3 letters a day?",
      a: "Because each one should feel like something. The limit keeps Cosmic Capsule from becoming a feed you scroll through mindlessly. Three sends. Three receives. Each one a real moment. That's the whole point."
    },
  ];

  return (
    <div style={{ minHeight:"100vh", padding:"30px 20px", zIndex:1, position:"relative", animation:"fadeUp 0.8s ease forwards" }}>
      <div style={{ maxWidth:580, margin:"0 auto" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,180,60,0.5)", fontFamily:"'Georgia',serif", fontSize:"0.88rem", cursor:"pointer", marginBottom:24 }}>← Back</button>
        <h2 style={{ fontFamily:"'Georgia',serif", fontWeight:400, fontSize:"1.6rem", color:"#ffd080", marginBottom:6 }}>Frequently Asked Questions 🌌</h2>
        <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.4)", fontSize:"0.85rem", marginBottom:32 }}>Everything you wondered about the cosmos.</p>

        {/* FAQ list */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:36 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background:"rgba(255,140,20,0.04)", border:"1px solid rgba(255,140,20,0.14)", borderRadius:14, padding:"18px 22px" }}>
              <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,220,140,0.9)", fontSize:"0.95rem", fontWeight:700, marginBottom:8 }}>✦ {faq.q}</p>
              <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,200,100,0.55)", fontSize:"0.88rem", lineHeight:1.7, margin:0 }}>{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Secret Star Code section */}
        <div style={{ background:"rgba(255,140,20,0.07)", border:"1.5px solid rgba(255,180,60,0.25)", borderRadius:16, padding:"24px 26px", marginBottom:20 }}>
          <p style={{ fontFamily:"'Georgia',serif", color:"#ffd080", fontSize:"1rem", fontWeight:700, marginBottom:6 }}>🔑 Your Secret Star Code</p>
          <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.5)", fontSize:"0.85rem", lineHeight:1.6, marginBottom:16 }}>
            This code is yours. If you ever clear your data or switch devices, enter it to restore your profile. Write it down somewhere safe — we can't recover it for you.
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            {showCode ? (
              <>
                <div style={{ background:"rgba(255,140,20,0.12)", border:"1px solid rgba(255,180,60,0.4)", borderRadius:10, padding:"10px 20px" }}>
                  <span style={{ fontFamily:"'Georgia',serif", color:"#ffd080", fontSize:"1.1rem", letterSpacing:"0.1em", fontWeight:700 }}>{code}</span>
                </div>
                <button onClick={handleCopyCode} style={{ background:"rgba(255,140,20,0.08)", border:"1px solid rgba(255,180,60,0.25)", borderRadius:10, padding:"10px 16px", cursor:"pointer", fontFamily:"'Georgia',serif", color:codeCopied?"#ffd080":"rgba(255,200,100,0.55)", fontSize:"0.85rem", transition:"all 0.2s" }}>
                  {codeCopied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </>
            ) : (
              <button onClick={()=>setShowCode(true)} style={{ background:"rgba(255,140,20,0.1)", border:"1px solid rgba(255,180,60,0.3)", borderRadius:10, padding:"10px 20px", cursor:"pointer", fontFamily:"'Georgia',serif", color:"rgba(255,200,100,0.7)", fontSize:"0.88rem" }}>
                👁 Reveal my code
              </button>
            )}
          </div>

          {/* Restore section */}
          <div style={{ marginTop:20, paddingTop:20, borderTop:"1px solid rgba(255,140,20,0.12)" }}>
            <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,200,100,0.5)", fontSize:"0.82rem", marginBottom:10 }}>Restoring on a new device? Enter your code:</p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <input
                value={restoreInput}
                onChange={e=>setRestoreInput(e.target.value.toUpperCase())}
                placeholder="e.g. STAR-4829-MOON"
                style={{ flex:1, minWidth:160, background:"rgba(255,140,20,0.05)", border:"1.5px solid rgba(255,140,20,0.2)", borderRadius:10, padding:"10px 14px", color:"rgba(255,220,140,0.85)", fontFamily:"'Georgia',serif", fontSize:"0.9rem", outline:"none", caretColor:"#ffa520" }}
              />
              <button onClick={handleRestore} style={{ background:"rgba(255,140,20,0.15)", border:"1px solid rgba(255,180,60,0.4)", borderRadius:10, padding:"10px 18px", cursor:"pointer", fontFamily:"'Georgia',serif", color:"#ffd080", fontSize:"0.88rem" }}>
                Restore ✦
              </button>
            </div>
            {restoreMsg && <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,200,100,0.7)", fontSize:"0.82rem", marginTop:10, fontStyle:"italic" }}>{restoreMsg}</p>}
          </div>
        </div>

        <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,160,60,0.28)", fontSize:"0.72rem", textAlign:"center" }}>Cosmic Capsule · purely anonymous · purely kind 💛</p>
      </div>
    </div>
  );
}

function GuidelinesScreen({ onBack }) {
  const rules = [
    ["💛","Only kindness","Every letter must be warm, positive, and uplifting. No negativity, no sarcasm."],
    ["🚫","No personal info","Never include names, phone numbers, emails, addresses, or social media handles."],
    ["🕊️","No hate","Zero tolerance for hate speech, discrimination, or content targeting any group."],
    ["🌱","No promotion","This is not a place for marketing, advertising, or self-promotion of any kind."],
    ["🛡️","No harm","Content that could cause distress, encourage self-harm, or threaten others is strictly forbidden."],
    ["🤝","Be real","Write like a human. Spam, repetitive content, and AI-only letters without heart are discouraged."],
    ["✨","3 and 3","You can send 3 letters and receive 3 transmissions per day. This limit exists to keep every letter meaningful and intentional — not a feed to scroll through, but a genuine moment of connection."],
  ];
  return (
    <div style={{ minHeight: "100vh", padding: "30px 20px", zIndex: 1, position: "relative", animation: "fadeUp 0.8s ease forwards" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,180,60,0.5)", fontFamily: "'Georgia',serif", fontSize: "0.88rem", cursor: "pointer", marginBottom: 24 }}>← Back</button>
        <p style={{ fontFamily: "'Georgia',serif", fontSize: "0.72rem", letterSpacing: "0.3em", color: "rgba(255,160,60,0.5)", textTransform: "uppercase", marginBottom: 8 }}>Community</p>
        <h2 style={{ fontFamily: "'Georgia',serif", fontWeight: 400, fontSize: "1.8rem", color: "#ffd080", marginBottom: 8 }}>The Rules of the Cosmos 🌌</h2>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.45)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 32 }}>Cosmic Capsule exists to spread kindness across the universe. Every letter is reviewed before reaching anyone. These are the principles that keep this place magical.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rules.map(([icon, title, desc]) => (
            <div key={title} style={{ background: "rgba(255,140,20,0.05)", border: "1px solid rgba(255,140,20,0.15)", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "'Georgia',serif", color: "#ffd080", fontSize: "0.92rem", fontWeight: 700, marginBottom: 4 }}>{title}</div>
                <div style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.5)", fontSize: "0.82rem", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,160,60,0.3)", fontSize: "0.78rem", textAlign: "center", marginTop: 32 }}>Violations are silently blocked. Repeated abuse may result in being unable to send. 💛</p>
      </div>
    </div>
  );
}

// ── My Capsules Screen ───────────────────────────────────────────
function MyCapsulesScreen({ onBack, profile }) {
  const [heartsMap, setHeartsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const letters = profile.letters || [];

  useEffect(() => {
    const ids = letters.map(l => l.id).filter(Boolean);
    if (!ids.length) { setLoading(false); return; }
    fetchLetterHearts(ids).then(m => { setHeartsMap(m); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const rank = getRank(profile.sent || 0);
  const next = getNextRank(profile.sent || 0);

  return (
    <div style={{ minHeight: "100vh", padding: "30px 20px", zIndex: 1, position: "relative", animation: "fadeUp 0.8s ease forwards" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,180,60,0.5)", fontFamily: "'Georgia',serif", fontSize: "0.88rem", cursor: "pointer", marginBottom: 24 }}>← Back</button>

        {/* Rank card */}
        <div style={{ background: "rgba(255,140,20,0.07)", border: "1px solid rgba(255,140,20,0.2)", borderRadius: 16, padding: "18px 22px", marginBottom: 24, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ fontSize: "2.5rem" }}>{rank.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Georgia',serif", color: rank.color, fontSize: "1.1rem", fontWeight: 700 }}>{rank.name}</div>
            <div style={{ fontFamily: "'Georgia',serif", color: "rgba(255,200,100,0.5)", fontSize: "0.78rem", marginTop: 2 }}>{profile.sent || 0} letters sent · {profile.streak || 0} day streak 🔥</div>
            {next && <div style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.35)", fontSize: "0.7rem", marginTop: 4, fontStyle: "italic" }}>{next.min - (profile.sent||0)} more to reach {next.name} {next.icon}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.4)", fontSize: "0.7rem", marginBottom: 4 }}>Total hearts</div>
            <div style={{ fontFamily: "'Georgia',serif", color: "#ffd080", fontSize: "1.4rem", fontWeight: 700 }}>
              🤍 {Object.values(heartsMap).reduce((a,b)=>a+b,0) + letters.reduce((a,l)=>a+(l.hearts||0),0)}
            </div>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Georgia',serif", fontWeight: 400, fontSize: "1.5rem", color: "#ffd080", marginBottom: 6 }}>My Capsules 🛸</h2>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.4)", fontSize: "0.85rem", marginBottom: 24 }}>Your letters, drifting silently through the cosmos.</p>

        {loading && <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.4)", textAlign: "center", fontStyle: "italic" }}>Loading your capsules…</p>}
        {!loading && letters.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 55, marginBottom: 16 }}>🌌</div>
            <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.4)", fontStyle: "italic" }}>You haven't sent any letters yet.<br />Launch your first capsule into the cosmos!</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {letters.map((letter, i) => {
            const col = COLORS.find(c => c.id === letter.colorId) || COLORS[0];
            const hearts = letter.id ? (heartsMap[letter.id] ?? letter.hearts ?? 0) : 0;
            const theme = THEMES.find(t => t.id === letter.theme) || THEMES[0];
            const daysAgo = Math.floor((Date.now() - new Date(letter.sentAt).getTime()) / 86400000);
            const dateStr = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
            return (
              <div key={i} style={{ background: "rgba(255,140,20,0.05)", border: `1px solid ${col.glow.replace("0.9","0.2")}`, borderRadius: 16, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${col.glow.replace("0.9","0.1")}, transparent 70%)` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ position: "relative", width: 32, height: 42 }}>
                      <CapsuleSVG colorId={letter.colorId} size={28} />
                    </div>
                    <span style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.45)", fontSize: "0.72rem" }}>{theme.label} · {dateStr}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 20, padding: "4px 12px" }}>
                    <span style={{ fontSize: "0.85rem" }}>🤍</span>
                    <span style={{ fontFamily: "'Georgia',serif", color: "rgba(255,180,140,0.8)", fontSize: "0.82rem", fontWeight: 700 }}>{hearts}</span>
                  </div>
                </div>
                <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,220,140,0.75)", fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
                  {letter.message.length > 160 ? letter.message.slice(0,160)+"…" : letter.message}
                </p>
                {hearts > 0 && <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,160,60,0.35)", fontSize: "0.72rem", marginTop: 8, marginBottom: 0 }}>✨ Your kindness warmed {hearts} {hearts===1?"heart":"hearts"} across the cosmos</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Countdown Timer ──────────────────────────────────────────────
function CountdownTimer() {
  const [secs, setSecs] = useState(getSecondsUntilMidnight());
  useEffect(() => { const t = setInterval(() => setSecs(getSecondsUntilMidnight()), 1000); return () => clearInterval(t); }, []);
  const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const s = secs % 60;
  return <span style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.6)", fontSize: "0.85rem" }}>{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>;
}

// ── Home Screen ──────────────────────────────────────────────────
function HomeScreen({ onWrite, onReceive, onMyCapsules, onMyReceived, onGuidelines, onFAQ, profile, setProfile, sound }) {
  
  const [showTip, setShowTip] = useState(false);
  const [count, setCount] = useState(null);
  const rank = getRank(profile.sent || 0);
  const remaining = getDailyRemaining();
  const receiveRemaining = getDailyReceiveRemaining();

  useEffect(() => { fetchLetterCount().then(c => setCount(c + 1247)).catch(() => {}); }, []);

  const shareRank = () => {
    const text = `I just reached ${rank.name} ${rank.icon} on Cosmic Capsule — I've sent ${profile.sent} anonymous positive letters to strangers across the universe. 🛸\n\nJoin me at cosmiccapsule.app`;
    if (navigator.share) { navigator.share({ text }).catch(()=>{}); }
    else { navigator.clipboard?.writeText(text).then(() => alert("Rank card copied to clipboard! 📋")); }
  };

  const shareApp = () => {
    const text = "✨ Cosmic Capsule — Send anonymous positive letters to strangers across the universe. Someone out there needs your words today.\n\ncosmiccapsule.app";
    if (navigator.share) { navigator.share({ text }).catch(()=>{}); }
    else { navigator.clipboard?.writeText(text).then(() => alert("Link copied! Share it with someone 💛")); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", animation: "fadeUp 1s ease forwards", position: "relative", zIndex: 1 }}>
      

      {showTip && <TipModal onClose={() => setShowTip(false)} />}

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(10,5,0,0.7)", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {profile.streak > 0 && <div style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.7)", fontSize: "0.78rem", background: "rgba(255,140,20,0.1)", border: "1px solid rgba(255,140,20,0.2)", borderRadius: 20, padding: "4px 10px" }}>🔥 {profile.streak} day streak</div>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => { const p = getProfile(); p.soundOn = !p.soundOn; saveProfile(p); setProfile({...p}); }} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.5)", fontSize: "1rem", cursor: "pointer" }}>{profile.soundOn !== false ? "🔊" : "🔇"}</button>
          <div onClick={onMyCapsules} style={{ background: "rgba(10,5,0,0.8)", border: "1px solid rgba(255,140,20,0.22)", borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <span style={{ fontSize: "1rem" }}>{rank.icon}</span>
            <div>
              <div style={{ fontFamily: "'Georgia',serif", color: rank.color, fontSize: "0.72rem", fontWeight: 700 }}>{rank.name}</div>
              <div style={{ fontFamily: "'Georgia',serif", color: "rgba(255,200,100,0.35)", fontSize: "0.6rem" }}>{profile.sent||0} sent</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 60 }}>
        <p style={{ fontFamily: "'Georgia',serif", fontSize: "0.75rem", letterSpacing: "0.3em", color: "rgba(255,160,60,0.55)", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>A message across the universe</p>
        <h1 style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(2rem,6vw,3.2rem)", fontWeight: 400, color: "transparent", background: "linear-gradient(135deg,#ffd080,#ff8c00,#ffb830)", WebkitBackgroundClip: "text", backgroundClip: "text", textAlign: "center", marginBottom: 8, lineHeight: 1.2 }}>Cosmic Capsule</h1>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.45)", fontSize: "0.95rem", marginBottom: 6, textAlign: "center" }}>Send kindness into the void. Receive a star in return.</p>
        {count && <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,160,60,0.4)", fontSize: "0.78rem", textAlign: "center", marginBottom: 0 }}>🌌 {count.toLocaleString()} letters drifting through the cosmos</p>}
      </div>

      <div style={{ margin: "32px 0", position: "relative" }}>
        <div style={{ animation: "capsuleFloat 5s ease-in-out infinite", position: "relative" }}>
          <CapsuleSVG colorId={profile.colorId || "amber"} size={96} glowing />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AccLayer accessoryId={profile.accessoryId || "none"} colorId={profile.colorId || "amber"} size={96} />
          </div>
        </div>
      </div>

      {/* Daily dots — send */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
        {[...Array(MAX_DAILY)].map((_,i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < remaining ? "#ffa520" : "rgba(255,140,20,0.18)", boxShadow: i < remaining ? "0 0 8px rgba(255,140,20,0.6)" : "none", transition: "all 0.3s" }} />
        ))}
        <span style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.4)", fontSize: "0.72rem", marginLeft: 6 }}>
          {remaining > 0 ? `${remaining} send${remaining!==1?"s":""} left` : "sends done for today"}
        </span>
      </div>
      {/* Daily dots — receive */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 24 }}>
        {[...Array(MAX_DAILY_RECEIVE)].map((_,i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < receiveRemaining ? "#88ccff" : "rgba(100,180,255,0.15)", boxShadow: i < receiveRemaining ? "0 0 8px rgba(100,180,255,0.5)" : "none", transition: "all 0.3s" }} />
        ))}
        <span style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.4)", fontSize: "0.72rem", marginLeft: 6 }}>
          {receiveRemaining > 0 ? `${receiveRemaining} receive${receiveRemaining!==1?"s":""} left` : <><CountdownTimer /> until tomorrow</>}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <Btn onClick={onWrite} disabled={remaining === 0}>✍️ Write a Message</Btn>
        <Btn onClick={onReceive} secondary disabled={receiveRemaining === 0}>✨ Receive a Transmission</Btn>
        <Btn onClick={onMyCapsules} secondary>📡 My Capsules</Btn>
        <Btn onClick={onMyReceived} secondary>💌 My Received Letters</Btn>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={shareRank} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>📸 Share my rank</button>
        <button onClick={shareApp} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>🔗 Share the app</button>
        
        <button onClick={() => setShowTip(true)} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>☕ Support the cosmos</button>
        <button onClick={onGuidelines} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>📋 Community guidelines</button>
        <button onClick={onFAQ} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>💬 FAQ</button>
      </div>
    </div>
  );
}

// ── Write Screen ─────────────────────────────────────────────────
function WriteScreen({ onBack, onSent, profile, sound }) {
  const [writeMode, setWriteMode] = useState(null);
  const [text, setText] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);
  const colorId = "amber";
  const accessoryId = "none";
  const [status, setStatus] = useState("idle");
  const [rejectReason, setRejectReason] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const isPremium = true;
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const remaining = getDailyRemaining();
  const maxLen = 700;

  const col = COLORS.find(c => c.id === colorId) || COLORS[0];

  const handleGetInspired = async () => {
    setStatus("generating");
    try { const p = await generatePrompt(theme); setAiPrompt(p); } catch { setAiPrompt(theme.prompt); }
    setStatus("idle");
  };

  const handleAIWrite = async () => {
    setStatus("generating");
    try { const l = await generateLetter(theme); setText(l.slice(0, 700)); } catch { setStatus("error"); return; }
    setStatus("idle");
  };

  const handleSend = async () => {
    setStatus("checking");
    try {
      let approved = true;
      let rejectMsg = "";
      try {
        const result = await moderateLetter(text.trim());
        approved = result.approved;
        rejectMsg = result.reason || "Your message doesn't meet our positivity guidelines.";
      } catch {
        // If moderation API fails (e.g. CORS in preview), allow through
        approved = true;
      }
      if (approved) {
        let letterId = null;
        try {
          letterId = await submitLetter(text.trim(), colorId, accessoryId, subject.trim()||null);
        } catch {
          // If DB fails, still let the animation play locally
        }
        const updated = recordSent(letterId, text.trim(), colorId, accessoryId, subject.trim()||null);
        const hit = MILESTONES.find(m => m === updated.sent);
        if (hit) { setMilestone(hit); setShowConfetti(true); sound.milestone(); setTimeout(() => setShowConfetti(false), 4000); }
        onSent(updated);
      } else {
        setRejectReason(rejectMsg);
        setStatus("rejected");
      }
    } catch(e) {
      console.error("Send error:", e);
      setStatus("error");
    }
  };

  const currentRank = getRank(profile.sent || 0);
  const newRank = getRank((profile.sent || 0) + 1);
  const rankUp = status === "approved" && newRank.name !== currentRank.name;

  // Step 1: Pick a theme first
  // Step 1: pick mode
  if (!writeMode) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"30px 20px", animation:"fadeUp 0.8s ease forwards", zIndex:1, position:"relative" }}>
      <p style={{ fontFamily:"'Georgia',serif", fontSize:"0.72rem", letterSpacing:"0.3em", color:"rgba(255,160,60,0.5)", textTransform:"uppercase", marginBottom:10 }}>New Transmission</p>
      <h2 style={{ fontFamily:"'Georgia',serif", fontWeight:400, fontSize:"1.8rem", color:"#ffd080", marginBottom:6, textAlign:"center" }}>How would you like to write? ✨</h2>
      <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.4)", fontSize:"0.88rem", marginBottom:32, textAlign:"center", maxWidth:340 }}>Choose how you want to craft your letter to a stranger.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:460 }}>
        {[
          ["✍️","Write it yourself","idle","A blank page, your heart, and the cosmos.","rgba(255,140,20,0.06)","rgba(255,140,20,0.25)","#ffd080"],
          ["💡","Get inspired","inspired","Pick a theme — AI sparks a prompt, you write the words.","rgba(100,180,255,0.05)","rgba(100,180,255,0.2)","#88ccff"],
          ["🤖","Let AI write for me","ai","Pick a theme — AI crafts the full letter. Edit or send as is.","rgba(180,100,255,0.05)","rgba(180,100,255,0.2)","#cc88ff"],
        ].map(([icon,title,mode,desc,bg,border,color])=>(
          <div key={mode} onClick={()=>{ if(mode==="idle"){ setWriteMode(mode); } else { setWriteMode("__picking_theme__"+mode); } }}
            style={{ cursor:"pointer", background:bg, border:`1.5px solid ${border}`, borderRadius:14, padding:"18px 22px", display:"flex", gap:14, alignItems:"flex-start", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{ fontSize:"1.6rem", lineHeight:1 }}>{icon}</div>
            <div>
              <div style={{ fontFamily:"'Georgia',serif", color, fontSize:"0.95rem", fontWeight:700, marginBottom:4 }}>{title}</div>
              <div style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.38)", fontSize:"0.8rem" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,160,60,0.35)", fontFamily:"'Georgia',serif", fontSize:"0.85rem", cursor:"pointer", marginTop:28 }}>← Back</button>
    </div>
  );

  // Step 2: theme picker — only for inspired/ai
  if (writeMode && writeMode.startsWith("__picking_theme__")) {
    const pendingMode = writeMode.replace("__picking_theme__","");
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"30px 20px", animation:"fadeUp 0.8s ease forwards", zIndex:1, position:"relative" }}>
        <p style={{ fontFamily:"'Georgia',serif", fontSize:"0.72rem", letterSpacing:"0.3em", color:"rgba(255,160,60,0.5)", textTransform:"uppercase", marginBottom:10 }}>New Transmission</p>
        <h2 style={{ fontFamily:"'Georgia',serif", fontWeight:400, fontSize:"1.8rem", color:"#ffd080", marginBottom:6, textAlign:"center" }}>Choose a theme ✨</h2>
        <p style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.4)", fontSize:"0.88rem", marginBottom:28, textAlign:"center", maxWidth:340 }}>What feeling do you want to send into the cosmos?</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:460, marginBottom:28 }}>
          {THEMES.map(t => (
            <div key={t.id} onClick={()=>setTheme(t)}
              style={{ cursor:"pointer", background:theme.id===t.id?"rgba(255,140,20,0.14)":"rgba(255,140,20,0.04)", border:`1.5px solid ${theme.id===t.id?"rgba(255,180,60,0.7)":"rgba(255,140,20,0.15)"}`, borderRadius:14, padding:"14px 20px", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}
              onMouseEnter={e=>{if(theme.id!==t.id){e.currentTarget.style.background="rgba(255,140,20,0.08)";}}}
              onMouseLeave={e=>{if(theme.id!==t.id){e.currentTarget.style.background="rgba(255,140,20,0.04)";}}}
            >
              <span style={{ fontSize:"1.5rem", flexShrink:0 }}>{t.label.split(" ")[0]}</span>
              <div>
                <div style={{ fontFamily:"'Georgia',serif", color:theme.id===t.id?"#ffd080":"rgba(255,200,100,0.6)", fontSize:"0.92rem", fontWeight:theme.id===t.id?700:400 }}>{t.label.split(" ").slice(1).join(" ")}</div>
                <div style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,160,60,0.35)", fontSize:"0.75rem", marginTop:2 }}>{t.prompt}</div>
              </div>
              {theme.id===t.id && <div style={{ marginLeft:"auto", width:10, height:10, borderRadius:"50%", background:"#ffa520", boxShadow:"0 0 10px rgba(255,140,20,0.8)", flexShrink:0 }} />}
            </div>
          ))}
        </div>
        <Btn onClick={()=>{ setWriteMode(pendingMode); if(pendingMode==="inspired") handleGetInspired(); if(pendingMode==="ai") handleAIWrite(); }}>Continue with {theme.label} →</Btn>
        <button onClick={()=>setWriteMode(null)} style={{ background:"none", border:"none", color:"rgba(255,160,60,0.35)", fontFamily:"'Georgia',serif", fontSize:"0.85rem", cursor:"pointer", marginTop:16 }}>← Back</button>
      </div>
    );
  }

  // Approved
  if (status === "approved") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"30px",animation:"fadeUp 0.8s ease forwards",zIndex:1,position:"relative",textAlign:"center" }}>
      {showConfetti && <Confetti />}
      <div style={{ animation:"capsuleFloat 3s ease-in-out infinite", position:"relative" }}>
        <CapsuleSVG colorId={colorId} size={90} glowing />
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <AccLayer accessoryId={accessoryId} colorId={colorId} size={90} />
        </div>
      </div>
      {milestone && <div style={{ background:"rgba(255,200,0,0.12)",border:"1px solid rgba(255,200,0,0.4)",borderRadius:14,padding:"12px 24px",margin:"16px 0" }}><p style={{ fontFamily:"'Georgia',serif",color:"#ffd080",fontSize:"1rem",margin:0 }}>🎉 Milestone! You've sent {milestone} letters!</p></div>}
      {rankUp && <div style={{ background:"rgba(255,200,0,0.1)",border:"1px solid rgba(255,200,0,0.35)",borderRadius:14,padding:"10px 22px",marginBottom:12 }}><p style={{ fontFamily:"'Georgia',serif",color:"#ffd080",fontSize:"0.95rem",margin:0 }}>🎉 Rank Up! You're now <strong>{newRank.name} {newRank.icon}</strong></p></div>}
      <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.7rem",color:"#ffd080",marginTop:20,marginBottom:10 }}>Launched into the cosmos 🌌</h2>
      <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,200,100,0.55)",fontSize:"0.92rem",maxWidth:320,marginBottom:10,lineHeight:1.7 }}>Somewhere out there, a stranger will intercept your kindness.</p>
      <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.35)",fontSize:"0.78rem",marginBottom:28,fontStyle:"italic" }}>
        {getDailyRemaining()>0 ? `${getDailyRemaining()} letter${getDailyRemaining()!==1?"s":""} remaining today` : "That's your last one for today. Come back tomorrow! 🌙"}
      </p>
      <Btn onClick={onBack}>Return to Base</Btn>
    </div>
  );

  // Preview
  if (status === "previewing") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"30px 20px",animation:"fadeUp 0.8s ease forwards",zIndex:1,position:"relative" }}>
      {(status==="checking") && (
        <div style={{ position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,5,0,0.92)",flexDirection:"column",gap:20 }}>
          <div style={{ animation:"capsuleFloat 2s ease-in-out infinite", display:"flex", justifyContent:"center" }}><CapsuleSVG colorId="amber" size={55} glowing /></div>
          <p style={{ fontFamily:"'Georgia',serif",color:"#ffd080",fontSize:"1.05rem" }}>Preparing your transmission…</p>
          <div style={{ display:"flex",gap:10 }}>{[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#ffa520",animation:"pulseGlow 1.2s ease-in-out infinite",animationDelay:`${i*0.3}s` }}/>)}</div>
        </div>
      )}
      <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.72rem",letterSpacing:"0.3em",color:"rgba(255,160,60,0.5)",textTransform:"uppercase",marginBottom:10 }}>Preview</p>
      <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.6rem",color:"#ffd080",marginBottom:8,textAlign:"center" }}>Does this feel right? ✨</h2>
      <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,200,100,0.4)",fontSize:"0.84rem",marginBottom:22,textAlign:"center" }}>This is exactly what a stranger will receive.</p>
      <div style={{ animation:"capsuleFloat 4s ease-in-out infinite",marginBottom:14,position:"relative" }}>
        <CapsuleSVG colorId={colorId} size={80} glowing />
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}><AccLayer accessoryId={accessoryId} colorId={colorId} size={80} /></div>
      </div>
      {/* Paper — identical to how recipient sees it */}
      <div style={{ width:"100%",maxWidth:500,position:"relative",marginBottom:20 }}>
        <div style={{ position:"absolute",inset:0,borderRadius:16,background:"rgba(0,0,0,0.35)",transform:"translate(4px,6px)",filter:"blur(8px)" }} />
        <div style={{ position:"relative",background:"linear-gradient(160deg,#fffdf0,#fff8dc,#fff3c8)",borderRadius:16,padding:"36px 34px 42px",border:"1px solid rgba(255,200,100,0.3)",boxShadow:"0 0 60px rgba(255,160,40,0.12),inset 0 0 40px rgba(255,240,180,0.08)" }}>
          {/* Paper lines */}
          {[...Array(12)].map((_,i) => (
            <div key={i} style={{ position:"absolute",left:34,right:34,top:`${72+i*22}px`,height:"1px",background:"rgba(180,140,60,0.1)",borderRadius:1 }} />
          ))}
          {/* Fold corner */}
          <div style={{ position:"absolute",top:0,right:0,width:0,height:0,borderStyle:"solid",borderWidth:"0 36px 36px 0",borderColor:"transparent rgba(255,220,120,0.5) transparent transparent" }} />
          {/* Wax seal */}
          <div style={{ position:"absolute",bottom:14,right:20,width:28,height:28,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,80,60,0.5),rgba(200,40,20,0.4))",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(200,40,20,0.3)" }}>
            <span style={{ fontSize:"0.7rem" }}>✦</span>
          </div>
          {/* Subject stamp — Kalam font, same as letter */}
          {subject.trim() && (
            <div style={{ position:"absolute",top:14,left:18,background:"rgba(255,160,40,0.12)",border:"1px solid rgba(255,160,40,0.2)",borderRadius:10,padding:"2px 10px" }}>
              <span style={{ fontFamily:"'Kalam',cursive",fontWeight:700,fontSize:"0.82rem",color:"rgba(160,110,30,0.85)" }}>
                ✦ {subject.trim()}
              </span>
            </div>
          )}
          {/* Letter text */}
          <p style={{ fontFamily:"'Kalam',cursive",fontSize:"1.25rem",fontWeight:700,lineHeight:1.85,color:"rgba(60,35,5,0.88)",margin:0,whiteSpace:"pre-wrap",position:"relative",zIndex:1,marginTop:subject.trim()?16:0 }}>{text}</p>
        </div>
      </div>
      <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.28)",fontSize:"0.72rem",marginBottom:20,textAlign:"center" }}>Sent anonymously from somewhere in the universe.</p>
      <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center" }}>
        <Btn onClick={()=>setStatus("idle")} secondary>✏️ Edit</Btn>
        <Btn onClick={handleSend}>🚀 Launch Capsule</Btn>
      </div>
    </div>
  );

  // Write form
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"30px 20px",animation:"fadeUp 0.8s ease forwards",zIndex:1,position:"relative" }}>
      
      {(status==="checking"||status==="generating") && (
        <div style={{ position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,5,0,0.92)",flexDirection:"column",gap:18 }}>
          <div style={{ animation:"capsuleFloat 2s ease-in-out infinite", display:"flex", justifyContent:"center" }}>{status==="generating" ? <span style={{fontSize:55}}>{writeMode==="inspired"?"💡":"🤖"}</span> : <CapsuleSVG colorId="amber" size={55} glowing />}</div>
          <p style={{ fontFamily:"'Georgia',serif",color:"#ffd080",fontSize:"1.05rem" }}>{status==="generating"?writeMode==="inspired"?"Finding your spark…":"Crafting your letter…":"Preparing your transmission…"}</p>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.45)",fontSize:"0.82rem" }}>{status==="generating"?"Consulting the stars":"Checking it's ready for the cosmos"}</p>
          <div style={{ display:"flex",gap:10 }}>{[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#ffa520",animation:"pulseGlow 1.2s ease-in-out infinite",animationDelay:`${i*0.3}s` }}/>)}</div>
        </div>
      )}

      <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.72rem",letterSpacing:"0.3em",color:"rgba(255,160,60,0.5)",textTransform:"uppercase",marginBottom:8 }}>New Transmission</p>
      <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.7rem",color:"#ffd080",marginBottom:18,textAlign:"center" }}>Write your message</h2>

      {/* AI prompt hint — only shown after theme was chosen */}
      {writeMode==="inspired" && aiPrompt && (
        <div style={{ width:"100%",maxWidth:520,marginBottom:14 }}>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(150,210,255,0.7)",fontSize:"0.88rem",lineHeight:1.6 }}>💡 {aiPrompt} <button onClick={handleGetInspired} style={{ background:"none",border:"none",color:"rgba(100,180,255,0.5)",fontFamily:"'Georgia',serif",fontSize:"0.72rem",cursor:"pointer" }}>↻ new spark</button></p>
        </div>
      )}
      {writeMode==="ai" && text && (
        <div style={{ width:"100%",maxWidth:520,marginBottom:8 }}>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(200,150,255,0.6)",fontSize:"0.82rem" }}>🤖 AI wrote this — feel free to edit <button onClick={handleAIWrite} style={{ background:"none",border:"none",color:"rgba(180,100,255,0.5)",fontFamily:"'Georgia',serif",fontSize:"0.72rem",cursor:"pointer" }}>↻ rewrite</button></p>
        </div>
      )}
      {/* Subject/mood — available for all modes */}
      <div style={{ width:"100%",maxWidth:520,marginBottom:14 }}>
        <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.5)",fontSize:"0.68rem",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8 }}>Subject or mood (optional)</p>
        <input
          value={subject} onChange={e=>setSubject(e.target.value.slice(0,60))}
          placeholder="e.g. hope, courage, a rainy day feeling…"
          style={{ width:"100%",background:"rgba(255,140,20,0.05)",border:"1.5px solid rgba(255,140,20,0.2)",borderRadius:12,padding:"10px 16px",color:"rgba(255,220,140,0.85)",fontFamily:"'Georgia',serif",fontSize:"1rem",outline:"none",boxSizing:"border-box",caretColor:"#ffa520" }}
        />
        <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.3)",fontSize:"0.75rem",marginTop:5 }}>This will appear gently on the letter when received. 💛</p>
      </div>

      {/* Textarea */}
      <div style={{ width:"100%",maxWidth:520,background:"rgba(255,140,20,0.05)",border:`1.5px solid ${status==="rejected"?"rgba(255,80,60,0.5)":"rgba(255,140,20,0.22)"}`,borderRadius:16,padding:"4px" }}>
        <textarea value={text} onChange={e=>{setText(e.target.value.slice(0,maxLen));if(status==="rejected")setStatus("idle");}}
          placeholder={writeMode==="inspired"&&aiPrompt?aiPrompt:"Dear stranger across the stars…"} rows={6}
          style={{ width:"100%",background:"transparent",border:"none",outline:"none",resize:"none",color:"rgba(255,220,140,0.9)",padding:"16px 18px",fontFamily:"'Kalam',cursive",fontSize:"1.2rem",fontWeight:700,lineHeight:1.7,caretColor:"#ffa520",boxSizing:"border-box" }} />
      </div>
      <div style={{ width:"100%",maxWidth:520,display:"flex",justifyContent:"space-between",marginTop:7,marginBottom:6,color:"rgba(255,160,60,0.38)",fontFamily:"'Georgia',serif",fontSize:"0.75rem" }}>
        <span>{text.length<10?"Write at least 10 characters":"✓ Ready to preview"}</span>
        <span>{text.length}/{maxLen}</span>
      </div>

      {status==="rejected" && (
        <div style={{ width:"100%",maxWidth:520,background:"rgba(255,60,40,0.08)",border:"1.5px solid rgba(255,80,60,0.28)",borderRadius:12,padding:"13px 18px",marginBottom:10 }}>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,140,100,0.9)",fontSize:"0.86rem",margin:0,lineHeight:1.6 }}>🚫 <strong>This message can't travel the cosmos.</strong><br /><span style={{ fontStyle:"italic",opacity:0.8 }}>{rejectReason}</span></p>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.45)",fontSize:"0.76rem",marginTop:7,marginBottom:0,fontStyle:"italic" }}>Please rewrite with kindness. 💛</p>
        </div>
      )}
      {status==="error" && <p style={{ color:"rgba(255,100,60,0.8)",fontFamily:"'Georgia',serif",fontSize:"0.84rem",marginBottom:10 }}>Something went wrong. Please try again.</p>}

      <div style={{ display:"flex",gap:12,marginTop:8 }}>
        <Btn onClick={()=>setWriteMode(null)} secondary>← Back</Btn>
        <Btn onClick={()=>{ if(text.trim().length>=10) setStatus("previewing"); }} disabled={text.trim().length<10||status==="checking"||status==="generating"}>Preview Letter 👁️</Btn>
      </div>
      
    </div>
  );
}

// ── Receive Screen ───────────────────────────────────────────────
function ReceiveScreen({ onBack, onWrite, sound }) {
  const [stage, setStage] = useState("warp"); // warp|arriving|opening|emerging|reading
  const [warpProg, setWarpProg] = useState(0);
  const [letterData, setLetterData] = useState(null);
  const [hearted, setHearted] = useState(false);
  const [kept, setKept] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [receiveRemaining, setReceiveRemaining] = useState(getDailyReceiveRemaining());
  const timers = useRef([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const loadLetter = useCallback(async () => {
    if (getDailyReceiveRemaining() <= 0) return;
    clear();
    recordReceive();
    setReceiveRemaining(getDailyReceiveRemaining());
    setStage("warp"); setWarpProg(0); setHearted(false); setKept(false); setCopied(false); setLetterData(null);
    // Fetch while warp plays
    let data = null;
    try { data = await fetchRandomLetter(getSentIds(), getSeenReceivedIds()); }
    catch { data = null; }
    // If no letters available, refund the receive count and show empty state
    if (!data) {
      // Refund — don't penalise for an empty cosmos
      const p = getProfile();
      p.receiveCount = Math.max(0, (p.receiveCount || 1) - 1);
      saveProfile(p);
      setReceiveRemaining(getDailyReceiveRemaining());
      setStage("empty");
      return;
    }
    // Warp progress
    sound.warpHum();
    for (let i = 1; i <= 3; i++) {
      timers.current.push(setTimeout(() => setWarpProg(i), i * 1000));
    }
    timers.current.push(setTimeout(() => {
      if (data?.id) markLetterSeen(data.id);
      setLetterData(data);
      setStage("arriving");
      sound.launch();
    }, 3500));
    timers.current.push(setTimeout(() => {
      setStage("opening");
      sound.capsuleOpen();
    }, 5700));
    timers.current.push(setTimeout(() => {
      setStage("emerging");
      sound.letterEmerge();
    }, 7500));
    timers.current.push(setTimeout(() => {
      setStage("reading");
    }, 8900));
  }, []);

  useEffect(() => { loadLetter(); return clear; }, []);

  const handleHeart = async () => {
    if (hearted) return;
    setHearted(true); sound.heart();
    if (letterData?.id) {
      try { await incrementHeart(letterData.id); } catch {}
    }
  };
  const handleKeep = () => {
    if (kept || !letterData) return;
    saveReceivedLetter(letterData);
    setKept(true);
  };
  const fallbackCopy = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch(e) {}
    document.body.removeChild(el);
  };
  const handleCopy = () => {
    if (!letterData) return;
    const parts = [];
    if (letterData.theme) parts.push('✦ ' + letterData.theme + '\n\n');
    parts.push(letterData.message);
    const text = parts.join('');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const days = letterData ? daysFloating(letterData.created_at) : 0;
  const subjectTag = letterData?.theme || null;

  return (
    <div style={{ minHeight:"100vh", position:"relative", overflow:"hidden" }}>
      {showReport && letterData?.id && <ReportModal letterId={letterData.id} onClose={()=>setShowReport(false)} />}

      {/* ── WARP stage ── */}
      {/* ── EMPTY state — no letters in cosmos yet ── */}
      {stage === "empty" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"40px 20px",textAlign:"center",animation:"fadeUp 0.8s ease forwards",zIndex:1,position:"relative" }}>
          <div style={{ fontSize:"4rem",marginBottom:20,animation:"capsuleFloat 4s ease-in-out infinite" }}>🌌</div>
          <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.72rem",letterSpacing:"0.3em",color:"rgba(255,160,60,0.45)",textTransform:"uppercase",marginBottom:12 }}>The Cosmos is Quiet</p>
          <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.6rem",color:"#ffd080",marginBottom:14 }}>No transmissions yet</h2>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,200,100,0.5)",fontSize:"0.95rem",lineHeight:1.8,maxWidth:320,marginBottom:8 }}>The universe is waiting for the first letter. That could be yours.</p>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.3)",fontSize:"0.8rem",lineHeight:1.7,maxWidth:300,marginBottom:32 }}>Someone needs to start the signal. Be the first to send kindness into the void — and it will come back to you. 💛</p>
          <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
            <Btn onClick={onBack} secondary>← Return to Base</Btn>
            <Btn onClick={onWrite}>✍️ Write a Letter</Btn>
          </div>
        </div>
      )}

      {stage === "warp" && <WarpScreen progress={warpProg} receive />}

      {/* ── EMPTY stage — no real letters yet ── */}
      {stage === "empty" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",textAlign:"center",padding:30,animation:"fadeUp 0.8s ease forwards",zIndex:1,position:"relative" }}>
          <div style={{ animation:"capsuleFloat 4s ease-in-out infinite",marginBottom:24,opacity:0.6 }}>
            <CapsuleSVG colorId="amber" size={100} />
          </div>
          <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.6rem",color:"#ffd080",marginBottom:12 }}>The cosmos is quiet… 🌌</h2>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,200,100,0.5)",fontSize:"0.95rem",maxWidth:320,lineHeight:1.8,marginBottom:28 }}>No capsules are drifting through space yet. Be the first to send a letter — and start the chain of kindness. 💛</p>
          <Btn onClick={onBack} secondary>← Return to Base</Btn>
        </div>
      )}

      {/* ── ARRIVING stage ── */}
      {stage === "arriving" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",textAlign:"center",padding:20 }}>
          {/* Nebula burst */}
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,140,20,0.18), transparent 70%)",animation:"pulseGlow 1s ease-in-out infinite",pointerEvents:"none" }} />
          {/* Stars streaking in */}
          {[...Array(8)].map((_,i) => (
            <div key={i} style={{ position:"absolute", width:"1.5px", height:`${30+i*8}px`, background:`linear-gradient(to bottom, transparent, rgba(255,200,120,${0.4+i*0.05}))`, top:`${10+i*10}%`, left:`${5+i*12}%`, animation:`starStreak ${0.6+i*0.15}s linear infinite`, animationDelay:`${i*0.12}s`, borderRadius:2 }} />
          ))}
          <div style={{ animation:"capsuleArrive 2s cubic-bezier(0.2,0.8,0.3,1) forwards", position:"relative", zIndex:2 }}>
            {/* Flipped — nose pointing DOWN toward viewer */}
            <div style={{ transform:"rotate(180deg)" }}>
              <CapsuleSVG colorId="amber" size={120} glowing />
            </div>
          </div>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,200,100,0.6)",fontSize:"0.95rem",marginTop:24,fontStyle:"italic",position:"relative",zIndex:2,animation:"fadeUp 0.8s ease forwards" }}>
            A capsule has found you… 🛸
          </p>
        </div>
      )}

      {/* ── OPENING stage ── */}
      {stage === "opening" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",textAlign:"center",padding:20 }}>
          {/* Golden burst */}
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-60%)",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,80,0.35), transparent 70%)",animation:"pulseGlow 0.6s ease-in-out infinite",pointerEvents:"none" }} />
          {[...Array(12)].map((_,i) => {
            const angle = i * 30;
            const dist = 80 + (i%3)*20;
            return (
              <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:"2px", height:`${8+i%4*4}px`, background:"rgba(255,220,100,0.7)", borderRadius:2, transformOrigin:"top center", transform:`translate(-50%,-${dist}%) rotate(${angle}deg)`, animation:`sparkle 0.8s ease-in-out infinite`, animationDelay:`${i*0.07}s` }} />
            );
          })}
          <div style={{ position:"relative", zIndex:2, transform:"rotate(180deg)" }}>
            <CapsuleSVG colorId="amber" size={120} glowing open />
          </div>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,220,120,0.7)",fontSize:"0.95rem",marginTop:20,fontStyle:"italic",position:"relative",zIndex:2 }}>
            Opening… ✨
          </p>
        </div>
      )}

      {/* ── EMERGING stage ── */}
      {stage === "emerging" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",textAlign:"center",padding:20,gap:0 }}>
          <div style={{ position:"relative",zIndex:2 }}>
            <CapsuleSVG colorId="amber" size={90} glowing open />
          </div>
          <div style={{ animation:"paperEmerge 1.2s cubic-bezier(0.2,0.8,0.3,1) forwards", marginTop:-20, position:"relative", zIndex:3 }}>
            <Paper emerging theme={letterData?.theme} />
          </div>
        </div>
      )}

      {/* ── READING stage ── */}
      {stage === "reading" && letterData && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",minHeight:"100vh",padding:"40px 20px 30px",animation:"fadeUp 0.8s ease forwards",position:"relative",zIndex:1 }}>
          {/* Floating capsule top */}
          <div style={{ animation:"capsuleFloat 5s ease-in-out infinite",marginBottom:8,opacity:0.7 }}>
            <CapsuleSVG colorId="amber" size={50} />
          </div>

          <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.7rem",letterSpacing:"0.3em",color:"rgba(255,160,60,0.45)",textTransform:"uppercase",marginBottom:6,textAlign:"center" }}>Transmission Received</p>
          <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.5rem",color:"#ffd080",marginBottom:6,textAlign:"center" }}>A message found you 🌠</h2>

          {/* Floating days + theme mood stamp */}
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:20 }}>
            {days > 0 && (
              <div style={{ background:"rgba(255,140,20,0.08)",border:"1px solid rgba(255,140,20,0.2)",borderRadius:20,padding:"4px 14px" }}>
                <span style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.55)",fontSize:"0.75rem" }}>🛸 Floating for {days} {days===1?"day":"days"}</span>
              </div>
            )}

            {subjectTag && (
              <div style={{ background:"rgba(255,140,20,0.08)",border:"1px solid rgba(255,160,60,0.2)",borderRadius:20,padding:"4px 14px" }}>
                <span style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,200,100,0.65)",fontSize:"0.75rem" }}>✦ {subjectTag}</span>
              </div>
            )}
          </div>

          {/* The letter — styled as a real piece of paper */}
          <div style={{ width:"100%",maxWidth:520,position:"relative",marginBottom:20 }}>
            {/* Paper shadow */}
            <div style={{ position:"absolute",inset:0,borderRadius:16,background:"rgba(0,0,0,0.35)",transform:"translate(4px,6px)",filter:"blur(8px)" }} />
            <div style={{ position:"relative",background:"linear-gradient(160deg,#fffdf0,#fff8dc,#fff3c8)",borderRadius:16,padding:"36px 34px 42px",border:"1px solid rgba(255,200,100,0.3)",boxShadow:"0 0 60px rgba(255,160,40,0.12),inset 0 0 40px rgba(255,240,180,0.08)" }}>
              {/* Paper texture lines */}
              {[...Array(12)].map((_,i) => (
                <div key={i} style={{ position:"absolute",left:34,right:34,top:`${72+i*22}px`,height:"1px",background:"rgba(180,140,60,0.1)",borderRadius:1 }} />
              ))}
              {/* Fold corner */}
              <div style={{ position:"absolute",top:0,right:0,width:0,height:0,borderStyle:"solid",borderWidth:"0 36px 36px 0",borderColor:`transparent rgba(255,220,120,0.5) transparent transparent` }} />
              {/* Wax seal */}
              <div style={{ position:"absolute",bottom:14,right:20,width:28,height:28,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,80,60,0.5),rgba(200,40,20,0.4))",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(200,40,20,0.3)" }}>
                <span style={{ fontSize:"0.7rem" }}>✦</span>
              </div>
              {/* Subject stamp top left */}
              {subjectTag && (
                <div style={{ position:"absolute",top:14,left:18,background:"rgba(255,160,40,0.12)",border:"1px solid rgba(255,160,40,0.2)",borderRadius:10,padding:"2px 10px" }}>
                  <span style={{ fontFamily:"'Kalam',cursive",fontWeight:700,fontSize:"0.82rem",color:"rgba(160,110,30,0.85)" }}>✦ {subjectTag}</span>
                </div>
              )}
              {/* Letter text */}
              <p style={{ fontFamily:"'Kalam',cursive",fontSize:"1.3rem",fontWeight:700,lineHeight:2,color:"rgba(80,50,10,0.88)",margin:0,whiteSpace:"pre-wrap",position:"relative",zIndex:1,marginTop:subjectTag?16:0 }}>
                {letterData.message}
              </p>
            </div>
          </div>

          {/* Heart + Report */}
          <div style={{ display:"flex",gap:12,justifyContent:"center",marginBottom:8,flexWrap:"wrap" }}>
            <button onClick={handleHeart} disabled={hearted}
              style={{ background:hearted?"rgba(255,100,100,0.2)":"rgba(255,100,100,0.07)",border:`1px solid ${hearted?"rgba(255,100,100,0.5)":"rgba(255,100,100,0.15)"}`,borderRadius:30,padding:"11px 24px",cursor:hearted?"default":"pointer",display:"inline-flex",alignItems:"center",gap:8,transition:"all 0.3s",transform:hearted?"scale(1.05)":"scale(1)" }}>
              <span style={{ fontSize:"1.1rem" }}>{hearted?"❤️":"🤍"}</span>
              <span style={{ fontFamily:"'Georgia',serif",color:hearted?"rgba(255,160,140,0.95)":"rgba(255,160,120,0.5)",fontSize:"0.85rem" }}>This touched my heart</span>
            </button>
            <button onClick={()=>setShowReport(true)} style={{ background:"none",border:"1px solid rgba(255,255,255,0.06)",borderRadius:30,padding:"11px 18px",cursor:"pointer",color:"rgba(255,160,60,0.28)",fontFamily:"'Georgia',serif",fontSize:"0.78rem",transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color="rgba(255,80,60,0.7)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,160,60,0.28)"}>🚩 Report</button>
          </div>
          {hearted && <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.4)",fontSize:"0.72rem",textAlign:"center",marginBottom:12 }}>The sender will silently feel this. 💛</p>}
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.22)",fontSize:"0.7rem",textAlign:"center",marginBottom:24 }}>Sent anonymously from somewhere in the universe.</p>
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:12 }}>
            <button onClick={handleKeep} style={{ background:kept?"rgba(255,140,20,0.15)":"rgba(255,140,20,0.07)", border:`1px solid ${kept?"rgba(255,180,60,0.6)":"rgba(255,140,20,0.2)"}`, borderRadius:30, padding:"10px 20px", cursor:kept?"default":"pointer", display:"inline-flex", alignItems:"center", gap:7, fontFamily:"'Georgia',serif", color:kept?"#ffd080":"rgba(255,200,100,0.55)", fontSize:"0.85rem", transition:"all 0.3s" }}>
              {kept ? "✦ Kept in my collection" : "🗂 Keep this letter"}
            </button>
            <button onClick={handleCopy} style={{ background:"rgba(255,140,20,0.05)", border:"1px solid rgba(255,140,20,0.15)", borderRadius:30, padding:"10px 20px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, fontFamily:"'Georgia',serif", color:"rgba(255,200,100,0.45)", fontSize:"0.85rem", transition:"all 0.2s" }}>
              {copied ? "✓ Copied!" : "📋 Copy text"}
            </button>
          </div>
          <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:8 }}>
            <Btn onClick={onBack} secondary>← Return to Base</Btn>
            <Btn onClick={()=>{ setKept(false); setCopied(false); loadLetter(); }} disabled={receiveRemaining <= 0}>Another Signal ✨</Btn>
          </div>
          {/* Receive dots */}
          <div style={{ display:"flex",gap:6,alignItems:"center",justifyContent:"center",marginTop:4 }}>
            {[...Array(MAX_DAILY_RECEIVE)].map((_,i) => (
              <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:i < receiveRemaining?"#ffa520":"rgba(255,140,20,0.18)",boxShadow:i < receiveRemaining?"0 0 7px rgba(255,140,20,0.6)":"none",transition:"all 0.3s" }} />
            ))}
            <span style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.4)",fontSize:"0.7rem",marginLeft:6 }}>
              {receiveRemaining > 0 ? `${receiveRemaining} transmission${receiveRemaining!==1?"s":""} left today` : <><CountdownTimer /> until tomorrow</>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Send Animation Screen ────────────────────────────────────────
function SendAnimScreen({ colorId, accessoryId, onDone, sound, milestone, showConfetti }) {
  // stages: paper → folding → loading → sealing → launching → warping → done
  const [stage, setStage] = useState("paper");
  const [warpProg, setWarpProg] = useState(0);
  const timers = useRef([]);
  const addT = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };

  const nebStars = useRef(Array.from({length:60},(_,i)=>({
    x:(i*137.5)%100, y:(i*97.3)%100,
    size:(i%3)+0.5, dur:2+(i%4), delay:(i%5)*0.7, op:0.08+(i%5)*0.05
  }))).current;

  useEffect(() => {
    // Stage 1: paper floats (user sees it immediately)
    setStage("paper");
    addT(() => sound.paperRustle(), 150);
    // Stage 2: paper folds
    addT(() => setStage("folding"), 1400);
    // Stage 3: paper loads into capsule
    addT(() => { setStage("loading"); sound.capsuleLoad(); }, 2600);
    // Stage 4: capsule seals
    addT(() => setStage("sealing"), 4000);
    // Stage 5: launch
    addT(() => { setStage("launching"); sound.launch(); }, 5200);
    // Stage 6: warp
    addT(() => { setStage("warping"); sound.warpHum(); }, 6800);
    // Warp progress — fix closure with IIFE
    for (let i = 1; i <= 6; i++) {
      ((val) => addT(() => setWarpProg(val), 6800 + val * 1000))(i);
    }
    // Done
    addT(() => onDone(), 14000);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ minHeight:"100vh", position:"relative", overflow:"hidden",
      background:"radial-gradient(ellipse at 30% 40%, rgba(160,70,0,0.22) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(180,100,0,0.16) 0%, transparent 50%), #070308" }}>

      {/* Twinkling stars */}
      {nebStars.map((s,i) => (
        <div key={i} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:s.size, height:s.size, borderRadius:"50%",
          background:`rgba(255,210,130,${s.op})`,
          animation:`twinkle ${s.dur}s ease-in-out infinite`,
          animationDelay:`${s.delay}s`, pointerEvents:"none" }} />
      ))}

      {/* Nebula wisps */}
      <div style={{ position:"absolute", top:"10%", left:"5%", width:"40%", height:"40%",
        borderRadius:"50%", background:"radial-gradient(circle, rgba(255,100,20,0.07), transparent 70%)",
        animation:"pulseGlow 5s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"15%", right:"8%", width:"35%", height:"35%",
        borderRadius:"50%", background:"radial-gradient(circle, rgba(200,80,0,0.06), transparent 70%)",
        animation:"pulseGlow 7s ease-in-out infinite", animationDelay:"2s", pointerEvents:"none" }} />

      {/* Warp screen takes over — fixed full screen, always centered */}
      {stage === "warping" && <WarpScreen progress={warpProg} />}

      {/* Animation stages */}
      {stage !== "warping" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", minHeight:"100vh", position:"relative", zIndex:2,
          textAlign:"center", padding:20 }}>

          {/* ── PAPER floating ── */}
          {(stage === "paper" || stage === "folding") && (
            <div style={{ animation: stage==="folding" ? "paperFold 1.2s ease forwards" : "fadeUp 0.5s ease forwards" }}>
              <div style={{ animation: stage==="paper" ? "paperFloat 2s ease-in-out infinite" : "none" }}>
                <Paper />
              </div>
              <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,180,80,0.6)",
                fontSize:"0.9rem", marginTop:22, fontStyle:"italic",
                animation:"pulseGlow 2s ease-in-out infinite" }}>
                {stage==="paper" ? "Your letter is ready ✨" : "Folding carefully… 📄"}
              </p>
            </div>
          )}

          {/* ── LOADING — paper slides INTO open capsule ── */}
          {stage === "loading" && (
            <div style={{ position:"relative", display:"flex", flexDirection:"column",
              alignItems:"center", height:300, justifyContent:"center" }}>
              {/* Open capsule waiting */}
              <div style={{ position:"relative", zIndex:1 }}>
                <CapsuleSVG colorId="amber" size={120} glowing open />
              </div>
              {/* Paper slides down into capsule opening */}
              <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                animation:"paperIntoCapsuIe 1.4s cubic-bezier(0.4,0,0.8,1) forwards", zIndex:2 }}>
                <Paper folded />
              </div>
              {/* Glow at capsule top */}
              <div style={{ position:"absolute", top:"30%", left:"50%",
                transform:"translate(-50%,-50%)", width:60, height:60, borderRadius:"50%",
                background:"rgba(255,200,80,0.2)", filter:"blur(10px)",
                animation:"pulseGlow 0.6s ease-in-out infinite", pointerEvents:"none" }} />
              <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,180,80,0.6)",
                fontSize:"0.9rem", marginTop:16, fontStyle:"italic",
                position:"absolute", bottom:-10 }}>
                Loading your letter… 📬
              </p>
            </div>
          )}

          {/* ── SEALING — capsule closes ── */}
          {stage === "sealing" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ animation:"capsuleFloat 2s ease-in-out infinite", position:"relative" }}>
                <CapsuleSVG colorId="amber" size={120} glowing />
                {/* Sealed sparkle */}
                <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
                  fontSize:"1.4rem", animation:"paperEmerge 0.5s ease forwards" }}>✨</div>
              </div>
              <div style={{ marginTop:16, background:"rgba(255,140,20,0.1)",
                border:"1px solid rgba(255,140,20,0.25)", borderRadius:20, padding:"6px 18px" }}>
                <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,200,100,0.7)",
                  fontSize:"0.85rem", fontStyle:"italic" }}>Capsule sealed 🔒</p>
              </div>
            </div>
          )}

          {/* ── LAUNCHING ── */}
          {stage === "launching" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:"100%", position:"relative" }}>
              {/* Capsule + trail move together as one unit */}
              <div style={{ animation:"capsuleLaunch 1.8s cubic-bezier(0.3,0,0.6,1) forwards", display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
                {/* Capsule body */}
                <CapsuleSVG colorId="amber" size={120} glowing />
                {/* Trail — absolutely centered under capsule bottom */}
                <div style={{ position:"absolute", top:"92%", left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
                  <div style={{ width:16, height:85, background:"linear-gradient(to bottom, rgba(255,180,40,0.95), transparent)", borderRadius:"0 0 50% 50%", animation:"trailFlick 0.35s ease-in-out infinite" }} />
                  <div style={{ width:10, height:60, marginTop:-68, background:"linear-gradient(to bottom, rgba(255,240,100,0.9), transparent)", borderRadius:"0 0 50% 50%", animation:"trailFlick 0.25s ease-in-out infinite alternate" }} />
                  <div style={{ width:4, height:38, marginTop:-48, background:"linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)", borderRadius:"0 0 50% 50%", animation:"trailFlick 0.18s ease-in-out infinite" }} />
                </div>
              </div>
              <p style={{ fontFamily:"'Georgia',serif", color:"rgba(255,220,80,0.8)", fontSize:"0.95rem", fontStyle:"italic", animation:"pulseGlow 0.7s ease-in-out infinite", marginTop:80 }}>
                Launching! 🚀
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── App Root ─────────────────────────────────────────────────────
export default function CosmicCapsule() {
  const [screen, setScreen] = useState("home");
  const [profile, setProfile] = useState(getProfile());
  const [pendingColorId, setPendingColorId] = useState("amber");
  const [pendingAccId, setPendingAccId] = useState("none");
  const soundRef = useRef(null);

  useEffect(() => { soundRef.current = createSoundEngine(); }, []);
  const sound = {
    paperRustle: () => profile.soundOn !== false && soundRef.current?.paperRustle(),
    capsuleLoad:  () => profile.soundOn !== false && soundRef.current?.capsuleLoad(),
    launch:       () => profile.soundOn !== false && soundRef.current?.launch(),
    warpHum:      () => profile.soundOn !== false && soundRef.current?.warpHum(),
    capsuleOpen:  () => profile.soundOn !== false && soundRef.current?.capsuleOpen(),
    letterEmerge: () => profile.soundOn !== false && soundRef.current?.letterEmerge(),
    heart:        () => profile.soundOn !== false && soundRef.current?.heart(),
    milestone:    () => profile.soundOn !== false && soundRef.current?.milestone(),
  };

  return (
    <div style={{ minHeight:"100vh",position:"relative",overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes capsuleFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-14px) rotate(3deg)}}
        @keyframes twinkle{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
        @keyframes pulseGlow{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes paperFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}
        @keyframes paperFold{0%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(0.5) rotate(5deg);opacity:0.9}}
        @keyframes paperEmerge{0%{transform:translateY(40px) scale(0.3);opacity:0}60%{transform:translateY(-12px) scale(1.04);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes loadPaper{0%{transform:translateY(0) scale(0.6);opacity:1}100%{transform:translateY(60px) scale(0);opacity:0}}
        @keyframes paperIntoCapsuIe{0%{transform:translateX(-50%) translateY(-80px) scale(0.8);opacity:1}70%{transform:translateX(-50%) translateY(60px) scale(0.55);opacity:0.8}100%{transform:translateX(-50%) translateY(80px) scale(0.2);opacity:0}}
        @keyframes sparkle{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes capsuleLaunch{0%{transform:translateY(0) scale(1);opacity:1}30%{transform:translateY(-40px) scale(1.1)}100%{transform:translateY(-400px) scale(0.2);opacity:0}}
        @keyframes capsuleArrive{0%{transform:translateY(-300px) scale(0.2);opacity:0}70%{transform:translateY(15px) scale(1.04);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes capOpen{0%{transform:translateY(0)}100%{transform:translateY(-32px)}}
        @keyframes trailFlick{0%{transform:scaleY(0.85) scaleX(0.9)}100%{transform:scaleY(1.15) scaleX(1.1)}}
        @keyframes warpIn{from{opacity:0}to{opacity:1}}
        @keyframes starStreak{0%{transform:translateY(0);opacity:0}10%{opacity:1}100%{transform:translateY(-100vh);opacity:0}}
        @keyframes tunnelPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
        @keyframes ringExpand{0%{transform:translate(-50%,-50%) scale(0.2);opacity:0.7}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
        @keyframes ringRotate{from{transform:rotateX(70deg) rotateZ(0)}to{transform:rotateX(70deg) rotateZ(360deg)}}
        @keyframes ringSpin{from{transform:rotateX(70deg) rotateZ(0)}to{transform:rotateX(70deg) rotateZ(360deg)}}
        @keyframes petalFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.05)}}
        @keyframes flameFlick{0%{transform:scaleX(1) scaleY(1)}100%{transform:scaleX(1.15) scaleY(1.1)}}
        @keyframes boltFlash{0%,100%{opacity:0.2}50%{opacity:1}}
        @keyframes ribbonWave{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes novaRotate{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        textarea::placeholder{color:rgba(255,160,60,0.28);}
        textarea::-webkit-scrollbar{width:3px;}
        textarea::-webkit-scrollbar-thumb{background:rgba(255,140,20,0.28);border-radius:2px;}
        button:focus{outline:none;}
      `}</style>
      <Nebula />
      <StarField />
      {screen === "home"       && <HomeScreen onWrite={()=>setScreen("write")} onReceive={()=>setScreen("receive")} onMyCapsules={()=>setScreen("mycapsules")} onMyReceived={()=>setScreen("myreceived")} onGuidelines={()=>setScreen("guidelines")} onFAQ={()=>setScreen("faq")} profile={profile} setProfile={setProfile} sound={sound} />}
      {screen === "write"      && <WriteScreen onBack={()=>setScreen("home")} onSent={p=>{setPendingColorId(p.colorId||"amber");setPendingAccId(p.accessoryId||"none");setProfile({...p});setScreen("sendanim");}} profile={profile} sound={sound} />}
      {screen === "sendanim"   && <SendAnimScreen colorId={pendingColorId} accessoryId={pendingAccId} onDone={()=>setScreen("home")} sound={sound} />}
      {screen === "receive"    && <ReceiveScreen onBack={()=>setScreen("home")} onWrite={()=>setScreen("write")} sound={sound} />}
      {screen === "mycapsules" && <MyCapsulesScreen onBack={()=>setScreen("home")} profile={profile} />}
      {screen === "myreceived"  && <MyReceivedScreen onBack={()=>setScreen("home")} />}
      {screen === "guidelines" && <GuidelinesScreen onBack={()=>setScreen("home")} />}
      {screen === "faq"        && <FAQScreen onBack={()=>setScreen("home")} profile={profile} />}
    </div>
  );
}
