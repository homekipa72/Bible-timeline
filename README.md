# 말씀의 길 (Malssumgil)

한국천주교주교회의 공식 성경 본문을 연동한 **가톨릭 성경 통독** 웹앱입니다.

- 장·절 읽음 기록, 오프라인 캐시(IndexedDB)
- 통독 계획: 전체 / 구약 / 신약 / 역대순(12시대) / 시편 / 복음서 / 개인 맞춤
- 시편은 **편**으로 표기
- Chart.js 진도 시각화, Web Worker 비동기 집계
- JSON·동기화 코드로 기기 간 백업(선택)

본문 출처: [한국천주교주교회의 성경](https://bible.cbck.or.kr/Knb)

## 저장소 구조

```
malssumgil-c-mode/
├── index.html          # 프론트엔드 (SPA)
├── api/
│   └── bible.js        # Vercel Serverless — 성경 HTML 프록시
├── package.json
├── vercel.json
├── README.md
└── .gitignore
```

## GitHub에 올리기

```bash
cd malssumgil-c-mode
git init
git add .
git commit -m "Initial commit: 말씀의 길 성경 통독 앱"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/malssumgil.git
git push -u origin main
```

`YOUR_USERNAME`과 저장소 이름은 본인 계정에 맞게 바꾸세요.

## Vercel 배포

### 방법 A — 대시보드 (추천)

1. [vercel.com](https://vercel.com) 로그인
2. **Add New Project** → GitHub 저장소 연결
3. Framework Preset: **Other** (또는 기본값 유지)
4. Root Directory: 저장소 루트 (이 폴더가 루트인 경우 그대로)
5. **Deploy**

배포 후 주소 예: `https://malssumgil.vercel.app`

### 방법 B — CLI

```bash
npm i -g vercel
vercel login
vercel        # 미리보기
vercel --prod # 프로덕션
```

## 로컬 실행

API(`/api/bible`)가 필요하므로 `index.html`만 열면 본문 불러오기가 동작하지 않습니다.

```bash
npm i -g vercel
vercel dev
```

브라우저에서 `http://localhost:3000` 접속.

## API

`GET /api/bible?book={코드}&chapter={장}`

| 파라미터 | 예 | 설명 |
|----------|-----|------|
| book | `Gn`, `Ps`, `Mt` | CBCK 책 코드 |
| chapter | `1` | 장 번호 |

응답: 해당 장 HTML (캐시 헤더 포함)

## 참고

- 본문은 공식 사이트에서 **장 단위로 가져와** 기기에 저장합니다. 73권 일괄 탑재는 하지 않습니다.
- 진도·노트·계획은 브라우저 로컬 저장소에만 보관됩니다. 계정 동기화는 없으며, 통독 기록 탭의 JSON/코드 내보내기를 사용하세요.
- 운영 시 CBCK 이용 약관·승인 범위를 확인하세요.

## 라이선스

앱 코드는 저장소 정책을 따릅니다. 성경 본문 저작권은 한국천주교주교회의에 있습니다.
