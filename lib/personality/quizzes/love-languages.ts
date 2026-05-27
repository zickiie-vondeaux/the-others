import type { Quiz, QuizResult, ChoiceQuestion } from "../types";

// Each question forces a choice between two love languages.
// options[].dimension maps to: W=Words, S=Service, G=Gifts, Q=Quality Time, T=Touch
const questions: ChoiceQuestion[] = [
  { id:"ll1",  type:"choice", text:"When someone makes you feel most loved, it's usually because...", options:[{ text:"They said exactly the right thing at the right moment",dimension:"W" },{ text:"They remembered something you needed and just handled it",dimension:"S" }] },
  { id:"ll2",  type:"choice", text:"After a tough week, what would mean the most to you?", options:[{ text:"Your person sending a long, heartfelt message about why you matter to them",dimension:"W" },{ text:"An unexpected small gift that shows they were thinking of you",dimension:"G" }] },
  { id:"ll3",  type:"choice", text:"The most romantic thing a partner can do is...", options:[{ text:"Plan an evening where their phone stays away and you have their full attention",dimension:"Q" },{ text:"Reach for your hand in public — small physical moments",dimension:"T" }] },
  { id:"ll4",  type:"choice", text:"When a close friend shows up for you, the thing that sticks is...", options:[{ text:"They dropped everything to spend time with you",dimension:"Q" },{ text:"They quietly handled something so you didn't have to",dimension:"S" }] },
  { id:"ll5",  type:"choice", text:"You feel most appreciated at work when someone...", options:[{ text:"Calls out your contribution in front of others",dimension:"W" },{ text:"Covers for you without being asked when you're slammed",dimension:"S" }] },
  { id:"ll6",  type:"choice", text:"A small gesture that would genuinely light you up:", options:[{ text:"A handwritten note saying what you mean to them",dimension:"W" },{ text:"A spontaneous hug when you're stressed",dimension:"T" }] },
  { id:"ll7",  type:"choice", text:"On your birthday, the thing that would hit hardest:", options:[{ text:"A thoughtful gift they clearly spent time finding — not just the first thing on Amazon",dimension:"G" },{ text:"Your favorite people clearing their schedules just to celebrate you",dimension:"Q" }] },
  { id:"ll8",  type:"choice", text:"When someone picks up on how you're feeling before you say anything, what do you want most?", options:[{ text:"For them to physically be there — sitting with you, a hand on your shoulder",dimension:"T" },{ text:"For them to take something off your plate so you can breathe",dimension:"S" }] },
  { id:"ll9",  type:"choice", text:"In a long-distance relationship, the thing that would keep you feeling connected:", options:[{ text:"Long voice messages, texts that show they're thinking about you",dimension:"W" },{ text:"A care package arriving when you needed it most",dimension:"G" }] },
  { id:"ll10", type:"choice", text:"After an argument, what helps you feel like you're okay again?", options:[{ text:"Hearing them say clearly what you mean to them",dimension:"W" },{ text:"Just being near them again — presence, not performance",dimension:"T" }] },
  { id:"ll11", type:"choice", text:"The sign that someone really cares is when they...", options:[{ text:"Remember a small thing you mentioned weeks ago and bring it back",dimension:"G" },{ text:"Carve out undivided time for you, no distractions",dimension:"Q" }] },
  { id:"ll12", type:"choice", text:"You feel the most emotionally safe when someone...", options:[{ text:"Tells you openly how much you mean to them",dimension:"W" },{ text:"Is physically affectionate — it reassures you without words",dimension:"T" }] },
  { id:"ll13", type:"choice", text:"Which act of love hits you hardest on a random Tuesday?", options:[{ text:"They did the errand you'd been dreading without being asked",dimension:"S" },{ text:"They brought you something small — just because they saw it and thought of you",dimension:"G" }] },
  { id:"ll14", type:"choice", text:"What makes you feel deeply known by someone?", options:[{ text:"They give you their complete, unhurried presence",dimension:"Q" },{ text:"They do something for you that shows they really listened",dimension:"S" }] },
  { id:"ll15", type:"choice", text:"A relationship milestone that matters most to you:", options:[{ text:"Being physically welcomed — the way they hold you when you reunite",dimension:"T" },{ text:"A meaningful, specific gift that marks the occasion",dimension:"G" }] },
];

const RESULTS: Record<string, Omit<QuizResult, "code" | "data">> = {
  W: { label:"Words of Affirmation", description:"Language is your love currency. Genuine compliments, heartfelt messages, and being told explicitly what you mean to someone — that's what lands deepest. You can tolerate almost anything if you feel verbally appreciated, and criticism cuts harder than people realize.", characters:["Leslie Knope","Anne Shirley","Peeta Mellark","Lorelai Gilmore"] },
  S: { label:"Acts of Service", description:"You feel loved through action. Someone showing up and handling something — not because they had to, but because they could see you needed it — that says everything words can't. You value effort over expression, and you show love the same way you receive it.", characters:["Samwise Gamgee","Alfred Pennyworth","Molly Weasley","Sam Wilson"] },
  G: { label:"Receiving Gifts", description:"It's not about the price — it's about the proof. A gift says: I was thinking about you when you weren't there. You remember who gives you things that are specific and thoughtful, and you treasure the meaning behind them long after the moment passes.", characters:["Bilbo Baggins","Donna Meagle","Daisy Buchanan","Howard Stark"] },
  Q: { label:"Quality Time", description:"Undivided, intentional presence is everything to you. When someone makes you feel like the only person in the room — not just physically but mentally — that's when you feel genuinely loved. Distraction during time together stings more than most people understand.", characters:["Jon Snow","Frodo Baggins","Aziz Ansari's Dev","Pam Beesly"] },
  T: { label:"Physical Touch", description:"Connection for you is physical before it's verbal. A hand on the shoulder, a long hug, someone leaning in when you're talking — these aren't extras, they're how you know you're safe. Distance — emotional or physical — hits you harder than most.", characters:["Ron Weasley","Monica Geller","Thor","Neville Longbottom"] },
};

export const loveLanguagesQuiz: Quiz = {
  slug: "love_languages",
  name: "Love Languages",
  shortName: "Love Lang.",
  description: "Discover how you give and receive love across 5 dimensions.",
  icon: "💬",
  questionCount: questions.length,
  isAutoCalc: false,
  questions,
  calculate(answers) {
    const scores: Record<string, number> = { W:0, S:0, G:0, Q:0, T:0 };
    questions.forEach(q => {
      const a = answers[q.id];
      if (a === undefined) return;
      const chosen = q.options[a];
      if (chosen) scores[chosen.dimension] = (scores[chosen.dimension] ?? 0) + 1;
    });
    const code = (Object.entries(scores) as [string,number][]).sort((a,b) => b[1]-a[1])[0][0];
    const r = RESULTS[code];
    return { code, label: r.label, description: r.description, characters: r.characters, data: scores };
  },
};
