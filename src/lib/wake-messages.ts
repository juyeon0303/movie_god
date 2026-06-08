export interface WakeMessage {
  headline: string;
  sub?: string;
}

export const WAKE_MESSAGES: WakeMessage[] = [
  {
    headline: "서버가 낮잠에서 깨는 중이에요.",
    sub: "Render 무료 플랜은 한동안 조용하다가, 첫 요청에 다시 켜집니다.",
  },
  {
    headline: "첫 로딩은 30초쯤 걸릴 수 있어요.",
    sub: "한번 깨어나면 다음엔 훨씬 빨라져요.",
  },
  {
    headline: "잠깐만요. 목록 정리 중이에요.",
    sub: "Approved와 Trash Cut, 둘 다 준비하고 있어요.",
  },
  {
    headline: "커피 한 모금 하고 오셔도 돼요.",
    sub: "점수는 이동진 · MC · RT만 씁니다.",
  },
  {
    headline: "거의 다 왔어요. 조금만 더.",
    sub: "관객 평점은 빼고, 평론가 점수만 모았어요.",
  },
  {
    headline: "서버 스타트업 중…",
    sub: "무료 호스팅의 클래식한 순간이에요.",
  },
  {
    headline: "블렌드 75점 넘는 것만 Approved.",
    sub: "RT 100% 단독은 표본 부족으로 제외돼요.",
  },
  {
    headline: "Trash Cut은 점수 기준일 뿐이에요.",
    sub: "재미없다고 단정하진 않아요. 참고용이에요.",
  },
];

export const WAKE_TIPS: string[] = [
  "LDJ 35% · MC 40% · RT 25% 가중 블렌드",
  "MC 45 이하, 또는 RT 59% 이하 → Trash Cut 후보",
  "한 OTT씩 탭해서 Approved / Trash Cut 전환",
  "무드 검색은 RAG 임베딩 또는 키워드 폴백",
  "스냅샷은 GitHub Actions가 주기적으로 갱신",
  "OTT Verified 뱃지 = JustWatch 시청 링크 확인됨",
];

export function pickWakeMessage(elapsedMs: number, tick: number): WakeMessage {
  const slowIndex = Math.floor(elapsedMs / 5000);
  const index = (slowIndex + tick) % WAKE_MESSAGES.length;
  return WAKE_MESSAGES[index];
}

export function pickWakeTip(tick: number): string {
  return WAKE_TIPS[tick % WAKE_TIPS.length];
}

/** 0–92% until done — never lies at 100% while still loading */
export function wakeProgress(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  if (seconds < 3) return 8 + seconds * 6;
  if (seconds < 15) return 26 + (seconds - 3) * 3.5;
  if (seconds < 40) return 68 + (seconds - 15) * 0.7;
  return Math.min(92, 82 + (seconds - 40) * 0.15);
}
