# Movie God (Curation Only)

OTT 영화 네거티브 큐레이션 — 평론가 점수(Metacritic · Rotten Tomatoes)만으로 명작과 쓰레기를 걸러냅니다.

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3002

## Render 배포 (GitHub 연동)

1. [Render](https://render.com) → **New +** → **Blueprint**
2. `juyeon0303/movie_god` 저장소 연결
3. `render.yaml`이 자동으로 Web Service 생성
4. (선택) Environment에 API 키 추가:
   - `OMDB_API_KEY` — 없으면 demo key 사용
   - `TMDB_API_KEY` — 한글 메타데이터 보강
   - `OPENAI_API_KEY` — 무드 검색 AI 한줄평

또는 **New Web Service**로 수동 생성:

| 항목 | 값 |
|------|-----|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check | `/api/health` |

Render가 `PORT` 환경변수를 주입하면 Next.js가 자동으로 해당 포트에서 서비스합니다.

## 지원 OTT

Netflix · Disney+ · Wavve · TVING
