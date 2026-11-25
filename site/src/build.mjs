// site/src/src.html + data.json (+ assets/logo-ko-light.png) -> site/index.html (자급자족 단일 파일)
// 실행: node site/src/build.mjs
// 검사가 하나라도 어긋나면 index.html을 쓰지 않고 실패(종료 코드 1)한다.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "index.html");
const HTML_LIMIT = 200 * 1024;
const DATA_LIMIT = 64 * 1024;
const ALLOWED_URL = "https://github.com/YOUNGJAEDAN";
const PEOPLE_COUNT = 12;
const LOGO_COUNT = 1; // 머리띠 로고 <img> 한 곳

function fail(msg) {
  console.error("실패: " + msg);
  process.exit(1);
}
const count = (text, re) => (text.match(re) || []).length;

/* ---------- data.json ---------- */
const dataRaw = readFileSync(join(here, "data.json"), "utf8");
const dataBytes = Buffer.byteLength(dataRaw);
if (dataBytes > DATA_LIMIT) fail(`data.json ${dataBytes} B > ${DATA_LIMIT} B`);
const data = JSON.parse(dataRaw);

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.trim() !== "";
function needStr(obj, key, where) {
  if (!isObj(obj) || !isStr(obj[key])) fail(`${where}.${key}: 빈 칸이 아닌 문자열이어야 합니다`);
}
function checkData(d) {
  if (!isObj(d)) fail("data.json 최상위는 객체여야 합니다");
  needStr(d, "asOf", "data");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.asOf)) fail("data.asOf: YYYY-MM-DD 형식이어야 합니다");
  if (!isObj(d.site)) fail("data.site: 객체여야 합니다");
  for (const k of ["subtitle", "philosophy", "teamLine"]) needStr(d.site, k, "site");
  if (!isObj(d.github)) fail("data.github: 객체여야 합니다");
  for (const k of ["org", "label"]) needStr(d.github, k, "github");
  if (`https://github.com/${d.github.org}` !== ALLOWED_URL) fail("github.org가 허용된 GitHub 링크와 다릅니다");

  const h = d.howWeWork;
  if (!isObj(h)) fail("data.howWeWork: 객체여야 합니다");
  needStr(h, "title", "howWeWork");
  if (!Array.isArray(h.lines) || h.lines.length !== 3 || !h.lines.every(isStr))
    fail("howWeWork.lines: 빈 칸 없는 문자열 3줄이어야 합니다");
  if (!Array.isArray(h.approvals) || h.approvals.length === 0) fail("howWeWork.approvals: 비어 있지 않은 배열이어야 합니다");
  h.approvals.forEach((a, i) => {
    if (!isObj(a) || !Number.isInteger(a.n)) fail(`howWeWork.approvals[${i}].n: 정수여야 합니다`);
    needStr(a, "name", `howWeWork.approvals[${i}]`);
    needStr(a, "what", `howWeWork.approvals[${i}]`);
  });

  if (!Array.isArray(d.projects)) fail("data.projects: 배열이어야 합니다");
  d.projects.forEach((p, i) => needStr(p, "name", `projects[${i}]`));
  needStr(d, "projectsEmpty", "data");
  needStr(d, "projectsEmptyNote", "data");

  if (!Array.isArray(d.people) || d.people.length !== PEOPLE_COUNT) fail(`people는 ${PEOPLE_COUNT}명이어야 합니다`);
  const ids = new Set();
  d.people.forEach((p, i) => {
    const w = `people[${i}]`;
    if (!isObj(p)) fail(`${w}: 객체여야 합니다(null 불가)`);
    for (const k of ["id", "name", "role", "does", "kind"]) needStr(p, k, w);
    if (!/^[a-z0-9-]+$/.test(p.id)) fail(`${w}.id: 소문자·숫자·하이픈만 씁니다(주소 해시에 들어감)`);
    if (ids.has(p.id)) fail(`${w}.id: "${p.id}" 중복`);
    ids.add(p.id);
    if (p.kind !== "ai" && p.kind !== "human") fail(`${w}.kind: "ai" 또는 "human"이어야 합니다`);
    if (!isObj(p.look)) fail(`${w}.look: 객체여야 합니다`);
    for (const k of ["skin", "hair", "style"]) needStr(p.look, k, `${w}.look`);
  });
  const humans = d.people.filter((p) => p.kind === "human").length;
  if (humans !== 1) fail(`kind "human"은 정확히 1명(대표)이어야 합니다 (지금 ${humans}명)`);
}
checkData(data);

/* ---------- src.html 자리표시자 ---------- */
const src = readFileSync(join(here, "src.html"), "utf8");
const DATA_SLOT = "<!--SITE_DATA-->";
const LOGO_SLOT = "%%LOGO_DATA_URI%%";
if (src.split(DATA_SLOT).length !== 2) fail("src.html에 " + DATA_SLOT + " 자리표시자가 정확히 한 개 있어야 합니다");
const logoSlots = src.split(LOGO_SLOT).length - 1;
if (logoSlots !== LOGO_COUNT) fail(`src.html의 ${LOGO_SLOT} 자리표시자는 ${LOGO_COUNT}개여야 합니다 (지금 ${logoSlots}개)`);

const json = JSON.stringify(data).replace(/</g, "\\u003c");
const block = `<script type="application/json" id="site-data">${json}</script>`;
const logo =
  "data:image/png;base64," + readFileSync(join(here, "assets", "logo-ko-light.png")).toString("base64");

const html = src.replace(DATA_SLOT, () => block).split(LOGO_SLOT).join(logo);

/* ---------- 결과 검사 ---------- */
// 외부 주소: 허용된 GitHub 링크 한 곳 말고는 http(s)://, ws(s)://, 프로토콜 없는 //host 가 없어야 한다.
const urls = html.match(/https?:\/\/[^\s"'<>)]+/g) || [];
const bad = urls.filter((u) => u !== ALLOWED_URL);
if (bad.length) fail("허용되지 않은 외부 URL: " + bad.join(", "));
if (urls.length !== 1) fail(`GitHub 링크는 한 곳만 허용 (지금 ${urls.length}곳)`);
if (count(html, /wss?:\/\//gi)) fail("ws(s):// 주소가 있습니다");
// 프로토콜 없는 //host.tld. 앞이 ':'이면 위의 http(s)·ws(s) 검사 대상이라 뺀다.
// JS 주석("// 렌더러 …")은 // 뒤에 공백이 와서 걸리지 않고, base64에는 '.'이 없어 data URI도 걸리지 않는다.
const protoless = html.match(/(?<!:)\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi) || [];
if (protoless.length) fail("프로토콜 없는 외부 주소: " + protoless.join(", "));

// 외부를 불러오거나 내보내는 방법이 코드에 없어야 한다.
const banned = [
  [/@import\b/i, "@import"],
  [/<link\b/i, "<link"],
  [/<base\b/i, "<base"],
  [/<iframe\b|<object\b|<embed\b|<frame\b/i, "<iframe·object·embed·frame"],
  [/\bfetch\s*\(/, "fetch("],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/WebSocket/, "WebSocket"],
  [/EventSource/, "EventSource"],
  [/sendBeacon/, "sendBeacon"],
  [/\bimport\s*\(/, "동적 import("],
  [/\bsrcset\s*=/i, "srcset"],
  [/url\(\s*['"]?(?!data:)/i, "data: 아닌 CSS url("],
];
for (const [re, name] of banned) if (re.test(html)) fail(`허용되지 않은 코드: ${name}`);

// <script src>는 0개, <img src>는 data: 뿐이어야 한다.
const scriptSrc = count(html, /<script\b[^>]*\bsrc\s*=/gi);
if (scriptSrc) fail(`<script src> ${scriptSrc}개 (0개여야 함)`);
const imgSrcs = [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]*)/gi)].map((m) => m[1]);
const imgExternal = imgSrcs.filter((s) => !s.startsWith("data:"));
if (imgExternal.length) fail(`data: 아닌 <img src> ${imgExternal.length}개`);
if (imgSrcs.length !== LOGO_COUNT) fail(`<img>는 로고 ${LOGO_COUNT}개여야 합니다 (지금 ${imgSrcs.length}개)`);
if (html.includes(LOGO_SLOT)) fail("로고 자리표시자가 남아 있습니다");

// noindex: 주석이 아닌 실제 <head> 안의 meta 요소여야 한다.
const head = (html.match(/<head>([\s\S]*?)<\/head>/i) || [])[1];
if (head === undefined) fail("<head>를 찾지 못했습니다");
const headNoComments = head.replace(/<!--[\s\S]*?-->/g, "");
if (!/<meta\s+name="robots"\s+content="noindex"\s*\/?>/.test(headNoComments)) fail("<head> 안에 noindex 메타가 없습니다");

if (/샘플/.test(html)) fail("'샘플' 표시가 남아 있습니다");

// 블록과 data.json이 같은지 되읽어 확인한다.
const m = html.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/);
if (!m || JSON.stringify(JSON.parse(m[1])) !== JSON.stringify(data)) fail("site-data 블록이 data.json과 다릅니다");

const htmlBytes = Buffer.byteLength(html);
const kib = (b) => (b / 1024).toFixed(1) + " KiB";
console.log(`data.json  ${dataBytes} B (${kib(dataBytes)}) / 한도 64 KiB`);
console.log(`index.html ${htmlBytes} B (${kib(htmlBytes)}) / 한도 200 KiB`);
if (htmlBytes > HTML_LIMIT) fail(`index.html ${htmlBytes} B > ${HTML_LIMIT} B (쓰지 않음)`);
writeFileSync(out, html);
console.log("통과");
