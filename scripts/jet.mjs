#!/usr/bin/env node
/**
 * Katkı takvimimin üzerinde uçan, en yoğun günleri vuran animasyonlu SVG üretir.
 * Bağımlılığı yok, Node 18+ ile çalışır.
 *
 * Ortam değişkenleri:
 *   GH_USERNAME  GitHub kullanıcı adı (zorunlu)
 *   GH_TOKEN     GraphQL erişimi olan token (Actions içinde GITHUB_TOKEN yeter)
 *   OUT_DIR      çıktı klasörü (varsayılan: dist)
 *   GH_DEMO=1    token olmadan sahte veriyle önizleme üretir
 */

import fs from "node:fs";
import path from "node:path";

const USER = process.env.GH_USERNAME;
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const OUT_DIR = process.env.OUT_DIR || "dist";
const DEMO = process.env.GH_DEMO === "1";

// ---------------------------------------------------------------- ölçüler
const COLS = 53;
const ROWS = 7;
const CELL = 12;
const STEP = 15;
const GRID_X = 40;
const GRID_Y = 34;
const GRID_W = COLS * STEP - (STEP - CELL);
const GRID_H = ROWS * STEP - (STEP - CELL);
const W = GRID_X + GRID_W + 28;
const H = 224;
const JET_Y = 186;          // uçuş şeridi, grafiğin altı
const LOOP = 24;            // saniye, gidiş + dönüş
const SHOTS = 14;           // kaç günü vuruyor

// Gidiş 0.03 → 0.43, dönüş 0.57 → 0.97 aralığında
const FWD_A = 0.03, FWD_B = 0.43, BCK_A = 0.57, BCK_B = 0.97;

const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const GUN = { 1: "Pzt", 3: "Çar", 5: "Cum" };

const THEMES = {
  dark: {
    bg0: "#04191C", bg1: "#01090B",
    levels: ["#0C272B", "#12474C", "#1C7A78", "#2A9D8F", "#83C5BE"],
    label: "#4E8B88", title: "#83C5BE",
    body: "#E76F51", body2: "#C75434", wing: "#F4A261", canopy: "#FFE8DF",
    flame: "#FFD9A0", trail: "#E76F51", tracer: "#F4A261",
    blast: "#F4A261", flash: "#FFE8C2", star: "#83C5BE", stroke: "#0F4B52",
  },
  light: {
    bg0: "#FFFFFF", bg1: "#F1F8F7",
    levels: ["#E4EFEE", "#BFE3DF", "#83C5BE", "#2A9D8F", "#006D77"],
    label: "#6C9C98", title: "#00575F",
    body: "#E76F51", body2: "#B2492D", wing: "#F4A261", canopy: "#FFF3EE",
    flame: "#F4A261", trail: "#E76F51", tracer: "#C75434",
    blast: "#C75434", flash: "#F4A261", star: "#2A9D8F", stroke: "#BFE0DC",
  },
};

const f = (n) => Number(n.toFixed(3));
const colX = (c) => GRID_X + c * STEP + CELL / 2;
const rowY = (r) => GRID_Y + r * STEP + CELL / 2;

// ---------------------------------------------------------------- veri
const QUERY = `query($login:String!){
  user(login:$login){
    contributionsCollection{
      contributionCalendar{
        totalContributions
        weeks{ firstDay contributionDays{ date weekday contributionCount } }
      }
    }
  }
}`;

async function fetchCalendar() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user.contributionsCollection.contributionCalendar;
}

function demoCalendar() {
  const weeks = [];
  const start = new Date();
  start.setDate(start.getDate() - COLS * 7);
  let total = 0;
  for (let c = 0; c < COLS; c++) {
    const days = [];
    for (let r = 0; r < ROWS; r++) {
      const d = new Date(start);
      d.setDate(d.getDate() + c * 7 + r);
      const burst = Math.sin(c / 4) * 0.5 + 0.5;
      const n = (r === 0 || r === 6) ? Math.round(Math.random() * 2 * burst)
                                     : Math.round(Math.random() * 11 * burst);
      total += n;
      days.push({ date: d.toISOString().slice(0, 10), weekday: r, contributionCount: n });
    }
    weeks.push({ firstDay: days[0].date, contributionDays: days });
  }
  return { totalContributions: total, weeks };
}

/** Takvimi COLS x ROWS hücreye çevirir, eksik haftaları soldan boş doldurur. */
function toCells(cal) {
  const recent = cal.weeks.slice(-COLS);
  const pad = COLS - recent.length;
  const cells = [];
  let max = 1;
  for (const w of recent) for (const d of w.contributionDays) max = Math.max(max, d.contributionCount);

  const months = [];
  recent.forEach((week, i) => {
    const col = pad + i;
    const first = new Date(week.firstDay);
    if (first.getDate() <= 7) months.push({ col, label: AY[first.getMonth()] });
    for (const d of week.contributionDays) {
      const n = d.contributionCount;
      const ratio = n / max;
      const level = n === 0 ? 0 : ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      cells.push({ col, row: d.weekday, count: n, level, date: d.date });
    }
  });
  return { cells, months, max };
}

/** Sütun başına en fazla bir hedef; en yoğun günler seçilir. */
function pickTargets(cells) {
  const byCol = new Map();
  for (const c of cells) {
    if (c.count === 0) continue;
    const cur = byCol.get(c.col);
    if (!cur || c.count > cur.count) byCol.set(c.col, c);
  }
  return [...byCol.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, SHOTS)
    .sort((a, b) => a.col - b.col);
}

const keyTime = (col, dir) => {
  const p = col / (COLS - 1);
  return dir === "fwd" ? FWD_A + p * (FWD_B - FWD_A) : BCK_B - p * (BCK_B - BCK_A);
};

// ---------------------------------------------------------------- çizim
function drawGrid(cells, targets, t) {
  const hit = new Map(targets.map((c) => [`${c.col}-${c.row}`, c]));
  const out = [];
  for (const c of cells) {
    const x = f(GRID_X + c.col * STEP);
    const y = f(GRID_Y + c.row * STEP);
    const fill = t.levels[c.level];
    const target = hit.get(`${c.col}-${c.row}`);
    const title = c.date ? `<title>${c.date}: ${c.count} katkı</title>` : "";
    if (!target) {
      out.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}">${title}</rect>`);
      continue;
    }
    // vurulduğu anda parlayıp sönüyor
    const t1 = keyTime(c.col, "fwd"), t2 = keyTime(c.col, "bck");
    const [a, b] = t1 < t2 ? [t1, t2] : [t2, t1];
    const d = 0.012;
    const kt = `0;${f(a)};${f(a + d)};${f(b)};${f(b + d)};1`;
    const vals = `${fill};${fill};${t.flash};${fill};${t.flash};${fill}`;
    out.push(
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${fill}">${title}` +
      `<animate attributeName="fill" dur="${LOOP}s" repeatCount="indefinite" keyTimes="${kt}" values="${vals}"/>` +
      `</rect>`
    );
  }
  return out.join("\n");
}

function drawShots(targets, t) {
  const tracers = [], blasts = [];
  const travel = 0.010;          // merminin yolda geçirdiği süre
  const lead = STEP * 1.6;       // jet ateşlediğinde hedefin solunda kalıyor

  for (const dir of ["fwd", "bck"]) {
    for (const c of targets) {
      const arrive = keyTime(c.col, dir);
      const fire = arrive - travel;
      const cx = f(colX(c.col));
      const cy = f(rowY(c.row) + CELL / 2 - 1);
      const fromX = f(dir === "fwd" ? cx - lead : cx + lead);

      tracers.push(
        `<g opacity="0">` +
        `<animate attributeName="opacity" dur="${LOOP}s" repeatCount="indefinite" ` +
        `keyTimes="0;${f(fire)};${f(fire + 0.001)};${f(arrive)};${f(arrive + 0.001)};1" values="0;0;1;1;0;0"/>` +
        `<line x1="0" y1="0" x2="0" y2="7" stroke="${t.tracer}" stroke-width="2.4" stroke-linecap="round">` +
        `<animateTransform attributeName="transform" attributeType="XML" type="translate" dur="${LOOP}s" ` +
        `repeatCount="indefinite" keyTimes="0;${f(fire)};${f(arrive)};1" ` +
        `values="${fromX},${JET_Y};${fromX},${JET_Y};${cx},${cy};${cx},${cy}"/>` +
        `</line></g>`
      );

      blasts.push(
        `<circle cx="${cx}" cy="${f(rowY(c.row))}" r="0" fill="none" stroke="${t.blast}" stroke-width="1.8" opacity="0">` +
        `<animate attributeName="r" dur="${LOOP}s" repeatCount="indefinite" ` +
        `keyTimes="0;${f(arrive)};${f(arrive + 0.02)};1" values="0;1;13;13"/>` +
        `<animate attributeName="opacity" dur="${LOOP}s" repeatCount="indefinite" ` +
        `keyTimes="0;${f(arrive)};${f(arrive + 0.02)};1" values="0;0.95;0;0"/>` +
        `</circle>`
      );
    }
  }
  return { tracers: tracers.join("\n"), blasts: blasts.join("\n") };
}

function drawJet(t) {
  const xIn = f(colX(0)), xOut = f(colX(COLS - 1));
  const offL = f(-40), offR = f(W + 40);
  const kt = `0;${FWD_A};${FWD_B};0.46;0.54;${BCK_A};${BCK_B};1`;
  const vals = [
    `${offL},${JET_Y}`, `${xIn},${JET_Y}`, `${xOut},${JET_Y}`, `${offR},${JET_Y}`,
    `${offR},${JET_Y}`, `${xOut},${JET_Y}`, `${xIn},${JET_Y}`, `${offL},${JET_Y}`,
  ].join(";");

  // dönüşte burnu sola dönsün diye yatay çevirme
  const flip = `<animateTransform attributeName="transform" attributeType="XML" type="scale" ` +
    `dur="${LOOP}s" repeatCount="indefinite" calcMode="discrete" ` +
    `keyTimes="0;0.5;1" values="1 1;-1 1;1 1"/>`;

  const trail = [0, 1, 2, 3, 4, 5].map((i) => {
    const o = f(0.62 - i * 0.095);
    return `<circle cx="${-32 - i * 14}" cy="0" r="${f(3.6 - i * 0.45)}" fill="${t.trail}" opacity="${o}">` +
      `<animate attributeName="opacity" values="${o};${f(o * 0.35)};${o}" ` +
      `dur="${f(0.7 + i * 0.13)}s" repeatCount="indefinite"/></circle>`;
  }).join("");

  return `<g>
  <animateTransform attributeName="transform" attributeType="XML" type="translate"
    dur="${LOOP}s" repeatCount="indefinite" keyTimes="${kt}" values="${vals}"/>
  <g>${flip}
    ${trail}
    <polygon points="-18,-3 -34,0 -18,3" fill="${t.flame}" opacity="0.9">
      <animate attributeName="opacity" values="0.35;1;0.5;1" dur="0.16s" repeatCount="indefinite"/>
    </polygon>
    <path d="M0,-4 L-14,-19 L-4,-19 L9,-4 Z" fill="${t.wing}"/>
    <path d="M0,4 L-14,19 L-4,19 L9,4 Z" fill="${t.wing}"/>
    <path d="M-13,-4 L-20,-13 L-14,-13 L-9,-4 Z" fill="${t.body2}"/>
    <path d="M-13,4 L-20,13 L-14,13 L-9,4 Z" fill="${t.body2}"/>
    <path d="M21,0 L7,-5 L-14,-5 L-18,-2 L-18,2 L-14,5 L7,5 Z" fill="${t.body}" stroke="${t.body2}" stroke-width="1"/>
    <ellipse cx="7" cy="0" rx="5" ry="2.4" fill="${t.canopy}"/>
  </g>
</g>`;
}

function drawChrome(months, total, t) {
  const out = [];
  const mono = `font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"`;

  for (const m of months) {
    out.push(`<text x="${f(GRID_X + m.col * STEP)}" y="24" ${mono} font-size="11" fill="${t.label}">${m.label}</text>`);
  }
  for (const [row, label] of Object.entries(GUN)) {
    out.push(`<text x="${GRID_X - 8}" y="${f(rowY(Number(row)) + 3.5)}" ${mono} font-size="10" ` +
      `text-anchor="end" fill="${t.label}">${label}</text>`);
  }

  out.push(`<text x="${GRID_X}" y="${H - 12}" ${mono} font-size="12" fill="${t.title}">` +
    `<tspan font-weight="600">${total}</tspan> <tspan fill="${t.label}">katkı · son 12 ay</tspan></text>`);

  // sağ altta seviye göstergesi
  const lx = W - 28 - (t.levels.length * 15);
  out.push(`<text x="${f(lx - 8)}" y="${H - 12}" ${mono} font-size="11" text-anchor="end" fill="${t.label}">Az</text>`);
  t.levels.forEach((c, i) => {
    out.push(`<rect x="${f(lx + i * 15)}" y="${H - 22}" width="${CELL}" height="${CELL}" rx="2.5" fill="${c}"/>`);
  });
  out.push(`<text x="${f(lx + t.levels.length * 15 + 2)}" y="${H - 12}" ${mono} font-size="11" fill="${t.label}">Çok</text>`);
  return out.join("\n");
}

function drawStars(t) {
  const pts = [[14, 26], [22, 96], [12, 160], [W - 14, 40], [W - 20, 112], [W - 12, 168], [GRID_X + 60, 168], [W - 120, 20]];
  return pts.map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="1.2" fill="${t.star}" opacity="0.35">` +
    `<animate attributeName="opacity" values="0.12;0.6;0.12" dur="${f(2 + i * 0.4)}s" repeatCount="indefinite"/></circle>`
  ).join("");
}

function buildSvg(cal, t, name) {
  const { cells, months } = toCells(cal);
  const targets = pickTargets(cells);
  const { tracers, blasts } = drawShots(targets, t);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ` +
    `role="img" aria-label="${USER} katkı grafiği üzerinde uçan jet animasyonu">
<defs>
  <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${t.bg0}"/><stop offset="100%" stop-color="${t.bg1}"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="2.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<rect width="${W}" height="${H}" rx="14" fill="url(#sky)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${t.stroke}" stroke-width="1"/>
${name === "dark" ? drawStars(t) : ""}
<g>${drawGrid(cells, targets, t)}</g>
<g>${drawChrome(months, cal.totalContributions, t)}</g>
<g filter="url(#soft)">${blasts}</g>
<g>${tracers}</g>
<g filter="url(#soft)">${drawJet(t)}</g>
</svg>`;
}

// ---------------------------------------------------------------- main
async function main() {
  if (!USER) throw new Error("GH_USERNAME tanımlı değil");
  if (!TOKEN && !DEMO) throw new Error("GH_TOKEN / GITHUB_TOKEN tanımlı değil (GH_DEMO=1 ile önizleme alabilirsiniz)");

  const cal = DEMO ? demoCalendar() : await fetchCalendar();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, theme] of Object.entries(THEMES)) {
    const file = path.join(OUT_DIR, `jet-${name}.svg`);
    fs.writeFileSync(file, buildSvg(cal, theme, name), "utf8");
    console.log(`yazıldı: ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
