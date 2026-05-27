export type QuestionType = "binary" | "likert" | "choice";

export interface BinaryQuestion {
  id: string;
  type: "binary";
  text: string;
  dimension: string;
  options: [{ text: string; value: 0 }, { text: string; value: 1 }];
}

export interface LikertQuestion {
  id: string;
  type: "likert";
  text: string;
  dimension: string;
  reversed?: boolean;
}

export interface ChoiceQuestion {
  id: string;
  type: "choice";
  text: string;
  options: { text: string; dimension: string }[];
}

export type Question = BinaryQuestion | LikertQuestion | ChoiceQuestion;

export interface QuizResult {
  code: string;
  label: string;
  description: string;
  characters: string[];
  data?: Record<string, number>;
}

export interface Quiz {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  questionCount: number;
  isAutoCalc: boolean;
  questions: Question[];
  calculate: (answers: Record<string, number>) => QuizResult;
}
