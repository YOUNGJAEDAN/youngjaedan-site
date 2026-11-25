# 영재단 소개 페이지

1인 AI 스튜디오 **영재단(YOUNGJAEDAN)** 을 소개하는 정적 페이지 한 장입니다.
명함·기록용으로, 링크를 받은 사람이 대표와 AI 직원 11명이 어떻게 일하는지 보고
[GitHub 조직](https://github.com/YOUNGJAEDAN)으로 넘어가도록 만들었습니다.

- 첫 화면: 로고, 철학 한 문장, 팀 12명(대표 ✦ 포함). 사람을 누르면 이름·역할·하는 일 카드가 열립니다.
- 첫 화면 그림은 정지 상태이고, "3D로 보기"를 누르면 돌려 볼 수 있습니다. WebGL이 없으면 이름 목록으로, 동작 줄이기가 켜져 있으면 정지 그림만(3D 끔) 보여 줍니다. 어느 쪽이든 사람을 누르면 같은 카드가 열립니다.
- 처음에는 검색 노출을 끕니다(`noindex`). 외부로 나가는 주소는 GitHub 조직 링크 하나뿐입니다.

## 누가 만드나

대표 한 명과 AI 직원들이 만듭니다. 이 레포는 영재단의 일하는 흐름
(아이디어 → 회의·기획 메모 → 프로토타입 확정 → 개발 계획·카드 → 빌드·검토 → 결과 확인)을
처음부터 끝까지 한 번 리허설하는 첫 프로젝트입니다. 그 과정의 기록은 `docs/`에 남깁니다.

## 구조

```
site/
  index.html        배포되는 페이지(자급자족 단일 파일, 생성 결과)
  src/
    src.html        페이지 원본(HTML·CSS·JS)
    data.json       명단·문구 데이터(이름·역할·하는 일)
    assets/         로고 원본(빌드 때 index.html에 data URI로 들어감)
    build.mjs       src.html + data.json + 로고 → site/index.html
docs/               회의록·기획 메모·카드·프로토타입 판 1·2·캡처
.github/workflows/  GitHub Pages 배포
```

`site/index.html`은 직접 고치지 말고 `site/src/`를 고친 뒤 다시 만듭니다.

```sh
node site/src/build.mjs
```

빌드는 Node만 쓰고 설치할 패키지가 없습니다. 빌드할 때 다음을 확인하고, 하나라도 어긋나면 파일을 쓰지 않습니다.

- 외부 주소는 GitHub 조직 링크 하나뿐(프로토콜 없는 `//` 주소, `ws://`, `@import`, `<link>`, `fetch(` 같은 외부 호출, `data:`가 아닌 이미지·스크립트 없음)
- `<head>` 안에 `noindex` 메타가 있음
- `data.json`의 필드와 타입, 명단 12명·id 중복 없음·대표(사람) 1명
- 용량 한도(200 KiB)

## 로컬에서 미리 보기

```sh
open site/index.html          # macOS, 파일로 바로 열기
# 또는 간단 서버
python3 -m http.server -d site 8000   # http://localhost:8000
```

주소 끝에 붙이는 해시로 특정 상태를 바로 열 수 있습니다:
`#card=s-design`(카드), `#3d`(3D 보기), `#list`(팀 목록), `#nogl`(WebGL 없이).

## 배포

`main`에 머지되면 GitHub Actions(`.github/workflows/pages.yml`)가 `site/index.html`을
GitHub Pages로 배포합니다. Actions 탭에서 수동으로 실행할 수도 있지만 배포는 `main`에서만 됩니다.
배포 전과 모든 PR·push(`.github/workflows/check.yml`)에서 빌드 검사를 다시 돌리고, 커밋된 `site/index.html`이
원본에서 만든 결과와 다르면 실패합니다.

## 기록 위치

| 경로                  | 내용                                           |
| --------------------- | ---------------------------------------------- |
| `docs/meeting-1/`     | 회의 1 안건, 메모 3개, 회의록                   |
| `docs/brief.md`       | 기획 메모 한 장                                 |
| `docs/cards.md`       | 개발 카드                                       |
| `docs/prototype/v1/`  | 프로토타입 판 1                                 |
| `docs/prototype/v2/`  | 확정 판 2(관문 1)                               |
| `docs/screenshots/`   | 이 페이지의 390px·1280px 캡처                   |

## 왜 이 레포만 공개인가

영재단 레포는 비공개가 기본입니다. 다만 GitHub 무료 조직은 비공개 레포에서 GitHub Pages를 쓸 수 없어서,
Pages로 배포하는 이 레포만 예외로 공개합니다. 그래서 이 레포에는 비밀값·내부 주소·운영 데이터를 두지 않습니다.
