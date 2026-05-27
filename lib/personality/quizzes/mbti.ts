import type { Quiz, QuizResult, BinaryQuestion } from "../types";

// 0 = first option (E/S/T/J), 1 = second option (I/N/F/P)
const questions: BinaryQuestion[] = [
  // E/I
  { id:"ei1", type:"binary", text:"When you need to recharge after a rough week, you prefer to...", dimension:"EI", options:[{text:"Make plans with friends — people give you energy",value:0},{text:"Have time completely alone to decompress",value:1}] },
  { id:"ei2", type:"binary", text:"In a group project, you naturally...", dimension:"EI", options:[{text:"Take charge of keeping everyone connected",value:0},{text:"Work independently and check in when needed",value:1}] },
  { id:"ei3", type:"binary", text:"At a large social gathering, you tend to...", dimension:"EI", options:[{text:"Feel energized and enjoy meeting new people",value:0},{text:"Feel drained and stick to a few people you know",value:1}] },
  { id:"ei4", type:"binary", text:"When something exciting happens, your first instinct is to...", dimension:"EI", options:[{text:"Tell everyone immediately",value:0},{text:"Sit with it yourself before sharing",value:1}] },
  { id:"ei5", type:"binary", text:"You'd describe yourself more as...", dimension:"EI", options:[{text:"Someone who draws energy from being around people",value:0},{text:"Someone who needs alone time to feel like themselves",value:1}] },
  // S/N
  { id:"sn1", type:"binary", text:"When you start a new game, you...", dimension:"SN", options:[{text:"Follow the tutorial step by step",value:0},{text:"Skip it and figure things out as you go",value:1}] },
  { id:"sn2", type:"binary", text:"You're more drawn to...", dimension:"SN", options:[{text:"What is real, concrete, and proven",value:0},{text:"What could be, hidden patterns, and possibilities",value:1}] },
  { id:"sn3", type:"binary", text:"When building a plan, you focus on...", dimension:"SN", options:[{text:"The specific steps required right now",value:0},{text:"The big picture and future potential",value:1}] },
  { id:"sn4", type:"binary", text:"You trust more...", dimension:"SN", options:[{text:"Your direct experience and hard evidence",value:0},{text:"Your gut instincts and hunches",value:1}] },
  { id:"sn5", type:"binary", text:"Reading lore or backstory, you...", dimension:"SN", options:[{text:"Follow the main story carefully",value:0},{text:"Theorize about hidden meanings and what it implies",value:1}] },
  // T/F
  { id:"tf1", type:"binary", text:"A teammate makes a major error that costs the match. You...", dimension:"TF", options:[{text:"Point out exactly what went wrong tactically",value:0},{text:"Make sure they don't feel terrible first",value:1}] },
  { id:"tf2", type:"binary", text:"Making a tough call, you rely on...", dimension:"TF", options:[{text:"Logic and what makes the most objective sense",value:0},{text:"Your values and how it'll affect the people involved",value:1}] },
  { id:"tf3", type:"binary", text:"In a disagreement, you care more about...", dimension:"TF", options:[{text:"Being right and accurate",value:0},{text:"Keeping the peace and understanding each other",value:1}] },
  { id:"tf4", type:"binary", text:"When giving feedback, you tend to...", dimension:"TF", options:[{text:"Be direct and honest even if it's hard to hear",value:0},{text:"Lead with encouragement and soften the criticism",value:1}] },
  { id:"tf5", type:"binary", text:"You're more bothered by...", dimension:"TF", options:[{text:"Something that's logically inconsistent or unfair",value:0},{text:"Someone being treated poorly or left out",value:1}] },
  // J/P
  { id:"jp1", type:"binary", text:"Before a game night, you prefer...", dimension:"JP", options:[{text:"Knowing in advance what you're playing",value:0},{text:"Deciding spontaneously when everyone shows up",value:1}] },
  { id:"jp2", type:"binary", text:"Your backlog / to-do list is usually...", dimension:"JP", options:[{text:"Organized — you finish before starting something new",value:0},{text:"A creative chaos with many things going at once",value:1}] },
  { id:"jp3", type:"binary", text:"Deadlines...", dimension:"JP", options:[{text:"Keep you on track and you rarely miss them",value:0},{text:"Are guidelines you sometimes stretch",value:1}] },
  { id:"jp4", type:"binary", text:"You prefer decisions to be...", dimension:"JP", options:[{text:"Finalized and settled",value:0},{text:"Kept open as long as reasonably possible",value:1}] },
  { id:"jp5", type:"binary", text:"Facing a new situation, you...", dimension:"JP", options:[{text:"Make a plan and execute it",value:0},{text:"Adapt on the fly and see where it goes",value:1}] },
];

const RESULTS: Record<string, Omit<QuizResult, "code" | "data">> = {
  INTJ: { label:"The Architect", description:"Strategic, independent, and intensely private. You see the world as a system to be optimized and have a relentless drive to turn your visions into reality. You hold yourself and others to exacting standards.", characters:["Petyr Baelish","Dr. Strange","Light Yagami","Gandalf"] },
  INTP: { label:"The Logician", description:"Quietly brilliant and endlessly curious. You're driven by a need to understand how everything works and can't help spotting the inconsistency everyone else missed. Logic is your love language.", characters:["Sherlock Holmes","Hermione Granger","Tony Stark","L (Death Note)"] },
  ENTJ: { label:"The Commander", description:"Natural-born leader with a rare gift for seeing what needs to be done — and getting everyone moving toward it. You're decisive, strategic, and have zero patience for inefficiency.", characters:["Walter White","Frank Underwood","Harvey Specter","Tywin Lannister"] },
  ENTP: { label:"The Debater", description:"Quick-witted and endlessly inventive. You love exploring ideas, challenging assumptions, and debating for sport. You're better at starting things than finishing them, and you're perfectly fine with that.", characters:["Tony Stark","Tyrion Lannister","Fred & George Weasley","The Joker"] },
  INFJ: { label:"The Advocate", description:"Rare, idealistic, and intensely empathetic. You see deeply into people and situations, quietly working toward a vision of a better world. You feel everything — sometimes too much.", characters:["Jon Snow","Atticus Finch","Remus Lupin","Arwen"] },
  INFP: { label:"The Mediator", description:"Idealistic dreamers guided by deep personal values. You believe every life has meaning and you're always searching for your own. Fiercely empathetic, quietly powerful.", characters:["Frodo Baggins","Luna Lovegood","Luke Skywalker","Anne of Green Gables"] },
  ENFJ: { label:"The Protagonist", description:"Charismatic and inspiring with a natural gift for understanding and uplifting people. You were born to lead, and you do it through empathy rather than authority.", characters:["Daenerys Targaryen","Optimus Prime","Morpheus","Professor X"] },
  ENFP: { label:"The Campaigner", description:"Enthusiastic, free-spirited, and endlessly curious about people. You see life as a rich tapestry of possibilities and make everyone around you feel seen and valued.", characters:["Aang","Willy Wonka","Robin Williams","Rapunzel"] },
  ISTJ: { label:"The Logistician", description:"Reliable, methodical, and deeply committed to doing things right. You're the person people count on when it actually matters. Integrity is everything to you.", characters:["Captain America","Ned Stark","Hermione Granger","Stannis Baratheon"] },
  ISFJ: { label:"The Defender", description:"Quietly powerful protectors who put others first without fanfare. Warm, dependable, and deeply loyal — you notice what everyone else overlooks.", characters:["Samwise Gamgee","Pam Beesly","Dr. Watson","Steve Rogers"] },
  ESTJ: { label:"The Executive", description:"Organized, decisive, and committed to maintaining order. You lead by example and believe the best way to do something is the right way — and you know what that is.", characters:["Dwight Schrute","Cersei Lannister","Minerva McGonagall","Judge Judy"] },
  ESFJ: { label:"The Consul", description:"Social butterflies who genuinely care about the people around them. You thrive when others are thriving, and you're the glue that holds your circle together.", characters:["Monica Geller","Leslie Knope","Peeta Mellark","Sansa Stark"] },
  ISTP: { label:"The Virtuoso", description:"Bold, practical, and supremely calm under pressure. You understand how things work at a mechanical level and are at your best when there's a real problem to solve right now.", characters:["Arya Stark","James Bond","Lara Croft","Clint Barton"] },
  ISFP: { label:"The Adventurer", description:"Flexible, charming, and deeply in touch with beauty and sensation. You live in the present, follow your heart, and bring a quiet warmth to everyone lucky enough to know you.", characters:["Bilbo Baggins","Elsa","Michael Jackson","Rogue"] },
  ESTP: { label:"The Entrepreneur", description:"Energetic, observant, and action-first. You thrive where others freeze, make snap decisions that usually work, and live most fully when something real is at stake.", characters:["Han Solo","Jack Sparrow","Deadpool","Buffy Summers"] },
  ESFP: { label:"The Entertainer", description:"Spontaneous and irresistibly fun. You live in the moment, love people fiercely, and have a rare gift for making every experience feel like an event worth remembering.", characters:["Aladdin","Joey Tribbiani","Merry & Pippin","Donna Meagle"] },
};

export const mbtiQuiz: Quiz = {
  slug: "mbti",
  name: "MBTI",
  shortName: "MBTI",
  description: "Discover your Myers-Briggs personality type across 4 dimensions.",
  icon: "🧭",
  questionCount: questions.length,
  isAutoCalc: false,
  questions,
  calculate(answers) {
    const scores = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
    questions.forEach(q => {
      const a = answers[q.id];
      if (a === undefined) return;
      if (q.dimension === "EI") { if (a===0) scores.E++; else scores.I++; }
      if (q.dimension === "SN") { if (a===0) scores.S++; else scores.N++; }
      if (q.dimension === "TF") { if (a===0) scores.T++; else scores.F++; }
      if (q.dimension === "JP") { if (a===0) scores.J++; else scores.P++; }
    });
    const code =
      (scores.E >= scores.I ? "E" : "I") +
      (scores.S >= scores.N ? "S" : "N") +
      (scores.T >= scores.F ? "T" : "F") +
      (scores.J >= scores.P ? "J" : "P");
    const r = RESULTS[code];
    return { code, label: r.label, description: r.description, characters: r.characters, data: scores };
  },
};
