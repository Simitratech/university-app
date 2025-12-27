const dailyCoachMessages = [
  "Showing up matters more than being perfect.",
  "Progress begins the moment you start.",
  "You don't need confidence to take the first step.",
  "Today is about effort, not outcome.",
  "Small actions build momentum.",
  "Consistency creates freedom.",
  "A little progress today helps tomorrow.",
  "Focus on what you can control right now.",
  "Steady beats intense.",
  "You're building a system, not chasing motivation.",
  "Clarity often comes after you begin.",
  "One focused block is enough to move forward.",
  "You're allowed to learn at your own pace.",
  "Effort today reduces stress later.",
  "Studying is an investment, not a test of worth.",
  "Grades are information, not judgment.",
  "Critical classes deserve attention — and you're giving it.",
  "Every class completed is real progress.",
  "Your path doesn't have to look like anyone else's.",
  "Long goals are built one semester at a time.",
  "Awareness is the first step to control.",
  "Every dollar tracked builds independence.",
  "Planning today reduces pressure tomorrow.",
  "You're learning skills that last beyond school.",
  "Financial habits grow the same way study habits do.",
  "Movement helps the mind as much as the body.",
  "Taking care of yourself supports your goals.",
  "Happiness doesn't need to be earned.",
  "You're learning how to manage life, not just classes.",
  "This is progress — even on quiet days.",
];

const studyCompleteMessages = [
  "Good session. Focused time builds momentum.",
  "Progress happens one session at a time.",
  "Nice work. Rest, then keep going.",
  "Another step forward.",
  "Well done. Your effort counts.",
  "Time well spent.",
  "Focused time is never wasted.",
];

const preExamMessages = [
  "Preparation is progress, even if it feels incomplete.",
  "Focus on what you know — not what you fear.",
  "You don't need perfection to perform well.",
  "One focused review session is valuable.",
  "Trust the work you've already done.",
];

const examDayMessages = [
  "Do your best with what you have today.",
  "This exam does not define you.",
  "Stay present — one question at a time.",
  "Calm effort beats panic.",
];

const postExamMessages = [
  "The exam is done. Let it go.",
  "Whatever the outcome, you showed up.",
  "Results are information, not identity.",
  "Recovery and reflection matter now.",
];

const recoveryMessages = [
  "Welcome back. Nothing to fix.",
  "You didn't fail — you paused.",
  "Today is a clean slate.",
  "Restarting is part of progress.",
  "Momentum returns when you begin again.",
];

const examWeekMessages = [
  "Focus on what's in front of you.",
  "One step at a time.",
  "Do your best with what you have today.",
];

const semesterStartMessages = [
  "This semester is a fresh opportunity.",
  "You're not starting over — you're starting wiser.",
  "New semester. New possibilities.",
];

const recoverySuggestedActions = [
  { type: "study" as const, label: "Start one 25-minute study block" },
  { type: "happy" as const, label: "Log one happy moment" },
  { type: "move" as const, label: "Move for 10 minutes" },
];

function getRandomMessage(messages: string[]): string {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

function getSeededMessage(messages: string[], seed: number): string {
  const index = seed % messages.length;
  return messages[index];
}

export function getDailyCoachMessage(): string {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const index = (dayOfMonth - 1) % 30;
  return dailyCoachMessages[index];
}

export function getStudyCompleteMessage(): string {
  return getRandomMessage(studyCompleteMessages);
}

export type ExamTimingType = "pre-exam" | "exam-day" | "post-exam" | null;

export function getExamTiming(examDate: Date | string): ExamTimingType {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  
  const diffTime = exam.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "exam-day";
  } else if (diffDays >= 1 && diffDays <= 3) {
    return "pre-exam";
  } else if (diffDays >= -3 && diffDays < 0) {
    return "post-exam";
  }
  
  return null;
}

export function getExamCoachMessage(examDate: Date | string, examId?: string): string | null {
  const timing = getExamTiming(examDate);
  
  if (!timing) return null;
  
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const examSeed = examId ? seed + examId.charCodeAt(0) : seed;
  
  switch (timing) {
    case "pre-exam":
      return getSeededMessage(preExamMessages, examSeed);
    case "exam-day":
      return getSeededMessage(examDayMessages, examSeed);
    case "post-exam":
      return getSeededMessage(postExamMessages, examSeed);
    default:
      return null;
  }
}

export type RecoverySuggestedAction = { type: "study" | "happy" | "move"; label: string };

export function getRecoveryMessage(): string {
  return getRandomMessage(recoveryMessages);
}

export function getRecoverySuggestedAction(): RecoverySuggestedAction {
  const index = Math.floor(Math.random() * recoverySuggestedActions.length);
  return recoverySuggestedActions[index];
}

export function isExamWeek(exams: Array<{ examDate: string | Date }>): boolean {
  if (!exams || exams.length === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  return exams.some((exam) => {
    const examDate = new Date(exam.examDate);
    examDate.setHours(0, 0, 0, 0);
    return examDate >= today && examDate <= sevenDaysFromNow;
  });
}

export function getExamWeekMessage(): string {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const index = dayOfMonth % examWeekMessages.length;
  return examWeekMessages[index];
}

export function getSemesterStartMessage(): string {
  const index = Math.floor(Math.random() * semesterStartMessages.length);
  return semesterStartMessages[index];
}
