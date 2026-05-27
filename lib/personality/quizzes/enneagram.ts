import type { Quiz, QuizResult, LikertQuestion } from "../types";

// 1–5 scale (Strongly Disagree → Strongly Agree); higher = more like that type
const questions: LikertQuestion[] = [
  // Type 1 — The Reformer
  { id:"e1a", type:"likert", text:"When something is done sloppily, it genuinely bothers you — you'd rather redo it right.", dimension:"1" },
  { id:"e1b", type:"likert", text:"You have a strong internal sense of right and wrong that guides most of your decisions.", dimension:"1" },
  // Type 2 — The Helper
  { id:"e2a", type:"likert", text:"You feel most alive when you're needed — helping others gives you a deep sense of purpose.", dimension:"2" },
  { id:"e2b", type:"likert", text:"You're highly tuned in to what other people need, often before they say it out loud.", dimension:"2" },
  // Type 3 — The Achiever
  { id:"e3a", type:"likert", text:"Being successful — and being seen as successful — matters a lot to you.", dimension:"3" },
  { id:"e3b", type:"likert", text:"You naturally adapt how you present yourself depending on who you're with to make the best impression.", dimension:"3" },
  // Type 4 — The Individualist
  { id:"e4a", type:"likert", text:"You often feel like something essential is missing in your life that others seem to just have.", dimension:"4" },
  { id:"e4b", type:"likert", text:"Your emotions are intense and complex — you experience highs and lows more deeply than most.", dimension:"4" },
  // Type 5 — The Investigator
  { id:"e5a", type:"likert", text:"You need to fully understand something before you feel comfortable acting on it.", dimension:"5" },
  { id:"e5b", type:"likert", text:"You guard your time, energy, and personal space fiercely — social obligations often drain you.", dimension:"5" },
  // Type 6 — The Loyalist
  { id:"e6a", type:"likert", text:"You often think through worst-case scenarios so you're prepared if things go wrong.", dimension:"6" },
  { id:"e6b", type:"likert", text:"Trust is hard to earn with you, but once someone earns it, you're fiercely loyal to them.", dimension:"6" },
  // Type 7 — The Enthusiast
  { id:"e7a", type:"likert", text:"You're constantly thinking about the next exciting thing — boredom is one of your biggest fears.", dimension:"7" },
  { id:"e7b", type:"likert", text:"You tend to reframe negative situations positively and keep options open to avoid feeling trapped.", dimension:"7" },
  // Type 8 — The Challenger
  { id:"e8a", type:"likert", text:"You go after what you want directly — you have little patience for manipulation or weakness.", dimension:"8" },
  { id:"e8b", type:"likert", text:"Protecting the people you care about is a core drive — you're not afraid to be the heavy if you have to.", dimension:"8" },
  // Type 9 — The Peacemaker
  { id:"e9a", type:"likert", text:"You avoid conflict by default — you'd rather go along than cause tension, even when you disagree.", dimension:"9" },
  { id:"e9b", type:"likert", text:"You can see all sides of an argument so clearly that it's hard to take a strong personal stance.", dimension:"9" },
];

const RESULTS: Record<string, Omit<QuizResult, "code" | "data">> = {
  "1": { label:"The Reformer", description:"Principled and purposeful with an intense inner drive toward integrity. You hold yourself (and others) to high standards and genuinely believe the world can be better — if people would just do things right. Your greatest strength is your moral compass; your edge is learning to accept imperfection.", characters:["Ned Stark","Captain America","Hermione Granger","Batman"] },
  "2": { label:"The Helper", description:"Warm, generous, and deeply attuned to the people around you. You give freely and often — but sometimes lose track of your own needs in the process. You're the person people call when they need someone who truly cares. The challenge: receiving as graciously as you give.", characters:["Samwise Gamgee","Molly Weasley","Alfred Pennyworth","Beth March"] },
  "3": { label:"The Achiever", description:"Ambitious, magnetic, and endlessly driven. You have a remarkable ability to become whoever the room needs you to be — and to make it look effortless. Success isn't just a goal for you; it feels like identity. The work is learning what you want when no one is watching.", characters:["Tony Stark","Jay Gatsby","Miranda Priestly","Frank Underwood"] },
  "4": { label:"The Individualist", description:"Deeply feeling, intensely creative, and acutely aware of your own uniqueness. You experience life more vividly than most — the beauty and the ache of it. You're searching for authentic self-expression and connection. The trap is romanticizing what's missing instead of embracing what's here.", characters:["Anakin Skywalker","Anne Shirley","Daenerys Targaryen","Hamlet"] },
  "5": { label:"The Investigator", description:"Perceptive, curious, and quietly brilliant. You need to understand things at depth before you act — which means your observations are often startlingly accurate. You protect your inner world fiercely and recharge in solitude. The growth edge: sharing your insights before they're perfect.", characters:["Sherlock Holmes","Hannibal Lecter","Elrond","Dr. House"] },
  "6": { label:"The Loyalist", description:"Trustworthy, responsible, and deeply committed to the people and systems that keep the world stable. You prepare for problems before they happen, and when you trust someone, that loyalty runs bone-deep. The challenge is managing the anxiety of a world that's genuinely uncertain.", characters:["Ron Weasley","Bilbo Baggins","Jim Halpert","Neville Longbottom"] },
  "7": { label:"The Enthusiast", description:"Spontaneous, optimistic, and energized by possibilities. You bring joy into every room and are wired to find the upside in almost anything. Life is an adventure and you want to experience all of it. The shadow work: sitting with discomfort long enough to let it teach you something.", characters:["Jack Sparrow","Aang","Peter Pan","Tyrion Lannister"] },
  "8": { label:"The Challenger", description:"Bold, decisive, and magnetic in a way that makes rooms shift when you walk in. You have zero tolerance for weakness or deception and a fierce instinct to protect what's yours. Power feels natural to you. The depth is letting people see your vulnerability — it doesn't make you weak.", characters:["Walter White","Daenerys Targaryen","The Hound","Alastor 'Mad-Eye' Moody"] },
  "9": { label:"The Peacemaker", description:"Accepting, supportive, and naturally gifted at seeing every side of a situation without judgment. You create harmony wherever you go and help people feel truly heard. The cost can be losing your own voice in the process — your needs matter too.", characters:["Frodo Baggins","Obi-Wan Kenobi","Peeta Mellark","Aang"] },
};

export const enneagramQuiz: Quiz = {
  slug: "enneagram",
  name: "Enneagram",
  shortName: "Enneagram",
  description: "Discover your core personality type across 9 archetypes.",
  icon: "⬡",
  questionCount: questions.length,
  isAutoCalc: false,
  questions,
  calculate(answers) {
    const scores: Record<string, number> = { "1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0 };
    questions.forEach(q => {
      const a = answers[q.id];
      if (a === undefined) return;
      scores[q.dimension] = (scores[q.dimension] ?? 0) + a;
    });
    const code = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];
    const r = RESULTS[code];
    return { code, label: r.label, description: r.description, characters: r.characters, data: scores };
  },
};
