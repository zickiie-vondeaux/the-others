export * from "./types";
export * from "./auto-calc";

export { mbtiQuiz }           from "./quizzes/mbti";
export { enneagramQuiz }      from "./quizzes/enneagram";
export { bigFiveQuiz }        from "./quizzes/big-five";
export { loveLanguagesQuiz }  from "./quizzes/love-languages";
export { attachmentQuiz }     from "./quizzes/attachment";
export { discQuiz }           from "./quizzes/disc";

import { mbtiQuiz }           from "./quizzes/mbti";
import { enneagramQuiz }      from "./quizzes/enneagram";
import { bigFiveQuiz }        from "./quizzes/big-five";
import { loveLanguagesQuiz }  from "./quizzes/love-languages";
import { attachmentQuiz }     from "./quizzes/attachment";
import { discQuiz }           from "./quizzes/disc";
import type { Quiz } from "./types";

export const ALL_QUIZZES: Quiz[] = [
  mbtiQuiz,
  enneagramQuiz,
  bigFiveQuiz,
  loveLanguagesQuiz,
  attachmentQuiz,
  discQuiz,
];

export const AUTO_CALC_SLUGS = ["zodiac", "chinese_zodiac", "life_path", "human_design"] as const;
export type AutoCalcSlug = typeof AUTO_CALC_SLUGS[number];

export const AUTO_CALC_META: Record<AutoCalcSlug, { name: string; shortName: string; icon: string; description: string }> = {
  zodiac:         { name:"Western Zodiac",  shortName:"Zodiac",    icon:"♊", description:"Based on your birth month and day." },
  chinese_zodiac: { name:"Chinese Zodiac",  shortName:"Chinese Z.", icon:"🐉", description:"Based on your birth year." },
  life_path:      { name:"Life Path",       shortName:"Life Path",  icon:"🔢", description:"Numerology from your full birthdate." },
  human_design:   { name:"Human Design",    shortName:"HD Type",    icon:"⚙", description:"Your energetic archetype from your birthdate." },
};
