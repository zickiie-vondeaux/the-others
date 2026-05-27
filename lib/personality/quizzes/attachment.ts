import type { Quiz, QuizResult, LikertQuestion } from "../types";

// 4 styles × 4 questions = 16 total
// Dimensions: SEC=Secure, ANX=Anxious, AVD=Avoidant, FEA=Fearful-Avoidant
const questions: LikertQuestion[] = [
  // Secure
  { id:"at1", type:"likert", text:"You're comfortable depending on people you're close to and letting them depend on you.", dimension:"SEC" },
  { id:"at2", type:"likert", text:"In relationships, you're generally confident in your worth and in the other person's intentions.", dimension:"SEC" },
  { id:"at3", type:"likert", text:"When a close friend or partner needs space, you give it without reading it as rejection.", dimension:"SEC" },
  { id:"at4", type:"likert", text:"You can communicate your needs directly without much fear of how it'll land.", dimension:"SEC" },
  // Anxious
  { id:"at5", type:"likert", text:"When someone doesn't respond quickly, your mind starts generating reasons they might be pulling away.", dimension:"ANX" },
  { id:"at6", type:"likert", text:"You often want more closeness than others seem comfortable with.", dimension:"ANX" },
  { id:"at7", type:"likert", text:"You worry that people you care about don't value you as much as you value them.", dimension:"ANX" },
  { id:"at8", type:"likert", text:"Conflict in close relationships is distressing enough that you'll often over-apologize just to resolve it.", dimension:"ANX" },
  // Avoidant
  { id:"at9",  type:"likert", text:"You tend to feel suffocated when someone gets too emotionally dependent on you.", dimension:"AVD" },
  { id:"at10", type:"likert", text:"You prefer handling difficult emotions alone rather than bringing them to someone else.", dimension:"AVD" },
  { id:"at11", type:"likert", text:"Deep vulnerability in relationships makes you want to pull back rather than lean in.", dimension:"AVD" },
  { id:"at12", type:"likert", text:"You value your self-sufficiency highly — needing others feels like a weakness.", dimension:"AVD" },
  // Fearful-Avoidant (Disorganized)
  { id:"at13", type:"likert", text:"You want deep connection but also feel a pull to push people away as things get closer.", dimension:"FEA" },
  { id:"at14", type:"likert", text:"You find yourself in a pattern of getting close to someone, then finding reasons to distance.", dimension:"FEA" },
  { id:"at15", type:"likert", text:"Trusting people fully feels genuinely dangerous, even when they've given you no reason not to.", dimension:"FEA" },
  { id:"at16", type:"likert", text:"You have a fear that if people really knew you, they'd leave — so you test them or keep them at arm's length.", dimension:"FEA" },
];

const RESULTS: Record<string, Omit<QuizResult, "code" | "data">> = {
  SEC: { label:"Secure", description:"You bring a baseline of ease to relationships. You're comfortable with closeness and equally comfortable with independence — neither threatens you. You communicate needs clearly, handle conflict without catastrophizing, and tend to draw secure behavior out of the people around you. This is the style that's been shown to correlate most with long-term relationship satisfaction.", characters:["Samwise Gamgee","Steve Rogers","Marge Simpson","Arthur Weasley"] },
  ANX: { label:"Anxious (Preoccupied)", description:"You crave closeness and often feel like you need more reassurance than others seem to give. Your attachment system is on high alert — you're very attuned to shifts in connection and can misread neutral signals as withdrawal. The work is learning to regulate from within rather than seeking external validation first.", characters:["Ross Geller","Anakin Skywalker","Jane Bennet","Rory Gilmore"] },
  AVD: { label:"Avoidant (Dismissive)", description:"Independence is your default and emotional dependency — in yourself or others — makes you uncomfortable. You've learned to self-regulate well but may keep people at arm's length without realizing it. Intimacy at depth can feel like a threat to your autonomy. The growth is recognizing that need and connection are human, not weakness.", characters:["Jon Snow","Mr. Darcy","Sherlock Holmes","Arya Stark"] },
  FEA: { label:"Fearful-Avoidant (Disorganized)", description:"You want deep connection and are terrified of it at the same time. Close relationships trigger both longing and alarm — so you oscillate between pursuit and withdrawal, often confusing the people you care about most. This style often grows from experiences where the source of comfort was also a source of fear. With awareness and support, it's one of the most transformable patterns.", characters:["Daenerys Targaryen","Jaime Lannister","Elliot Alderson","Eleanor Shellstrop"] },
};

export const attachmentQuiz: Quiz = {
  slug: "attachment",
  name: "Attachment Style",
  shortName: "Attachment",
  description: "Understand your attachment patterns in close relationships.",
  icon: "🔗",
  questionCount: questions.length,
  isAutoCalc: false,
  questions,
  calculate(answers) {
    const scores: Record<string, number> = { SEC:0, ANX:0, AVD:0, FEA:0 };
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
