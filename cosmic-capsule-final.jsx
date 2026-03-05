import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────
const SUPABASE_URL = "https://mexfvhokidhrbpqxwubq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZ2aG9raWRocmJwcXh3dWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjI3OTIsImV4cCI6MjA4ODIzODc5Mn0.LeOEQhkPOsk_l5sOp6h_GrjPeZPbbIEbQR8obKRM9HA";
const MAX_DAILY = 3;
const MILESTONES = [10, 25, 50, 100, 250, 500];

const RANKS = [
  { name: "Stardust",      min: 0,   icon: "✨", color: "#aaa" },
  { name: "Comet",         min: 3,   icon: "☄️", color: "#88ccff" },
  { name: "Nebula",        min: 8,   icon: "🌌", color: "#cc88ff" },
  { name: "Supernova",     min: 20,  icon: "💥", color: "#ffcc00" },
  { name: "Cosmic Legend", min: 50,  icon: "🌟", color: "#ff8c00" },
];

const THEMES = [
  { id: "open",      label: "✨ Open Heart",          prompt: "Write a warm, open-hearted letter to a stranger." },
  { id: "hope",      label: "🌅 Hope",                prompt: "Write about hope — for tomorrow, for dreams, for new beginnings." },
  { id: "courage",   label: "🦁 Courage",             prompt: "Encourage a stranger who might be facing something hard." },
  { id: "gratitude", label: "🌸 Gratitude",           prompt: "Share something you're grateful for and why it matters." },
  { id: "stardust",  label: "🌠 Made of Stars",       prompt: "Remind a stranger of their cosmic worth and infinite potential." },
  { id: "healing",   label: "🕊️ Healing",             prompt: "Send gentle words to someone who might be healing right now." },
];

const COLORS = [
  { id: "amber", name: "Cosmic Capsule", free: true, c1: "#ffb830", c2: "#cc4400", glow: "rgba(255,140,20,0.9)" },
];

const ACCESSORIES = [
  { id: "none", name: "None", free: true, icon: "—" },
];

const FALLBACK_LETTERS = [
  { message: "To whoever intercepts this signal — you are brighter than any star I've mapped. The universe is vast, but somehow you found your place in it. Keep shining, traveler. 🌟", color_id: "amber", accessory_id: "none", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { message: "Dear cosmic stranger, somewhere across this infinite darkness, I hope you feel warmth today. You are not alone out here. We're all drifting together. 💛", color_id: "violet", accessory_id: "stars", created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { message: "To the soul receiving this transmission: whatever weight you're carrying, even black holes eventually release what they hold. Your moment of light is coming. ✨", color_id: "ocean", accessory_id: "ring", created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
];

// ── Sound Engine ─────────────────────────────────────────────────
function createSoundEngine() {
  let ctx = null;
  const getCtx = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; };

  const play = (fn) => { try { fn(getCtx()); } catch(e) {} };

  return {
    paperRustle: () => play(ctx => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.3;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass"; filter.frequency.value = 3000;
      src.buffer = buf; src.connect(filter); filter.connect(ctx.destination);
      src.start();
    }),
    capsuleLoad: () => play(ctx => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    }),
    launch: () => play(ctx => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 800;
      o.connect(filter); filter.connect(g); g.connect(ctx.destination);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(80, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.2);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      o.start(); o.stop(ctx.currentTime + 1.5);
      // Whoosh
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5) * 0.4;
      const src = ctx.createBufferSource();
      const f2 = ctx.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 1200; f2.Q.value = 0.5;
      src.buffer = buf; src.connect(f2); f2.connect(ctx.destination); src.start();
    }),
    warpHum: () => play(ctx => {
      [55, 110, 165].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 5);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 6.5);
        o.start(); o.stop(ctx.currentTime + 6.5);
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
function getProfile() {
  return window._cp || {
    sent: 0, isPremium: true, letters: [],
    dailyCount: 0, lastDay: "", streak: 0,
    lastStreakDay: "", colorId: "amber", accessoryId: "none",
    soundOn: true,
  };
}
function saveProfile(p) { window._cp = p; }
function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function getDailyRemaining() {
  const p = getProfile(); const today = getTodayStr();
  if (p.lastDay !== today) return MAX_DAILY;
  return Math.max(0, MAX_DAILY - (p.dailyCount || 0));
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

// ── API helpers ──────────────────────────────────────────────────
async function moderateLetter(message) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000,
      messages: [{ role: "user", content: `You are a content moderator for Cosmic Capsule, a positive anonymous letter app.
REJECT if: profanity, violence, threats, hate speech, bullying, sexual content, self-harm, negativity, insults, personal info (emails, phones, social handles, URLs), spam, or promotion.
APPROVE only if genuinely kind, warm, uplifting, or positive.
Respond ONLY with valid JSON:
{"approved": true, "reason": "..."} or {"approved": false, "reason": "..."}
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
Rules: 3-5 sentences, heartfelt, genuine, no names/personal info/handles, poetic but real, end with a fitting emoji.
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

async function fetchRandomLetter(excludeIds = []) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/letters?select=id,message,color_id,accessory_id,created_at`, {
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const all = await r.json();
  if (!Array.isArray(all) || all.length === 0) return FALLBACK_LETTERS[Math.floor(Math.random() * FALLBACK_LETTERS.length)];
  const filtered = all.filter(l => !excludeIds.includes(l.id));
  const pool = filtered.length > 0 ? filtered : all;
  return pool[Math.floor(Math.random() * pool.length)];
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
  return <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(180,80,0,0.22) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(200,120,0,0.18) 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, rgba(150,50,10,0.18) 0%, transparent 50%), #0a0500" }} />;
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
  const gid = `cg${colorId}`; const sid = `cs${colorId}`;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 120 156" style={{ overflow: "visible", filter: glowing ? `drop-shadow(0 0 18px ${glow}) drop-shadow(0 0 40px ${glow}66)` : `drop-shadow(0 4px 16px rgba(0,0,0,0.5))` }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient>
        <radialGradient id={sid} cx="30%" cy="25%" r="55%"><stop offset="0%" stopColor="white" stopOpacity="0.4" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient>
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
        <ellipse cx="60" cy="60" rx="12" ry="14" fill="rgba(200,240,255,0.7)" />
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
function Paper({ folded, emerging }) {
  return (
    <div style={{ animation: emerging ? "paperEmerge 1s ease forwards" : folded ? "paperFold 1s ease forwards" : "paperFloat 3s ease-in-out infinite" }}>
      <svg width={folded ? 55 : 100} height={folded ? 55 : 130} viewBox="0 0 110 140" style={{ transition: "all 0.8s ease", filter: "drop-shadow(0 4px 20px rgba(255,200,100,0.3))" }}>
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fff9e6"/><stop offset="100%" stopColor="#ffeebb"/></linearGradient>
        </defs>
        {!folded ? (<>
          <rect x="5" y="5" width="100" height="130" rx="4" fill="url(#pg)" />
          <polygon points="80,5 105,5 105,30" fill="#ffe088" opacity="0.8" />
          <polygon points="80,5 105,30 80,30" fill="#ffd060" opacity="0.5" />
          {[35,50,65,80,95,110].map((y,i) => <line key={i} x1="18" y1={y} x2={i===3||i===5?70:92} y2={y} stroke="rgba(180,140,60,0.35)" strokeWidth="1.5" strokeLinecap="round" />)}
          <path d="M48,20 C48,17 51,14 55,17 C59,14 62,17 62,20 C62,24 55,29 55,29Z" fill="rgba(255,120,120,0.5)" />
        </>) : (<>
          <polygon points="55,5 105,55 55,105 5,55" fill="url(#pg)" />
          <polygon points="55,5 105,55 55,55" fill="#ffe088" opacity="0.6" />
          <polygon points="55,5 5,55 55,55" fill="#fff3cc" opacity="0.4" />
          <line x1="55" y1="5" x2="55" y2="105" stroke="rgba(180,140,60,0.2)" strokeWidth="1" />
          <line x1="5" y1="55" x2="105" y2="55" stroke="rgba(180,140,60,0.2)" strokeWidth="1" />
          <path d="M46,52 C46,49 50,47 55,49 C60,47 64,49 64,52 C64,56 55,60 55,60Z" fill="rgba(255,120,120,0.4)" />
        </>)}
      </svg>
    </div>
  );
}

// ── Warp Screen ──────────────────────────────────────────────────
function WarpScreen({ progress }) {
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
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 2 }}>
        <div style={{ fontSize: "2.2rem", marginBottom: 14, animation: "capsuleFloat 2s ease-in-out infinite", filter: "drop-shadow(0 0 20px rgba(255,160,40,0.9))" }}>🛸</div>
        <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,220,140,0.9)", fontSize: "1.05rem", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(255,160,40,0.8)", animation: "pulseGlow 1.5s ease-in-out infinite" }}>Traveling through the cosmos…</p>
        <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(180,140,255,0.55)", fontSize: "0.82rem", marginTop: 6 }}>your kindness is on its way</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < progress ? "#ffa520" : "rgba(255,140,20,0.2)", boxShadow: i < progress ? "0 0 10px rgba(255,140,20,0.8)" : "none", transition: "all 0.4s ease" }} />
          ))}
        </div>
        <p style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.35)", fontSize: "0.72rem", marginTop: 8, fontStyle: "italic" }}>{6 - progress} light-years remaining</p>
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
function GuidelinesScreen({ onBack }) {
  const rules = [
    ["💛","Only kindness","Every letter must be warm, positive, and uplifting. No negativity, no sarcasm."],
    ["🚫","No personal info","Never include names, phone numbers, emails, addresses, or social media handles."],
    ["🕊️","No hate","Zero tolerance for hate speech, discrimination, or content targeting any group."],
    ["🌱","No promotion","This is not a place for marketing, advertising, or self-promotion of any kind."],
    ["🛡️","No harm","Content that could cause distress, encourage self-harm, or threaten others is strictly forbidden."],
    ["🤝","Be real","Write like a human. Spam, repetitive content, and AI-only letters without heart are discouraged."],
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
function HomeScreen({ onWrite, onReceive, onMyCapsules, onGuidelines, profile, setProfile, sound }) {
  
  const [showTip, setShowTip] = useState(false);
  const [count, setCount] = useState(null);
  const rank = getRank(profile.sent || 0);
  const remaining = getDailyRemaining();

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

      {/* Daily remaining dots */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 24 }}>
        {[...Array(MAX_DAILY)].map((_,i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < remaining ? "#ffa520" : "rgba(255,140,20,0.18)", boxShadow: i < remaining ? "0 0 8px rgba(255,140,20,0.6)" : "none", transition: "all 0.3s" }} />
        ))}
        <span style={{ fontFamily: "'Georgia',serif", color: "rgba(255,160,60,0.4)", fontSize: "0.72rem", marginLeft: 6 }}>
          {remaining > 0 ? `${remaining} letters left today` : <><CountdownTimer /> until tomorrow</>}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <Btn onClick={onWrite} disabled={remaining === 0}>✍️ Write a Message</Btn>
        <Btn onClick={onReceive} secondary>🛸 Receive a Transmission</Btn>
        <Btn onClick={onMyCapsules} secondary>📡 My Capsules</Btn>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={shareRank} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>📸 Share my rank</button>
        <button onClick={shareApp} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>🔗 Share the app</button>
        
        <button onClick={() => setShowTip(true)} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>☕ Support the cosmos</button>
        <button onClick={onGuidelines} style={{ background: "none", border: "none", color: "rgba(255,160,60,0.38)", fontFamily: "'Georgia',serif", fontSize: "0.75rem", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e=>e.target.style.color="rgba(255,160,60,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.38)"}>📋 Community guidelines</button>
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
  
  const isPremium = true;
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const remaining = getDailyRemaining();
  const maxLen = 500;

  const col = COLORS.find(c => c.id === colorId) || COLORS[0];

  const handleGetInspired = async () => {
    setStatus("generating");
    try { const p = await generatePrompt(theme); setAiPrompt(p); } catch { setAiPrompt(theme.prompt); }
    setStatus("idle");
  };

  const handleAIWrite = async () => {
    setStatus("generating");
    try { const l = await generateLetter(theme); setText(l.slice(0, maxLen)); } catch { setStatus("error"); return; }
    setStatus("idle");
  };

  const handleSend = async () => {
    setStatus("checking");
    try {
      const result = await moderateLetter(text.trim());
      if (result.approved) {
        const letterId = await submitLetter(text.trim(), colorId, accessoryId, theme.id);
        const updated = recordSent(letterId, text.trim(), colorId, accessoryId, theme.id);
        // Milestone check
        const hit = MILESTONES.find(m => m === updated.sent);
        if (hit) { setMilestone(hit); setShowConfetti(true); sound.milestone(); setTimeout(() => setShowConfetti(false), 4000); }
        onSent(updated);
        setStatus("approved");
      } else {
        setRejectReason(result.reason || "Your message doesn't meet our positivity guidelines.");
        setStatus("rejected");
      }
    } catch { setStatus("error"); }
  };

  const currentRank = getRank(profile.sent || 0);
  const newRank = getRank((profile.sent || 0) + 1);
  const rankUp = status === "approved" && newRank.name !== currentRank.name;

  // Mode selection
  if (!writeMode) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "30px 20px", animation: "fadeUp 0.8s ease forwards", zIndex: 1, position: "relative" }}>
      <p style={{ fontFamily: "'Georgia',serif", fontSize: "0.72rem", letterSpacing: "0.3em", color: "rgba(255,160,60,0.5)", textTransform: "uppercase", marginBottom: 10 }}>New Transmission</p>
      <h2 style={{ fontFamily: "'Georgia',serif", fontWeight: 400, fontSize: "1.8rem", color: "#ffd080", marginBottom: 8, textAlign: "center" }}>How would you like to write? ✨</h2>
      <p style={{ fontFamily: "'Georgia',serif", fontStyle: "italic", color: "rgba(255,200,100,0.4)", fontSize: "0.88rem", marginBottom: 36, textAlign: "center", maxWidth: 340 }}>Choose how you want to craft your letter.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 440 }}>
        {[
          ["✍️","Write it yourself","idle","A blank page, your heart, and the cosmos.","rgba(255,140,20,0.06)","rgba(255,140,20,0.25)","#ffd080"],
          ["💡","Get inspired","inspired","AI sparks a prompt — you write every word.","rgba(100,180,255,0.05)","rgba(100,180,255,0.2)","#88ccff"],
          ["🤖","Let AI write for me","ai","AI crafts the letter. Edit it or send as is.","rgba(180,100,255,0.05)","rgba(180,100,255,0.2)","#cc88ff"],
        ].map(([icon,title,mode,desc,bg,border,color])=>(
          <div key={mode} onClick={()=>{ setWriteMode(mode); if(mode==="inspired") handleGetInspired(); if(mode==="ai") handleAIWrite(); }}
            style={{ cursor:"pointer", background:bg, border:`1.5px solid ${border}`, borderRadius:18, padding:"20px 24px", display:"flex", gap:16, alignItems:"flex-start", transition:"all 0.25s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.3)`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{ fontSize:"1.8rem",lineHeight:1 }}>{icon}</div>
            <div>
              <div style={{ fontFamily:"'Georgia',serif", color, fontSize:"1rem", fontWeight:700, marginBottom:4 }}>{title}</div>
              <div style={{ fontFamily:"'Georgia',serif", fontStyle:"italic", color:"rgba(255,200,100,0.4)", fontSize:"0.82rem", lineHeight:1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onBack} style={{ background:"none",border:"none",color:"rgba(255,160,60,0.35)",fontFamily:"'Georgia',serif",fontSize:"0.85rem",cursor:"pointer",marginTop:28 }}>← Back</button>
    </div>
  );

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
          <div style={{ fontSize:55,animation:"capsuleFloat 2s ease-in-out infinite" }}>🛸</div>
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
      <div style={{ width:"100%",maxWidth:500,background:`rgba(${colorId==="frost"?"200,220,255":"255,140,20"},0.06)`,border:`1.5px solid ${col.glow.replace("0.9","0.3")}`,borderRadius:20,padding:"26px 30px",boxShadow:`0 0 40px ${col.glow.replace("0.9","0.12")}`,marginBottom:14,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${col.glow.replace("0.9","0.15")},transparent 70%)` }} />
        <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.98rem",lineHeight:1.85,color:"rgba(255,220,140,0.9)",margin:0,whiteSpace:"pre-wrap",position:"relative",zIndex:1 }}>{text}</p>
      </div>
      <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.28)",fontSize:"0.72rem",marginBottom:26,textAlign:"center" }}>Sent anonymously · {theme.label}</p>
      <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center" }}>
        <Btn onClick={()=>setStatus("idle")} secondary>✏️ Edit</Btn>
        <Btn onClick={handleSend}>Launch Capsule 🛸</Btn>
      </div>
    </div>
  );

  // Write form
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"30px 20px",animation:"fadeUp 0.8s ease forwards",zIndex:1,position:"relative" }}>
      
      {(status==="checking"||status==="generating") && (
        <div style={{ position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(10,5,0,0.92)",flexDirection:"column",gap:18 }}>
          <div style={{ fontSize:55,animation:"capsuleFloat 2s ease-in-out infinite" }}>{status==="generating"?writeMode==="inspired"?"💡":"🤖":"🛸"}</div>
          <p style={{ fontFamily:"'Georgia',serif",color:"#ffd080",fontSize:"1.05rem" }}>{status==="generating"?writeMode==="inspired"?"Finding your spark…":"Crafting your letter…":"Preparing your transmission…"}</p>
          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.45)",fontSize:"0.82rem" }}>{status==="generating"?"Consulting the stars":"Checking it's ready for the cosmos"}</p>
          <div style={{ display:"flex",gap:10 }}>{[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#ffa520",animation:"pulseGlow 1.2s ease-in-out infinite",animationDelay:`${i*0.3}s` }}/>)}</div>
        </div>
      )}

      <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.72rem",letterSpacing:"0.3em",color:"rgba(255,160,60,0.5)",textTransform:"uppercase",marginBottom:8 }}>New Transmission</p>
      <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.7rem",color:"#ffd080",marginBottom:18,textAlign:"center" }}>Write your message</h2>

      {/* Theme picker */}
      <div style={{ width:"100%",maxWidth:520,marginBottom:14 }}>
        <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.5)",fontSize:"0.68rem",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8 }}>Theme</p>
        <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
          {THEMES.map(t=>(
            <button key={t.id} onClick={()=>setTheme(t)} style={{ padding:"6px 12px",borderRadius:20,border:`1px solid ${theme.id===t.id?"rgba(255,180,60,0.8)":"rgba(255,140,20,0.18)"}`,background:theme.id===t.id?"rgba(255,140,20,0.18)":"transparent",color:theme.id===t.id?"#ffd080":"rgba(255,180,60,0.5)",fontFamily:"'Georgia',serif",fontSize:"0.75rem",cursor:"pointer" }}>{t.label}</button>
          ))}
        </div>
        {(writeMode==="inspired"&&aiPrompt) && <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(150,210,255,0.7)",fontSize:"0.82rem",marginTop:8,lineHeight:1.5 }}>💡 {aiPrompt} <button onClick={handleGetInspired} style={{ background:"none",border:"none",color:"rgba(100,180,255,0.5)",fontFamily:"'Georgia',serif",fontSize:"0.72rem",cursor:"pointer" }}>↻</button></p>}
        {(writeMode==="ai"&&text) && <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(200,150,255,0.6)",fontSize:"0.78rem",marginTop:8 }}>🤖 AI wrote this — feel free to edit <button onClick={handleAIWrite} style={{ background:"none",border:"none",color:"rgba(180,100,255,0.5)",fontFamily:"'Georgia',serif",fontSize:"0.72rem",cursor:"pointer" }}>↻</button></p>}
      </div>
      </div>

      {/* Textarea */}
      <div style={{ width:"100%",maxWidth:520,background:"rgba(255,140,20,0.05)",border:`1.5px solid ${status==="rejected"?"rgba(255,80,60,0.5)":"rgba(255,140,20,0.22)"}`,borderRadius:16,padding:"4px" }}>
        <textarea value={text} onChange={e=>{setText(e.target.value.slice(0,maxLen));if(status==="rejected")setStatus("idle");}}
          placeholder={writeMode==="inspired"&&aiPrompt?aiPrompt:"Dear stranger across the stars…"} rows={6}
          style={{ width:"100%",background:"transparent",border:"none",outline:"none",resize:"none",color:"rgba(255,220,140,0.9)",padding:"16px 18px",fontFamily:"'Georgia',serif",fontSize:"0.98rem",lineHeight:1.7,caretColor:"#ffa520",boxSizing:"border-box" }} />
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
function ReceiveScreen({ onBack, sound }) {
  const [animStage, setAnimStage] = useState("arriving"); // arriving | opening | reading
  const [letterData, setLetterData] = useState(null);
  const [hearted, setHearted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [warpProgress, setWarpProgress] = useState(0);

  const loadLetter = useCallback(async () => {
    setAnimStage("arriving"); setHearted(false); setLetterData(null);
    try {
      const data = await fetchRandomLetter(getSentIds());
      setTimeout(() => { setLetterData(data); sound.capsuleOpen(); setAnimStage("opening"); }, 2000);
      setTimeout(() => { sound.letterEmerge(); setAnimStage("reading"); }, 3800);
    } catch {
      setTimeout(() => { setLetterData(FALLBACK_LETTERS[0]); setAnimStage("opening"); }, 2000);
      setTimeout(() => { setAnimStage("reading"); }, 3800);
    }
  }, []);

  useEffect(() => { loadLetter(); }, []);

  const handleHeart = async () => {
    if (hearted || !letterData?.id) return;
    setHearted(true); sound.heart();
    try { await incrementHeart(letterData.id); } catch {}
  };

  const days = letterData ? daysFloating(letterData.created_at) : 0;
  const col = letterData ? (COLORS.find(c => c.id === letterData.color_id) || COLORS[0]) : COLORS[0];

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"30px 20px",zIndex:1,position:"relative" }}>
      {showReport && letterData?.id && <ReportModal letterId={letterData.id} onClose={()=>setShowReport(false)} />}

      {animStage==="arriving" && (
        <div style={{ animation:"capsuleArrive 2s cubic-bezier(0.2,0.8,0.3,1) forwards",textAlign:"center" }}>
          <div style={{ position:"relative",display:"inline-block" }}>
            <CapsuleSVG colorId={letterData?.color_id||"amber"} size={110} glowing />
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <AccLayer accessoryId={letterData?.accessory_id||"none"} colorId={letterData?.color_id||"amber"} size={110} />
            </div>
          </div>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.5)",fontSize:"0.85rem",marginTop:20,fontStyle:"italic" }}>A capsule is approaching…</p>
        </div>
      )}

      {animStage==="opening" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ position:"relative",display:"inline-block" }}>
            <CapsuleSVG colorId={letterData?.color_id||"amber"} size={110} glowing open />
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <AccLayer accessoryId={letterData?.accessory_id||"none"} colorId={letterData?.color_id||"amber"} size={110} />
            </div>
          </div>
          <div style={{ position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle, ${col.glow.replace("0.9","0.5")}, transparent 70%)`,animation:"pulseGlow 0.8s ease-in-out infinite" }} />
        </div>
      )}

      {animStage==="reading" && letterData && (
        <div style={{ animation:"fadeUp 1s ease forwards",width:"100%",maxWidth:540 }}>
          <p style={{ fontFamily:"'Georgia',serif",fontSize:"0.7rem",letterSpacing:"0.3em",color:"rgba(255,160,60,0.45)",textTransform:"uppercase",marginBottom:10,textAlign:"center" }}>Transmission Received</p>
          <h2 style={{ fontFamily:"'Georgia',serif",fontWeight:400,fontSize:"1.5rem",color:"#ffd080",marginBottom:8,textAlign:"center" }}>A message found you 🌠</h2>
          {days > 0 && <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.35)",fontSize:"0.76rem",textAlign:"center",marginBottom:18 }}>This capsule has been floating for {days} {days===1?"day":"days"} 🛸</p>}

          <div style={{ animation:"capsuleFloat 4s ease-in-out infinite",marginBottom:14,position:"relative",textAlign:"center" }}>
            <div style={{ display:"inline-block",position:"relative" }}>
              <CapsuleSVG colorId={letterData.color_id||"amber"} size={70} glowing open />
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}><AccLayer accessoryId={letterData.accessory_id||"none"} colorId={letterData.color_id||"amber"} size={70} /></div>
            </div>
          </div>

          {/* Paper emerging */}
          <div style={{ animation:"paperEmerge 1s ease forwards",marginBottom:16 }}>
            <div style={{ background:`rgba(${col.id==="frost"?"200,220,255":"255,140,20"},0.06)`,border:`1.5px solid ${col.glow.replace("0.9","0.28")}`,borderRadius:20,padding:"26px 30px",boxShadow:`0 0 40px ${col.glow.replace("0.9","0.1")},0 20px 60px rgba(0,0,0,0.4)`,position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${col.glow.replace("0.9","0.15")},transparent 70%)` }} />
              <p style={{ fontFamily:"'Georgia',serif",fontSize:"1rem",lineHeight:1.85,color:"rgba(255,220,140,0.92)",margin:0,whiteSpace:"pre-wrap",position:"relative",zIndex:1 }}>{letterData.message}</p>
            </div>
          </div>

          {/* Heart + Report */}
          <div style={{ display:"flex",gap:12,justifyContent:"center",marginBottom:8,flexWrap:"wrap" }}>
            <button onClick={handleHeart} disabled={hearted||!letterData.id}
              style={{ background:hearted?"rgba(255,100,100,0.18)":"rgba(255,100,100,0.07)",border:`1px solid ${hearted?"rgba(255,100,100,0.45)":"rgba(255,100,100,0.18)"}`,borderRadius:30,padding:"10px 22px",cursor:hearted?"default":"pointer",display:"inline-flex",alignItems:"center",gap:8,transition:"all 0.3s" }}>
              <span style={{ fontSize:"1rem" }}>{hearted?"❤️":"🤍"}</span>
              <span style={{ fontFamily:"'Georgia',serif",color:hearted?"rgba(255,160,140,0.9)":"rgba(255,160,120,0.5)",fontSize:"0.82rem" }}>This touched my heart</span>
            </button>
            <button onClick={()=>setShowReport(true)} style={{ background:"none",border:"1px solid rgba(255,255,255,0.06)",borderRadius:30,padding:"10px 16px",cursor:"pointer",color:"rgba(255,160,60,0.3)",fontFamily:"'Georgia',serif",fontSize:"0.78rem" }} onMouseEnter={e=>e.target.style.color="rgba(255,80,60,0.6)"} onMouseLeave={e=>e.target.style.color="rgba(255,160,60,0.3)"}>🚩 Report</button>
          </div>
          {hearted && <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.32)",fontSize:"0.72rem",textAlign:"center",marginBottom:16 }}>The sender will silently feel this. 💛</p>}

          <p style={{ fontFamily:"'Georgia',serif",fontStyle:"italic",color:"rgba(255,160,60,0.25)",fontSize:"0.72rem",textAlign:"center",marginBottom:26 }}>Sent anonymously from somewhere in the universe.</p>
          <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
            <Btn onClick={onBack} secondary>← Return to Base</Btn>
            <Btn onClick={loadLetter}>Another Signal ✨</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Send Animation Screen ────────────────────────────────────────
function SendAnimScreen({ colorId, accessoryId, onDone, sound }) {
  const [stage, setStage] = useState("folding");
  const [warpProg, setWarpProg] = useState(0);

  useEffect(() => {
    sound.paperRustle();
    const t1 = setTimeout(() => { setStage("loading"); sound.capsuleLoad(); }, 1400);
    const t2 = setTimeout(() => { setStage("launching"); sound.launch(); }, 2800);
    const t3 = setTimeout(() => { setStage("warping"); sound.warpHum(); }, 4000);
    // Warp progress dots
    let prog = 0;
    const progInt = setInterval(() => { prog++; setWarpProg(prog); if (prog >= 6) clearInterval(progInt); }, 1000);
    const t4 = setTimeout(() => { setStage("done"); onDone(); }, 10200);
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); clearInterval(progInt); };
  }, []);

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",position:"relative",zIndex:1,textAlign:"center",padding:20 }}>
      {stage==="warping" && <WarpScreen progress={warpProg} />}

      {stage==="folding" && (
        <div style={{ animation:"fadeUp 0.4s ease forwards" }}>
          <Paper folded={false} />
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.5)",fontSize:"0.88rem",marginTop:20,fontStyle:"italic" }}>Folding your letter…</p>
        </div>
      )}
      {stage==="loading" && (
        <div style={{ position:"relative",display:"flex",flexDirection:"column",alignItems:"center" }}>
          <div style={{ animation:"loadPaper 1.2s ease forwards",position:"absolute",top:-30,zIndex:2 }}>
            <Paper folded={true} />
          </div>
          <div style={{ marginTop:60,animation:"capsuleFloat 3s ease-in-out infinite",position:"relative" }}>
            <CapsuleSVG colorId={colorId} size={100} glowing />
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}><AccLayer accessoryId={accessoryId} colorId={colorId} size={100} /></div>
          </div>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.5)",fontSize:"0.88rem",marginTop:16,fontStyle:"italic" }}>Sealing your capsule…</p>
        </div>
      )}
      {stage==="launching" && (
        <div style={{ position:"relative",display:"flex",flexDirection:"column",alignItems:"center" }}>
          <div style={{ position:"absolute",bottom:30,left:"50%",transform:"translateX(-50%)",width:14,height:90,background:"linear-gradient(to bottom, rgba(255,160,40,0.9), transparent)",borderRadius:"0 0 50% 50%",animation:"trailFlick 0.5s ease-in-out infinite" }} />
          <div style={{ animation:"capsuleLaunch 1.4s ease-in forwards",position:"relative" }}>
            <CapsuleSVG colorId={colorId} size={100} glowing />
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}><AccLayer accessoryId={accessoryId} colorId={colorId} size={100} /></div>
          </div>
          <p style={{ fontFamily:"'Georgia',serif",color:"rgba(255,160,60,0.5)",fontSize:"0.88rem",marginTop:16,fontStyle:"italic" }}>Launching! 🚀</p>
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
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes capsuleFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-14px) rotate(3deg)}}
        @keyframes twinkle{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
        @keyframes pulseGlow{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes paperFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}
        @keyframes paperFold{0%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(0.5) rotate(5deg);opacity:0.9}}
        @keyframes paperEmerge{0%{transform:translateY(40px) scale(0.3);opacity:0}60%{transform:translateY(-12px) scale(1.04);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes loadPaper{0%{transform:translateY(0) scale(0.6);opacity:1}100%{transform:translateY(60px) scale(0);opacity:0}}
        @keyframes capsuleLaunch{0%{transform:translateY(0) scale(1);opacity:1}30%{transform:translateY(-40px) scale(1.1)}100%{transform:translateY(-400px) scale(0.2);opacity:0}}
        @keyframes capsuleArrive{0%{transform:translateY(-300px) scale(0.2);opacity:0}70%{transform:translateY(15px) scale(1.04);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes capOpen{0%{transform:translateY(0)}100%{transform:translateY(-32px)}}
        @keyframes trailFlick{0%{transform:translateX(-50%) scaleY(0.8) scaleX(1)}100%{transform:translateX(-50%) scaleY(1.2) scaleX(1.2)}}
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
        textarea::placeholder{color:rgba(255,160,60,0.28);}
        textarea::-webkit-scrollbar{width:3px;}
        textarea::-webkit-scrollbar-thumb{background:rgba(255,140,20,0.28);border-radius:2px;}
        button:focus{outline:none;}
      `}</style>
      <Nebula />
      <StarField />
      {screen === "home"       && <HomeScreen onWrite={()=>setScreen("write")} onReceive={()=>setScreen("receive")} onMyCapsules={()=>setScreen("mycapsules")} onGuidelines={()=>setScreen("guidelines")} profile={profile} setProfile={setProfile} sound={sound} />}
      {screen === "write"      && <WriteScreen onBack={()=>setScreen("home")} onSent={p=>{setPendingColorId(p.colorId||"amber");setPendingAccId(p.accessoryId||"none");setProfile({...p});setScreen("sendanim");}} profile={profile} sound={sound} />}
      {screen === "sendanim"   && <SendAnimScreen colorId={pendingColorId} accessoryId={pendingAccId} onDone={()=>setScreen("home")} sound={sound} />}
      {screen === "receive"    && <ReceiveScreen onBack={()=>setScreen("home")} sound={sound} />}
      {screen === "mycapsules" && <MyCapsulesScreen onBack={()=>setScreen("home")} profile={profile} />}
      {screen === "guidelines" && <GuidelinesScreen onBack={()=>setScreen("home")} />}
    </div>
  );
}
