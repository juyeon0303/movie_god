export interface WakeMessage {
  headline: string;
  sub?: string;
}

export const WAKE_MESSAGES: WakeMessage[] = [
  {
    headline: "서버 깨우는 중.",
    sub: "Render free tier tax. 첫 클릭이 제일 느림.",
  },
  {
    headline: "첫 로딩 30초 각.",
    sub: "한번 살아나면 그다음부턴 빠름.",
  },
  {
    headline: "목록 싸는 중.",
    sub: "Approved / Trash Cut 동시 로딩.",
  },
  {
    headline: "커피 한 모금.",
    sub: "이동진 · MC · RT만 봄. 관객 평점은 패스.",
  },
  {
    headline: "거의 됐음.",
    sub: "진짜로. 조금만.",
  },
  {
    headline: "스핀업 중.",
    sub: "무료 호스팅 클래식.",
  },
  {
    headline: "75 미만은 Approved 없음.",
    sub: "RT 100% 단독? 표본 부족이라 컷.",
  },
  {
    headline: "Trash Cut = 숫자 필터.",
    sub: "재미없다고 안 함. 점수만 말함.",
  },
];

export const WAKE_TIPS: string[] = [
  "블렌드: LDJ 35 · MC 40 · RT 25",
  "MC 45↓ / RT 59↓ → Trash Cut 후보",
  "OTT 탭 바꾸면 목록도 갈림",
  "무드 검색 = 키워드 (vec 있으면 더 정확)",
  "데이터는 GHA cron이 갱신",
  "Verified = JustWatch 링크 실제 확인됨",
];

export function pickWakeMessage(elapsedMs: number, tick: number): WakeMessage {
  const slowIndex = Math.floor(elapsedMs / 5000);
  const index = (slowIndex + tick) % WAKE_MESSAGES.length;
  return WAKE_MESSAGES[index];
}

export function pickWakeTip(tick: number): string {
  return WAKE_TIPS[tick % WAKE_TIPS.length];
}

export function wakeProgress(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  if (seconds < 3) return 8 + seconds * 6;
  if (seconds < 15) return 26 + (seconds - 3) * 3.5;
  if (seconds < 40) return 68 + (seconds - 15) * 0.7;
  return Math.min(92, 82 + (seconds - 40) * 0.15);
}
