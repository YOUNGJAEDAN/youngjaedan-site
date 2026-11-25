// site/src/src.html + data.json (+ assets/logo-ko-light.png) -> site/index.html (자급자족 단일 파일)
// 실행: node site/src/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "index.html");
const HTML_LIMIT = 200 * 1024;
const DATA_LIMIT = 64 * 1024;
const ALLOWED_URL = "https://github.com/YOUNGJAEDAN";

function fail(msg) {
  console.error("실패: " + msg);
  process.exit(1);
}

const dataRaw = readFileSync(join(here, "data.json"), "utf8");
const dataBytes = Buffer.byteLength(dataRaw);
if (dataBytes > DATA_LIMIT) fail(`data.json ${dataBytes} B > ${DATA_LIMIT} B`);
const data = JSON.parse(dataRaw);
if (!Array.isArray(data.people) || data.people.length !== 12) fail("people는 12명이어야 합니다");

const src = readFileSync(join(here, "src.html"), "utf8");
const DATA_SLOT = "<!--SITE_DATA-->";
const LOGO_SLOT = "%%LOGO_DATA_URI%%";
if (src.split(DATA_SLOT).length !== 2) fail("src.html에 " + DATA_SLOT + " 자리표시자가 정확히 한 개 있어야 합니다");

const json = JSON.stringify(data).replace(/</g, "\\u003c");
const block = `<script type="application/json" id="site-data">${json}</script>`;
const logo =
  "data:image/png;base64," + readFileSync(join(here, "assets", "logo-ko-light.png")).toString("base64");

const html = src.replace(DATA_SLOT, () => block).split(LOGO_SLOT).join(logo);

// 외부 URL 검사: 허용된 GitHub 링크 한 곳 말고는 http(s):// 가 없어야 한다.
const urls = html.match(/https?:\/\/[^\s"'<>)]+/g) || [];
const bad = urls.filter((u) => u !== ALLOWED_URL);
if (bad.length) fail("허용되지 않은 외부 URL: " + bad.join(", "));
if (urls.length !== 1) fail(`GitHub 링크는 한 곳만 허용 (지금 ${urls.length}곳)`);
if (!html.includes('<meta name="robots" content="noindex"')) fail("noindex 메타가 없습니다");
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
