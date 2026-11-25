// 사이트 검사: 원본(site/src)에서 빌드가 통과하고, 결과 site/index.html이 규칙(크기·제목·외부 스크립트 없음)을 지키는지.
// 실행: node --test test/**/*.test.ts  (영재단 워커가 작업 검증에 이 명령을 쓴다)
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = join(import.meta.dirname, "..");
const index = join(root, "site", "index.html");

test("원본에서 빌드가 통과한다", () => {
  execFileSync(process.execPath, [join(root, "site", "src", "build.mjs")], { stdio: "pipe" });
});

test("index.html은 200 KiB 이하의 단일 파일이다", () => {
  assert.ok(statSync(index).size <= 200 * 1024);
});

test("제목이 있고 외부 스크립트를 불러오지 않는다", () => {
  const html = readFileSync(index, "utf8");
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
});
