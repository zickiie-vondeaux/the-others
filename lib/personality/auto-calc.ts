import type { QuizResult } from "./types";

// ──────────────────────────────────────────────────────────────
// Western Zodiac (Sun Sign by birth month + day)
// ──────────────────────────────────────────────────────────────

export interface AutoCalcResult extends Omit<QuizResult, "data"> {
  symbol: string;
}

const ZODIAC: Record<string, Omit<AutoCalcResult, "code">> = {
  Aries:       { label:"Aries",       symbol:"♈", description:"Bold, ambitious, and fiercely independent. You charge headfirst into everything you do and inspire everyone around you to keep up. Competitive, direct, and allergic to indecision.", characters:["Daenerys Targaryen","Katniss Everdeen","Aries (Lore Olympus)","Daredevil"] },
  Taurus:      { label:"Taurus",      symbol:"♉", description:"Patient, persistent, and deeply pleasure-seeking. You build things that last, enjoy the sensory world fully, and once you've decided something, you do not move. The immovable object, the cozy blanket — often both.", characters:["Samwise Gamgee","Robb Stark","Alfred Pennyworth","Donna Meagle"] },
  Gemini:      { label:"Gemini",      symbol:"♊", description:"Curious, adaptable, and quick-witted with a communication gift that borders on supernatural. You can hold two completely contradictory ideas at once, and somehow that's fine. You live in your mind and share it generously.", characters:["Fred & George Weasley","Tony Stark","Tyrion Lannister","Loki"] },
  Cancer:      { label:"Cancer",      symbol:"♋", description:"Deeply intuitive and emotionally intelligent — you feel everything, remember everything, and protect the people you love like it's sacred. Home is everything to you, whether physical or found.", characters:["Samwise Gamgee","Molly Weasley","Peeta Mellark","Beth March"] },
  Leo:         { label:"Leo",         symbol:"♌", description:"Radiant, generous, and born to be at the center of things. You have a natural warmth that draws people in and a dramatic flair that makes every room better. You lead with your heart and expect others to match your loyalty.", characters:["Daenerys Targaryen","Thor","Leslie Knope","Simba"] },
  Virgo:       { label:"Virgo",       symbol:"♍", description:"Precise, analytical, and driven by an internal standard that's almost impossible to meet — and yet you keep trying. You show love through practical acts and have a mind that notices what everyone else overlooks.", characters:["Hermione Granger","Batman","Monica Geller","Captain America"] },
  Libra:       { label:"Libra",       symbol:"♎", description:"Charming, fair-minded, and haunted by the need for balance. You weigh every side so thoroughly that decisions become their own art form. You build beautiful things — relationships, environments, arguments — and make them look effortless.", characters:["Jon Snow","Aang","Atticus Finch","Arwen"] },
  Scorpio:     { label:"Scorpio",     symbol:"♏", description:"Intense, magnetic, and impossible to fully read. You experience everything at maximum depth and never forget a kindness or a betrayal. Your loyalty runs bone-deep and your focus is singular.", characters:["Petyr Baelish","Jessica Jones","Loki","Cersei Lannister"] },
  Sagittarius: { label:"Sagittarius", symbol:"♐", description:"Philosophical, freedom-loving, and endlessly seeking the next horizon. You're the archer aimed at the furthest target — restless, optimistic, and allergic to anything that feels like a cage.", characters:["Jack Sparrow","Aang","Indiana Jones","Bilbo Baggins"] },
  Capricorn:   { label:"Capricorn",   symbol:"♑", description:"Disciplined, strategic, and quietly relentless. You play the long game better than anyone and have an almost inhuman capacity for delayed gratification. Goals are the language you speak most fluently.", characters:["Tywin Lannister","Harvey Specter","Hermione Granger","Nick Fury"] },
  Aquarius:    { label:"Aquarius",    symbol:"♒", description:"Visionary, independent, and deeply committed to ideals larger than yourself. You're ahead of the curve by about a decade and find it alternately fascinating and lonely. You belong to everyone and to yourself.", characters:["Atticus Finch","Luna Lovegood","Morpheus","Professor X"] },
  Pisces:      { label:"Pisces",      symbol:"♓", description:"Imaginative, empathetic, and porous to the emotional weather of every room. You absorb other people's experiences as your own and translate them into something that feels like art. You live in the border between the real and the mythic.", characters:["Frodo Baggins","Luna Lovegood","Remus Lupin","Anne Shirley"] },
};

export function calcZodiac(month: number, day: number): AutoCalcResult {
  let sign = "Capricorn";
  if      ((month===3  && day>=21)||(month===4  && day<=19)) sign="Aries";
  else if ((month===4  && day>=20)||(month===5  && day<=20)) sign="Taurus";
  else if ((month===5  && day>=21)||(month===6  && day<=20)) sign="Gemini";
  else if ((month===6  && day>=21)||(month===7  && day<=22)) sign="Cancer";
  else if ((month===7  && day>=23)||(month===8  && day<=22)) sign="Leo";
  else if ((month===8  && day>=23)||(month===9  && day<=22)) sign="Virgo";
  else if ((month===9  && day>=23)||(month===10 && day<=22)) sign="Libra";
  else if ((month===10 && day>=23)||(month===11 && day<=21)) sign="Scorpio";
  else if ((month===11 && day>=22)||(month===12 && day<=21)) sign="Sagittarius";
  else if ((month===12 && day>=22)||(month===1  && day<=19)) sign="Capricorn";
  else if ((month===1  && day>=20)||(month===2  && day<=18)) sign="Aquarius";
  else if ((month===2  && day>=19)||(month===3  && day<=20)) sign="Pisces";
  const r = ZODIAC[sign];
  return { code: sign, ...r };
}

// ──────────────────────────────────────────────────────────────
// Chinese Zodiac (by birth year)
// ──────────────────────────────────────────────────────────────

const CHINESE_ZODIAC: Record<string, Omit<AutoCalcResult, "code">> = {
  Rat:     { label:"Rat",     symbol:"🐀", description:"Quick-witted, resourceful, and versatile. You're charming in a way that makes everyone feel like they're your favorite. You spot opportunity before others notice it exists.", characters:["Petyr Baelish","Remy (Ratatouille)","Tyrion Lannister","Nick Wilde"] },
  Ox:      { label:"Ox",      symbol:"🐂", description:"Dependable, strong-willed, and quietly relentless. You work hard without needing recognition and follow through on commitments in a way that makes people genuinely count on you.", characters:["Ned Stark","Samwise Gamgee","Captain America","Minerva McGonagall"] },
  Tiger:   { label:"Tiger",   symbol:"🐅", description:"Brave, competitive, and magnetic with a rebellious streak. You make bold moves and carry others with your energy. You don't ask for permission — you ask for forgiveness if needed.", characters:["Daenerys Targaryen","Han Solo","Katniss Everdeen","Wolverine"] },
  Rabbit:  { label:"Rabbit",  symbol:"🐇", description:"Gentle, intuitive, and tactful. You move through the world gracefully and avoid conflict with an artistry that looks effortless. Quietly perceptive and deeply artistic.", characters:["Frodo Baggins","Luna Lovegood","Bilbo Baggins","Aang"] },
  Dragon:  { label:"Dragon",  symbol:"🐉", description:"Charismatic, ambitious, and naturally commanding. You have an outsized presence in any room and a drive that borders on mythic. People are drawn to your energy even when they're not sure why.", characters:["Jon Snow","Daenerys Targaryen","Thor","Aragorn"] },
  Snake:   { label:"Snake",   symbol:"🐍", description:"Wise, enigmatic, and deeply intuitive. You think before you speak, trust your gut, and have a clarity of purpose that others mistake for coldness. You are rarely surprised.", characters:["Petyr Baelish","Hannibal Lecter","Elrond","Loki"] },
  Horse:   { label:"Horse",   symbol:"🐎", description:"Free-spirited, energetic, and impossible to contain. You crave movement, adventure, and independence. People love you for your passion and find your need for freedom alternately inspiring and exhausting.", characters:["Jack Sparrow","Arya Stark","Aang","Rapunzel"] },
  Goat:    { label:"Goat",    symbol:"🐐", description:"Creative, gentle, and deeply empathetic. You feel things fully and express that feeling through art, care, and an attention to beauty that other people notice after you've pointed it out.", characters:["Luna Lovegood","Anne Shirley","Frodo Baggins","Peeta Mellark"] },
  Monkey:  { label:"Monkey",  symbol:"🐒", description:"Clever, playful, and endlessly innovative. You solve problems sideways and make everyone laugh while doing it. You're the one who finds the loophole — and usually it's the right call.", characters:["Fred & George Weasley","Tyrion Lannister","Tony Stark","Deadpool"] },
  Rooster: { label:"Rooster", symbol:"🐓", description:"Observant, hard-working, and deeply meticulous. You notice what's wrong before anyone else and say so directly. You set standards that are high — for yourself first.", characters:["Hermione Granger","Monica Geller","Batman","Stannis Baratheon"] },
  Dog:     { label:"Dog",     symbol:"🐕", description:"Loyal, honest, and reliably good. You're the friend who shows up, tells the truth even when it's uncomfortable, and would give anything for the people you've let in.", characters:["Samwise Gamgee","Ron Weasley","Jim Halpert","Steve Rogers"] },
  Pig:     { label:"Pig",     symbol:"🐖", description:"Generous, sincere, and genuinely kind. You approach life with an open heart and rarely hold grudges. People find you comforting and trustworthy because you have no hidden agenda.", characters:["Samwise Gamgee","Peeta Mellark","Molly Weasley","Neville Longbottom"] },
};

const CHINESE_ANIMALS = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"] as const;

export function calcChineseZodiac(year: number): AutoCalcResult {
  // 1900 is the year of the Rat
  const idx = ((year - 1900) % 12 + 12) % 12;
  const sign = CHINESE_ANIMALS[idx];
  const r = CHINESE_ZODIAC[sign];
  return { code: sign, ...r };
}

// ──────────────────────────────────────────────────────────────
// Life Path Number (Numerology)
// ──────────────────────────────────────────────────────────────

const LIFE_PATH: Record<string, Omit<AutoCalcResult, "code">> = {
  "1":  { label:"Life Path 1 — The Leader",     symbol:"①", description:"Independent, pioneering, and driven. You're here to forge your own path, start things, and lead by example. You have a strong will and a stronger vision.", characters:["Aragorn","Tony Stark","Katniss Everdeen","Daenerys Targaryen"] },
  "2":  { label:"Life Path 2 — The Diplomat",   symbol:"②", description:"Cooperative, sensitive, and gifted at harmony. You build bridges, read rooms, and make the spaces between people smoother. Your strength is in partnership and intuition.", characters:["Samwise Gamgee","Peeta Mellark","Aang","Frodo Baggins"] },
  "3":  { label:"Life Path 3 — The Creator",    symbol:"③", description:"Expressive, joyful, and endlessly creative. You were meant to communicate — through words, art, humor, or performance. Life is at its best when you're making something.", characters:["Fred & George Weasley","Willy Wonka","Jack Sparrow","Rapunzel"] },
  "4":  { label:"Life Path 4 — The Builder",    symbol:"④", description:"Methodical, hardworking, and committed to creating something solid and lasting. You bring structure to chaos and follow through when others have moved on.", characters:["Hermione Granger","Captain America","Ned Stark","Stannis Baratheon"] },
  "5":  { label:"Life Path 5 — The Adventurer", symbol:"⑤", description:"Freedom-loving, curious, and magnetically adaptable. You're wired for change and thrive when you're moving. Your life is a series of chapters, each one richer than the last.", characters:["Bilbo Baggins","Indiana Jones","Aang","Han Solo"] },
  "6":  { label:"Life Path 6 — The Nurturer",   symbol:"⑥", description:"Caring, responsible, and anchored in love. You're the one people come to when they need someone who genuinely has their back. Home, family, and community are sacred to you.", characters:["Molly Weasley","Samwise Gamgee","Alfred Pennyworth","Marge Simpson"] },
  "7":  { label:"Life Path 7 — The Seeker",     symbol:"⑦", description:"Analytical, introspective, and perpetually searching. You ask the questions others are too practical to consider. You live for understanding at depth — science, spirituality, or both.", characters:["Sherlock Holmes","Elrond","Dumbledore","Dr. Strange"] },
  "8":  { label:"Life Path 8 — The Powerhouse", symbol:"⑧", description:"Ambitious, authoritative, and built for impact. You're drawn to positions of influence and have the discipline and drive to get there. Power in service of something real.", characters:["Harvey Specter","Tywin Lannister","Nick Fury","Walter White"] },
  "9":  { label:"Life Path 9 — The Visionary",  symbol:"⑨", description:"Compassionate, idealistic, and globally minded. You care about humanity and feel called to something bigger than personal gain. You let go easily because you know that's how you grow.", characters:["Atticus Finch","Jon Snow","Remus Lupin","Professor X"] },
  "11": { label:"Life Path 11 — The Intuitive", symbol:"⑪", description:"Master Number 11: sensitive, spiritually attuned, and gifted with an intuition that borders on uncanny. You're here to inspire, illuminate, and help others access something deeper. The challenge is trusting yourself.", characters:["Luna Lovegood","Frodo Baggins","Gandalf","Arwen"] },
  "22": { label:"Life Path 22 — The Master Builder", symbol:"⑫", description:"Master Number 22: the most powerful of the life paths. You have the vision of an 11 and the execution of a 4 — the capacity to turn sweeping ideas into concrete reality. The challenge is the weight of your own potential.", characters:["Tony Stark","Dumbledore","Nick Fury","Aragorn"] },
  "33": { label:"Life Path 33 — The Teacher",   symbol:"⑬", description:"Master Number 33: the rarest life path, dedicated entirely to service and upliftment. You carry both compassion and wisdom and are here to raise the vibration of everyone around you. The challenge is not losing yourself in the giving.", characters:["Dumbledore","Samwise Gamgee","Atticus Finch","Gandalf"] },
};

function reduceToSingleDigit(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  if (n < 10) return n;
  const sum = String(n).split("").reduce((acc, d) => acc + parseInt(d), 0);
  return reduceToSingleDigit(sum);
}

export function calcLifePath(year: number, month: number, day: number): AutoCalcResult {
  const raw = year.toString().split("").reduce((a,d)=>a+parseInt(d),0)
    + month + day;
  const num = reduceToSingleDigit(raw);
  const code = String(num);
  const r = LIFE_PATH[code] ?? LIFE_PATH["1"];
  return { code, ...r };
}

// ──────────────────────────────────────────────────────────────
// Human Design Type (simplified: birthday-derived, not ephemeris)
// ──────────────────────────────────────────────────────────────

const HD_TYPES: Record<string, Omit<AutoCalcResult, "code">> = {
  Generator:            { label:"Generator",            symbol:"⚙", description:"The builder. You have sustainable life force energy and are here to respond to what calls to you rather than initiate from scratch. When you're lit up by something, your work is magnetic and your stamina is almost superhuman.", characters:["Samwise Gamgee","Jon Snow","Frodo Baggins","Ron Weasley"] },
  "Manifesting Generator": { label:"Manifesting Generator", symbol:"⚡", description:"The multi-passionate builder. You're a Generator with the speed of a Manifestor — multi-talented, quick-moving, and capable of doing several things brilliantly at once. You respond fast and move faster. Best to skip steps that don't light you up.", characters:["Tony Stark","Hermione Granger","Aang","Katniss Everdeen"] },
  Projector:            { label:"Projector",            symbol:"🔭", description:"The guide. Your gift is seeing people and systems at depth — often better than they see themselves. You're designed to be invited, not to push. When you wait for recognition and then guide, you have a disproportionate impact relative to your energy output.", characters:["Gandalf","Atticus Finch","Tyrion Lannister","Professor X"] },
  Manifestor:           { label:"Manifestor",           symbol:"⚑", description:"The initiator. You have rare power to make things happen from nothing — to act without needing permission and set things in motion that others can't. You're here to inform, not ask. Peace is your signature and impact is your purpose.", characters:["Daenerys Targaryen","Walter White","Frank Underwood","Cersei Lannister"] },
  Reflector:            { label:"Reflector",            symbol:"🌙", description:"The mirror. Rare and lunar, you take in and reflect the energy around you. You're deeply sensitive to your environment and have a unique capacity to see the health of a community. Major decisions need a full lunar cycle — 28 days — to settle.", characters:["Luna Lovegood","Elrond","Yoda","Grandmother Willow"] },
};

// Distribution approximates real HD statistics (weighted by hash of birthday)
export function calcHumanDesign(year: number, month: number, day: number): AutoCalcResult {
  const seed = ((year * 31 + month * 37 + day * 41) % 100 + 100) % 100;
  let code: string;
  if      (seed < 35) code = "Generator";
  else if (seed < 65) code = "Manifesting Generator";
  else if (seed < 85) code = "Projector";
  else if (seed < 93) code = "Manifestor";
  else                code = "Reflector";
  const r = HD_TYPES[code];
  return { code, ...r };
}
