export interface WakeMessage {
  headline: string;
  sub?: string;
}

export const WAKE_MESSAGES: WakeMessage[] = [
  {
    headline: "서버를 시작하는 중이에요.",
    sub: "무료 호스팅은 잠시 쉬었다가 첫 요청에 다시 켜져요.",
  },
  {
    headline: "첫 로딩은 조금 걸릴 수 있어요.",
    sub: "한 번 연결되면 다음부터는 더 빨라져요.",
  },
  {
    headline: "목록을 불러오는 중이에요.",
    sub: "Approved와 Trash Cut 데이터를 준비하고 있어요.",
  },
  {
    headline: "잠시만 기다려 주세요.",
    sub: "이동진 · MC · RT 점수만 사용해요.",
  },
  {
    headline: "거의 다 됐어요.",
    sub: "조금만 더 기다려 주세요.",
  },
  {
    headline: "연결 중…",
    sub: "서버가 깨어나는 중일 수 있어요.",
  },
  {
    headline: "Approved는 블렌드 75점 이상.",
    sub: "Metacritic 또는 두 개 이상의 평론 소스가 필요해요.",
  },
  {
    headline: "Trash Cut은 점수 기준 분류예요.",
    sub: "목록에 올랐다고 작품을 평가하지는 않아요.",
  },
];

export const WAKE_TIPS: string[] = [
  "블렌드: 이동진 35% · MC 40% · RT 25%",
  "MC 45 이하, RT 59% 이하 → Trash Cut 후보",
  "OTT를 바꾸면 목록도 함께 바뀌어요",
  "무드 검색은 키워드로 매칭해요",
  "데이터는 주기적으로 갱신돼요",
  "OTT 확인됨 = JustWatch에서 시청 링크를 확인했어요",
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
