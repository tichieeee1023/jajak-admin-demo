# JAJAK Admin Demo

가상 데이터로 상품·주문·회원 등 쇼핑몰 운영 업무를 체험하는 독립형 관리자 데모입니다.

실제 서비스와 연결되지 않으며, 로그인 없이 모든 관리자 화면을 확인할 수 있습니다. 데이터를 수정하거나 삭제해도 현재 브라우저의 가상 데이터에만 반영됩니다.

## 주요 기능

| 화면 | 기능 |
| --- | --- |
| 대시보드 | 가상 주문·회원·이벤트·AI 기록 요약과 차트 |
| 상품 관리 | 검색·필터·페이지 전환, 상품 등록·수정·삭제, 이미지 미리보기 |
| 주문 관리 | 검색·필터·정렬, 주문 상세, 배송 정보와 주문 상태 변경 |
| 회원 관리 | 회원 검색·필터·정렬, 활동 요약, 가상 역할·이용 상태 변경 |
| 리뷰 관리 | 상품·평점·공개 상태 필터, 상세 조회, 게시·숨김·삭제 |
| 공지 관리 | 공지 등록·수정·삭제, 중요 공지와 게시 상태 관리 |
| 이벤트 관리 | 이벤트 검색·필터, 등록·수정·삭제, 가상 참여 현황 |
| AI 추천 기록 | 가상 추천 결과 검색·필터·상세 조회와 통계 |

데스크톱과 모바일에 맞춘 관리자 메뉴를 제공하며, 상단의 **데모 데이터 초기화** 버튼으로 언제든 초기 상태로 되돌릴 수 있습니다.

상단 데모 안내는 X 버튼으로 닫을 수 있습니다. 화면을 이동해도 닫힌 상태를 유지하며, 새로고침하면 초기화 버튼과 함께 다시 표시됩니다.

## 기술 스택

- React 19, JavaScript / JSX
- Vite 8, React Router 7
- Sass / SCSS Modules
- Chart.js, react-chartjs-2
- GSAP
- 브라우저 localStorage

Firebase, 외부 AI API, 별도 백엔드와 환경변수를 사용하지 않습니다.

## 로컬 실행

Node.js 24와 npm을 기준으로 검증했습니다.

```bash
git clone https://github.com/tichieeee1023/jajak-admin-demo.git
cd jajak-admin-demo
npm ci --ignore-scripts
npm run dev
```

터미널에 표시되는 로컬 주소로 접속하면 `/admin` 대시보드가 열립니다. 이미 설치한 폴더에서는 `npm run dev`만 실행하면 됩니다.

PowerShell에서 npm 실행이 제한되면 `npm` 대신 `npm.cmd`를 사용하세요.

## Vercel에서 직접 접속과 404 처리

루트의 `vercel.json`은 `/admin`과 `/admin/products` 같은 경로 요청을 `index.html`로 전달합니다. [Vercel의 Vite SPA 설정](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)에 따라, 직접 접속과 새로고침에서도 React Router가 해당 화면을 표시합니다. 이 설정은 Vercel에 새로 배포한 뒤 적용됩니다.

기본 주소 `/`만 `/admin`으로 이동하며, 없는 주소는 별도 404 안내 화면을 표시합니다. 안내 화면에서 관리자 홈으로 이동하거나 이전 화면으로 돌아갈 수 있습니다. SPA 내부의 404 안내이므로 HTTP 응답 상태와는 구분합니다.

빌드 후 `npm run preview -- --port 4175 --strictPort`를 실행한 상태에서, 다른 터미널의 `node scripts/routing-check.mjs`로 로컬 직접 접속·새로고침·404 복귀 동작을 검사할 수 있습니다. 실제 Vercel 라우팅 반영 여부는 배포 후 별도로 확인해야 합니다.

## 데이터와 초기화

- 회원·상품·주문·리뷰·공지·이벤트·AI 기록은 모두 가상 데이터입니다.
- 데이터는 `src/demo/data/catalog.js`에서 생성합니다.
- 데이터 조회·저장은 `src/demo/services/`의 로컬 서비스에서 처리합니다.
- 변경 사항은 `jajak_portfolio_demo_v1` 키로 현재 브라우저에 저장됩니다.
- 같은 브라우저에서도 접속 주소나 포트가 달라지면 저장 상태가 구분됩니다.
- 초기화 버튼을 누르고 확인하면 수정·삭제한 가상 데이터가 초기 샘플로 복구됩니다.

이미지는 브라우저 내부에서 크기를 줄여 저장하며 서버에 업로드하지 않습니다. 체험 시에도 실제 개인정보 대신 가상의 내용과 이미지를 사용하세요.

## 폴더 구조

```text
src/
├── assets/             # 관리자 아이콘·장식·샘플 이미지·폰트
├── components/admin/   # 관리자 공통 UI
├── constants/          # 주문 상태 상수
├── demo/
│   ├── data/           # 가상 데이터
│   └── services/       # 로컬 조회·저장·초기화
├── pages/Admin/        # 관리자 화면
├── styles/             # 공통 스타일과 디자인 토큰
├── App.jsx             # 관리자 라우팅·데모 안내·초기화
└── main.jsx
scripts/                # 데이터·브라우저·보안 검증
```

## 검증

```bash
npm run lint
npm test
npm run build
npm run check
```

관리자 8개 화면, 상품·공지 CRUD, 주문 배송 완료, 리뷰 공개 변경, 저장 유지·초기화, 320px·390px 모바일 화면을 브라우저에서 확인했습니다. 검사한 흐름에서 브라우저 콘솔 오류와 외부 요청은 없었습니다. Hook 의존성 관련 lint 경고 4건은 남아 있습니다.

Windows 기본 설치 경로의 Chrome으로 브라우저 자동 검사를 실행하려면:

```bash
npm run preview -- --port 4175 --strictPort
# 다른 터미널에서 실행
node scripts/browser-check.mjs
```

테스트 자료는 Git 제외 대상인 `test-results/`에 저장됩니다. 검사 범위와 한계는 [SECURITY_CHECK.md](SECURITY_CHECK.md)를 확인하세요.

## 데모 범위

실제 인증·결제·배송·포인트 지급·이벤트 추첨·AI 추천 생성은 수행하지 않습니다. 이벤트 당첨자 확인 기능은 미구현 상태로 표시하고 비활성화했습니다. 대시보드 일부 지표는 미연결 표시를 유지합니다.

브라우저 저장 공간에는 제한이 있어 큰 이미지 여러 장을 저장하면 실패할 수 있습니다. 회원 역할·상태와 주문·이벤트의 모든 입력 조합을 전수 검사한 것은 아닙니다.
