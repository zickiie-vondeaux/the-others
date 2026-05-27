import type { Quiz, QuizResult, LikertQuestion } from "../types";

// OCEAN — 5 questions per trait, some reversed (score = 6 - answer for reversed)
const questions: LikertQuestion[] = [
  // Openness
  { id:"o1", type:"likert", text:"You're drawn to abstract ideas, unconventional art, and exploring things most people overlook.", dimension:"O" },
  { id:"o2", type:"likert", text:"Given the choice, you'd rather try a wildly new experience than a comfortable familiar one.", dimension:"O" },
  { id:"o3", type:"likert", text:"You have a vivid imagination and an active inner life.", dimension:"O" },
  { id:"o4", type:"likert", text:"You find most creative or artistic pursuits uninteresting.", dimension:"O", reversed:true },
  { id:"o5", type:"likert", text:"You love diving into philosophical or theoretical questions — even when there's no practical answer.", dimension:"O" },
  // Conscientiousness
  { id:"c1", type:"likert", text:"You keep your commitments, even when it's inconvenient.", dimension:"C" },
  { id:"c2", type:"likert", text:"You plan ahead and prefer to have things settled well before a deadline.", dimension:"C" },
  { id:"c3", type:"likert", text:"You tend to leave tasks unfinished and move on before tidying up.", dimension:"C", reversed:true },
  { id:"c4", type:"likert", text:"You pay close attention to details and notice when something's off.", dimension:"C" },
  { id:"c5", type:"likert", text:"Your space and schedule tend to be organized — chaos makes it hard for you to function.", dimension:"C" },
  // Extraversion
  { id:"e1", type:"likert", text:"Being around people energizes you — the more, the better.", dimension:"E" },
  { id:"e2", type:"likert", text:"You naturally take the lead in social situations.", dimension:"E" },
  { id:"e3", type:"likert", text:"You'd describe yourself as reserved and quiet, especially around new people.", dimension:"E", reversed:true },
  { id:"e4", type:"likert", text:"You love meeting strangers and find social situations exciting.", dimension:"E" },
  { id:"e5", type:"likert", text:"Long stretches of solitude leave you feeling flat or restless.", dimension:"E" },
  // Agreeableness
  { id:"a1", type:"likert", text:"You genuinely enjoy helping others, even at a cost to yourself.", dimension:"A" },
  { id:"a2", type:"likert", text:"You tend to see the best in people and give them the benefit of the doubt.", dimension:"A" },
  { id:"a3", type:"likert", text:"You're competitive and have no problem letting people know when you disagree.", dimension:"A", reversed:true },
  { id:"a4", type:"likert", text:"You go out of your way to avoid conflict and keep things harmonious.", dimension:"A" },
  { id:"a5", type:"likert", text:"You're empathetic — other people's emotions genuinely affect you.", dimension:"A" },
  // Neuroticism
  { id:"n1", type:"likert", text:"You worry a lot, especially about things that might go wrong.", dimension:"N" },
  { id:"n2", type:"likert", text:"Your mood shifts noticeably based on what's happening around you.", dimension:"N" },
  { id:"n3", type:"likert", text:"You stay calm and even-keeled under pressure.", dimension:"N", reversed:true },
  { id:"n4", type:"likert", text:"Minor frustrations can leave you feeling anxious or upset longer than you'd like.", dimension:"N" },
  { id:"n5", type:"likert", text:"You're often self-critical after social interactions, replaying what you said or did.", dimension:"N" },
];

// Big Five returns a profile, not a single type. We generate a label based on the dominant pattern.
function getLabel(scores: Record<string, number>): { code: string; label: string; description: string; characters: string[] } {
  const levels: Record<string, "H"|"M"|"L"> = {};
  for (const [k, v] of Object.entries(scores)) {
    levels[k] = v >= 18 ? "H" : v >= 12 ? "M" : "L";
  }
  const code = `O:${levels.O} C:${levels.C} E:${levels.E} A:${levels.A} N:${levels.N}`;

  // High O + High C
  if (levels.O === "H" && levels.C === "H" && levels.E !== "H")
    return { code, label:"The Visionary Architect", description:"You combine imaginative thinking with disciplined execution — a rare pairing that lets you turn ambitious ideas into reality. You work best with space to think and clear goals to chase.", characters:["Tony Stark","Hermione Granger","Atticus Finch","Dr. Strange"] };
  if (levels.O === "H" && levels.E === "H" && levels.A === "H")
    return { code, label:"The Creative Connector", description:"Curious, warm, and energetic — you live for new ideas and new people. You're at your best in dynamic environments where you can collaborate and create.", characters:["Aang","Willy Wonka","Robin Williams","Rapunzel"] };
  if (levels.E === "H" && levels.A === "H" && levels.C === "H")
    return { code, label:"The Natural Leader", description:"Organized, warm, and naturally social. You bring people together and make things happen. You're the person others look to when something needs to get done — and get done right.", characters:["Captain America","Leslie Knope","Samwise Gamgee","Professor Dumbledore"] };
  if (levels.E === "H" && levels.N === "H")
    return { code, label:"The Passionate Performer", description:"Expressive, intense, and magnetic. Your emotional range is broad and you bring enormous energy to everything you touch — which makes you both thrilling and occasionally overwhelming.", characters:["Daenerys Targaryen","Freddie Mercury","Nina Sayers","Anakin Skywalker"] };
  if (levels.O === "H" && levels.N === "H" && levels.A === "L")
    return { code, label:"The Turbulent Thinker", description:"Intellectually restless and emotionally complex. You're drawn to ideas that challenge and unsettle — your mind is rarely quiet. This intensity fuels your creativity and your critical eye.", characters:["Hamlet","Sherlock Holmes","BoJack Horseman","Elliot Alderson"] };
  if (levels.C === "H" && levels.A === "H" && levels.O === "L")
    return { code, label:"The Dependable Guardian", description:"Steady, loyal, and quietly essential. You show up, follow through, and make sure everyone around you is okay. People count on you because you've never given them a reason not to.", characters:["Ned Stark","Sam Wilson","Samwise Gamgee","Beth March"] };
  if (levels.E === "L" && levels.O === "H")
    return { code, label:"The Deep Observer", description:"Quiet but rich on the inside. You don't need the spotlight — you're too busy noticing what everyone else misses. Your insights are precise and your inner world is vast.", characters:["Sherlock Holmes","Arwen","Remus Lupin","Elrond"] };
  if (levels.A === "L" && levels.C === "H" && levels.E === "H")
    return { code, label:"The Strategic Operator", description:"Driven, direct, and effective. You don't waste time on niceties when there's work to be done — you're here to win, and you're usually right about how to do it.", characters:["Harvey Specter","Tywin Lannister","Cersei Lannister","Frank Underwood"] };
  // fallback
  const dominant = (Object.entries(scores) as [string,number][]).sort((a,b) => b[1]-a[1])[0][0];
  const labels: Record<string,{label:string;description:string;characters:string[]}> = {
    O: { label:"The Explorer", description:"Imaginative, curious, and open to experience. You're drawn to complexity and originality, and you find routine genuinely constraining.", characters:["Bilbo Baggins","Jack Sparrow","Luna Lovegood","The Doctor"] },
    C: { label:"The Architect", description:"Disciplined, reliable, and focused on doing things right. You set high standards and follow through with the kind of consistency others admire.", characters:["Hermione Granger","Captain America","Stannis Baratheon","Minerva McGonagall"] },
    E: { label:"The Connector", description:"Social, energetic, and at your best surrounded by people. You thrive in the middle of the action and bring warmth wherever you go.", characters:["Joey Tribbiani","Aang","Monica Geller","Donna Meagle"] },
    A: { label:"The Empath", description:"Warm, cooperative, and genuinely other-focused. You pick up on what people need and act on it — often before they even ask.", characters:["Frodo Baggins","Peeta Mellark","Beth March","Samwise Gamgee"] },
    N: { label:"The Sensitive", description:"Emotionally attuned and deeply feeling. You experience the world vividly — highs and lows alike — and that sensitivity is both your superpower and your challenge.", characters:["Anakin Skywalker","Anne Shirley","Rory Gilmore","Will Graham"] },
  };
  return { code, ...labels[dominant] };
}

export const bigFiveQuiz: Quiz = {
  slug: "big_five",
  name: "Big Five",
  shortName: "Big Five",
  description: "Map your personality across the five core dimensions of human character.",
  icon: "⬠",
  questionCount: questions.length,
  isAutoCalc: false,
  questions,
  calculate(answers) {
    const raw: Record<string, number> = { O:0, C:0, E:0, A:0, N:0 };
    questions.forEach(q => {
      let a = answers[q.id];
      if (a === undefined) return;
      if (q.reversed) a = 6 - a;
      raw[q.dimension] = (raw[q.dimension] ?? 0) + a;
    });
    const { code, label, description, characters } = getLabel(raw);
    return { code, label, description, characters, data: raw };
  },
};
