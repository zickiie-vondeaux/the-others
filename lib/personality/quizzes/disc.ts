import type { Quiz, QuizResult, LikertQuestion } from "../types";

// DISC — 4 dimensions × 5 questions = 20 questions
// D=Dominance, I=Influence, S=Steadiness, C=Conscientiousness
const questions: LikertQuestion[] = [
  // Dominance
  { id:"d1", type:"likert", text:"When something needs to be decided, you'd rather make the call yourself than wait for consensus.", dimension:"D" },
  { id:"d2", type:"likert", text:"You push back on authority when you think they're wrong, even if it's uncomfortable.", dimension:"D" },
  { id:"d3", type:"likert", text:"In a new challenge, you focus on winning — you're competitive and driven by results.", dimension:"D" },
  { id:"d4", type:"likert", text:"You have little patience for lengthy discussions when the answer seems obvious to you.", dimension:"D" },
  { id:"d5", type:"likert", text:"Obstacles energize rather than discourage you — they're puzzles to break through.", dimension:"D" },
  // Influence
  { id:"i1", type:"likert", text:"You naturally draw people in — you can talk to anyone, and they tend to enjoy it.", dimension:"I" },
  { id:"i2", type:"likert", text:"You're genuinely enthusiastic and optimistic, even in situations where others are cautious.", dimension:"I" },
  { id:"i3", type:"likert", text:"You're good at rallying people around an idea — you can get a room excited.", dimension:"I" },
  { id:"i4", type:"likert", text:"People have told you that you're persuasive — you know how to make something appealing.", dimension:"I" },
  { id:"i5", type:"likert", text:"You process out loud and enjoy brainstorming with a group rather than thinking solo.", dimension:"I" },
  // Steadiness
  { id:"s1", type:"likert", text:"Sudden changes in plans or priorities genuinely disrupt your rhythm.", dimension:"S" },
  { id:"s2", type:"likert", text:"You're the person your group leans on for calm, consistent support.", dimension:"S" },
  { id:"s3", type:"likert", text:"You take your time making decisions because you want stability, not speed.", dimension:"S" },
  { id:"s4", type:"likert", text:"Loyalty matters deeply to you — you invest in relationships over time and expect the same.", dimension:"S" },
  { id:"s5", type:"likert", text:"You'd rather do one thing thoroughly than five things quickly.", dimension:"S" },
  // Conscientiousness
  { id:"c1", type:"likert", text:"You research thoroughly before deciding — you want the facts before committing.", dimension:"C" },
  { id:"c2", type:"likert", text:"Quality matters more than speed to you — you'd rather be right than be first.", dimension:"C" },
  { id:"c3", type:"likert", text:"You follow established systems and processes because they exist for a reason.", dimension:"C" },
  { id:"c4", type:"likert", text:"You set high standards for your own work and are self-critical when you fall short.", dimension:"C" },
  { id:"c5", type:"likert", text:"When others are sloppy with details, it frustrates you — precision matters.", dimension:"C" },
];

const RESULTS: Record<string, Omit<QuizResult, "code" | "data">> = {
  D: { label:"Dominance", description:"Results-driven and direct, you lead with confidence and decisiveness. You thrive in positions of authority, move fast, and have zero patience for inefficiency. You challenge the status quo and push through obstacles that stop others cold. Your growth edge: slow down long enough to bring people with you.", characters:["Harvey Specter","Tywin Lannister","Walter White","Ellen Ripley"] },
  I: { label:"Influence", description:"Magnetic, enthusiastic, and naturally persuasive. You energize rooms, make connections easily, and are gifted at getting people excited about ideas. You thrive on collaboration and move fast on feelings and possibilities. Your growth edge: following through when the excitement fades.", characters:["Tony Stark","Aang","Jack Sparrow","Effie Trinket"] },
  S: { label:"Steadiness", description:"Calm, consistent, and deeply reliable. You're the anchor — the person your team counts on when things get chaotic. You build trust slowly and hold it tightly. You care about people deeply and prefer a stable, predictable environment where everyone feels secure. Your growth edge: embracing necessary change before it's forced on you.", characters:["Samwise Gamgee","Jim Halpert","Peeta Mellark","Marge Simpson"] },
  C: { label:"Conscientiousness", description:"Precise, systematic, and standards-driven. You do the homework, think through the details, and produce work that's genuinely difficult to criticize. You value accuracy over speed and quality over approval. Your growth edge: accepting that good enough is sometimes genuinely good enough.", characters:["Sherlock Holmes","Hermione Granger","Dr. House","Stannis Baratheon"] },
};

export const discQuiz: Quiz = {
  slug: "disc",
  name: "DISC",
  shortName: "DISC",
  description: "Understand your behavioral style across four core dimensions.",
  icon: "◎",
  questionCount: questions.length,
  isAutoCalc: false,
  questions,
  calculate(answers) {
    const scores: Record<string, number> = { D:0, I:0, S:0, C:0 };
    questions.forEach(q => {
      const a = answers[q.id];
      if (a === undefined) return;
      scores[q.dimension] = (scores[q.dimension] ?? 0) + a;
    });
    const code = (Object.entries(scores) as [string,number][]).sort((a,b) => b[1]-a[1])[0][0];
    const r = RESULTS[code];
    return { code, label: r.label, description: r.description, characters: r.characters, data: scores };
  },
};
