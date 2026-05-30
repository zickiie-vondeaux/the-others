const ENNEAGRAM_NAMES: Record<string, string> = {
  "1": "Reformer",
  "2": "Helper",
  "3": "Achiever",
  "4": "Individualist",
  "5": "Investigator",
  "6": "Loyalist",
  "7": "Enthusiast",
  "8": "Challenger",
  "9": "Peacemaker",
};

export function zodiacSrc(sign: string) {
  return `/Zodiac%20Icons/${sign}.svg`;
}

export function mbtiSrc(code: string) {
  return `/MBTI%20icons/${code}.svg`;
}

export function enneagramSrc(code: string) {
  const name = ENNEAGRAM_NAMES[code];
  return name ? `/Enneagram%20icons/Type%20${code}%20${name}.svg` : null;
}
