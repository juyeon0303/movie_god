# Movie God (Curation Only)

OTT 영화 네거티브 큐레이션 — 평론가 점수(Metacritic · Rotten Tomatoes)만으로 명작/쓰레기를 분류합니다.

## 아키텍처 (Pre-Render)

```
[일 1회 배치] GitHub Actions / Render Cron
  JustWatch → OMDb → tier 분류 → DB 또는 data/snapshots/*.json 저장

[유저 요청] /api/tiers
  저장된 스냅샷만 읽기 (~50ms) — 외부 API 호출 없음
```

## 로컬 실행

```bash
npm install
npm run sync:tiers    # 최초 1회 필수 — 4개 OTT 스냅샷 생성
npm run dev           # http://localhost:3002
```

## 배치 (sync:tiers)

```bash
npm run sync:tiers
```

- **파일 모드 (기본):** `data/snapshots/{nfx,dnp,wav,tvk}.json`
- **DB 모드 (선택):** `DATABASE_URL` 설정 시 PostgreSQL upsert + 파일 백업

## GitHub Actions

`.github/workflows/sync-tiers.yml` — 매일 12:00 KST 자동 실행

1. 4대 OTT 스캔 + OMDb 점수
2. JSON 스냅샷 커밋 → Render 자동 재배포

수동 실행: GitHub → Actions → **Sync OTT Tier Snapshots** → Run workflow

## Render 배포

| 항목 | 값 |
|------|-----|
| Build | `npm install --include=dev && npm run build` |
| Start | `npm start` |
| Health | `/api/health` |
| Cron | `render.yaml`의 `movie-god-sync` (매일 03:00 UTC) |

선택 환경변수: `DATABASE_URL`, `OMDB_API_KEY`, `TMDB_API_KEY`

## 지원 OTT

Netflix (`nfx`) · Disney+ (`dnp`) · Wavve (`wav`) · TVING (`tvk`)
