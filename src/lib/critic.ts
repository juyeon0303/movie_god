import type { CuratedMovie } from "./types";
import { resolveCriticScore } from "./filters";

function scoreToStars(score: number): string {
  const stars = Math.min(5, Math.max(1, Math.round(score / 20)));
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

function pick<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % arr.length;
  return arr[hash];
}

function primaryGenre(movie: CuratedMovie): string | undefined {
  return movie.genres?.[0];
}

function moodHint(mood?: string): string | undefined {
  if (!mood) return undefined;
  if (/비|우울|쓸쓸|외로/.test(mood)) return "혼자 조용히";
  if (/와인|잔잔|감성/.test(mood)) return "천천히";
  if (/스릴러|뒤통수|긴장/.test(mood)) return "밤에";
  if (/웃|코미/.test(mood)) return "기분 전환용";
  if (/공포/.test(mood)) return "불 끄고";
  if (/감동|위로/.test(mood)) return "마음 비울 때";
  return undefined;
}

function curatedLines(movie: CuratedMovie, score: number, mood?: string): string[] {
  const genre = primaryGenre(movie);
  const hint = moodHint(mood);
  const g = genre ? `${genre} 좋아하면 ` : "";

  const high = [
    `${g}이건 그냥 봐도 됨. 평론가들이 먼저 손 든 작품.`,
    `말 많을 필요 없음. ${score}점이 이미 다 말해 줌.`,
    `두 번 봐도 아깝지 않음. 오늘 픽 중에 이게 1등.`,
    hint ? `${hint} 틀어놓기 좋음. 끝나고 한참 멍함.` : `예고편보다 본편이 훨씬 나음. 이게 진짜임.`,
  ];

  const mid = [
    `${g}기대 너무 크게 잡지 말고 보면 괜찮음.`,
    `완벽하진 않은데, 시간은 안 아까움.`,
    hint ? `${hint} 보면 분위기는 살아남.` : `평점보다 실제 체감이 조금 더 나음.`,
    `명작이라 부르긴 어렵지만, 충분히 볼 만함.`,
  ];

  if (score >= 85) return high;
  if (score >= 75) return mid;
  return mid;
}

function trashLines(movie: CuratedMovie, score: number): string[] {
  return [
    `솔직히 이건 패스. ${score}점이 현실적으로 말해 줌.`,
    `인기는 있는데 작품성은… 음, 다음 거 고르세요.`,
    `트레일러가 제일 재밌었을 가능성 높음.`,
    `보고 나서 "왜 봤지" 할 확률 큼. 차라리 다른 거.`,
    `랭킹에 올라와서 눌렀다가 후회하는 타입.`,
    `평론가들이 이미 답 내놨음. ${score}점.`,
  ];
}

function formatLine(text: string, score: number): string {
  const stars = scoreToStars(score);
  return `${text} ${stars}`;
}

export function generateTrashCriticLine(movie: CuratedMovie): string {
  const score = resolveCriticScore(movie) ?? 0;
  const line = pick(trashLines(movie, score), movie.id + "trash");
  return formatLine(line, score);
}

export function generateCriticLine(movie: CuratedMovie, mood?: string): string {
  const score = resolveCriticScore(movie) ?? 75;
  const lines = curatedLines(movie, score, mood);
  const line = pick(lines, movie.id + (mood ?? ""));
  return formatLine(line, score);
}

export async function generateAICriticLine(
  movie: CuratedMovie,
  mood?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return generateCriticLine(movie, mood);

  const score = resolveCriticScore(movie) ?? 0;
  const stars = scoreToStars(score);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `너는 영화를 자주 보는 친한 친구야. 한 줄로 짧게 말해줘.
- 35자 이내, 자연스러운 구어체
- "~입니다", 과한 은유, 억지 비유 금지
- 마지막에 별점만 붙여 (예: ★★★★☆)
- 광고 문구처럼 쓰지 마`,
          },
          {
            role: "user",
            content: `영화: ${movie.title} (${movie.year ?? ""})
장르: ${movie.genres?.join(", ") ?? "미상"}
줄거리: ${(movie.overview ?? movie.description ?? "").slice(0, 120)}
평론가 점수: ${score}
${mood ? `지금 기분/상황: ${mood}` : ""}
별점 형식: ${stars}`,
          },
        ],
        max_tokens: 80,
        temperature: 0.8,
      }),
    });

    if (!res.ok) return generateCriticLine(movie, mood);

    const data = await res.json();
    const line = data.choices?.[0]?.message?.content?.trim();
    if (!line) return generateCriticLine(movie, mood);

    return line.includes("★") ? line : `${line} ${stars}`;
  } catch {
    return generateCriticLine(movie, mood);
  }
}
