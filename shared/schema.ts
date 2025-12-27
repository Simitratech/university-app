import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// ============== APP PROFILE (separate from Replit Auth) ==============
export const appProfiles = pgTable("app_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // Links to Replit Auth user
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("student"), // student or parent
});

export const insertAppProfileSchema = createInsertSchema(appProfiles).omit({ id: true });
export type InsertAppProfile = z.infer<typeof insertAppProfileSchema>;
export type AppProfile = typeof appProfiles.$inferSelect;

// ============== CLASSES MODULE ==============
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(), // References the single student
  courseName: text("course_name").notNull(),
  credits: integer("credits").notNull(),
  status: text("status").notNull().default("remaining"), // completed, in_progress, remaining, failed
  semester: text("semester"),
  estimatedCompletionDate: date("estimated_completion_date"),
  grade: text("grade"),
  gpa: real("gpa"), // GPA for this class (0.0 - 4.0), only set when completed
  instructor: text("instructor"),
  passingThreshold: text("passing_threshold").default("C"), // A, B, C - minimum grade to pass
  currentGradePercent: real("current_grade_percent"), // calculated from exams
  criticalTracking: boolean("critical_tracking").default(false), // Critical Tracking - Computer Engineering
});

export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// ============== GRADING CATEGORIES ==============
export const gradingCategories = pgTable("grading_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  name: text("name").notNull(), // e.g., "Exams", "Assignments", "Participation"
  weight: real("weight").notNull(), // percentage of final grade (e.g., 30 for 30%)
});

export const insertGradingCategorySchema = createInsertSchema(gradingCategories).omit({ id: true });
export type InsertGradingCategory = z.infer<typeof insertGradingCategorySchema>;
export type GradingCategory = typeof gradingCategories.$inferSelect;

// ============== EXAMS MODULE ==============
export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id"),
  categoryId: varchar("category_id"), // link to grading category
  examName: text("exam_name").notNull(),
  examDate: timestamp("exam_date").notNull(),
  weight: real("weight"), // percentage within category (e.g., 20 for 20%)
  grade: text("grade"), // letter grade for display
  gradePercent: real("grade_percent"), // numeric percentage (e.g., 85.5)
  maxScore: real("max_score"), // maximum possible score
  score: real("score"), // actual score earned
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
});

export const insertExamSchema = createInsertSchema(exams).omit({ id: true, reminderSent: true });
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

// ============== STUDY SESSIONS (POMODORO) ==============
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id"),
  date: timestamp("date").notNull().defaultNow(),
  durationMinutes: integer("duration_minutes").notNull(),
  focusDuration: integer("focus_duration").default(25),
  breakDuration: integer("break_duration").default(5),
  sessionType: text("session_type").default("solo"), // solo or group
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({ id: true });
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

// ============== BUDGET MODULE ==============
export const income = pgTable("income", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  month: text("month").notNull(), // YYYY-MM format
  workIncome: real("work_income").default(0),
  parentContributions: real("parent_contributions").default(0),
  extraIncome: real("extra_income").default(0),
});

export const insertIncomeSchema = createInsertSchema(income).omit({ id: true });
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof income.$inferSelect;

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  month: text("month").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  date: date("date").defaultNow(),
  isFixed: boolean("is_fixed").default(false),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const creditCards = pgTable("credit_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  cardName: text("card_name").notNull(),
  balance: real("balance").default(0),
  dueDate: date("due_date"),
  isPaid: boolean("is_paid").default(false),
});

export const insertCreditCardSchema = createInsertSchema(creditCards).omit({ id: true });
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type CreditCard = typeof creditCards.$inferSelect;

export const emergencyFund = pgTable("emergency_fund", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  currentAmount: real("current_amount").default(0),
  targetMonths: integer("target_months").default(3),
});

export const insertEmergencyFundSchema = createInsertSchema(emergencyFund).omit({ id: true });
export type InsertEmergencyFund = z.infer<typeof insertEmergencyFundSchema>;
export type EmergencyFund = typeof emergencyFund.$inferSelect;

// Emergency Fund Contributions (individual entries)
export const emergencyFundContributions = pgTable("emergency_fund_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  amount: real("amount").notNull(),
  date: date("date").notNull().defaultNow(),
  note: text("note"),
});

export const insertEmergencyFundContributionSchema = createInsertSchema(emergencyFundContributions).omit({ id: true });
export type InsertEmergencyFundContribution = z.infer<typeof insertEmergencyFundContributionSchema>;
export type EmergencyFundContribution = typeof emergencyFundContributions.$inferSelect;

// Income Entries (individual income logs)
export const incomeEntries = pgTable("income_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  amount: real("amount").notNull(),
  source: text("source").notNull(), // Work, Parents, Other
  date: date("date").notNull().defaultNow(),
  note: text("note"),
});

export const insertIncomeEntrySchema = createInsertSchema(incomeEntries).omit({ id: true });
export type InsertIncomeEntry = z.infer<typeof insertIncomeEntrySchema>;
export type IncomeEntry = typeof incomeEntries.$inferSelect;

// ============== GYM MODULE ==============
export const gymSessions = pgTable("gym_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  durationMinutes: integer("duration_minutes").notNull(),
  type: text("type").notNull(), // gym, walk, workout
  weight: real("weight"),
});

export const insertGymSessionSchema = createInsertSchema(gymSessions).omit({ id: true });
export type InsertGymSession = z.infer<typeof insertGymSessionSchema>;
export type GymSession = typeof gymSessions.$inferSelect;

// ============== HAPPINESS MODULE ==============
export const happinessEntries = pgTable("happiness_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  date: date("date").notNull().defaultNow(),
  entry: text("entry").notNull(),
});

export const insertHappinessEntrySchema = createInsertSchema(happinessEntries).omit({ id: true });
export type InsertHappinessEntry = z.infer<typeof insertHappinessEntrySchema>;
export type HappinessEntry = typeof happinessEntries.$inferSelect;

// ============== DAILY TRACKING ==============
export const dailyTracking = pgTable("daily_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  date: date("date").notNull().defaultNow(),
  studyCompleted: boolean("study_completed").default(false),
  movementCompleted: boolean("movement_completed").default(false),
  happinessCompleted: boolean("happiness_completed").default(false),
});

export const insertDailyTrackingSchema = createInsertSchema(dailyTracking).omit({ id: true });
export type InsertDailyTracking = z.infer<typeof insertDailyTrackingSchema>;
export type DailyTracking = typeof dailyTracking.$inferSelect;

// ============== BREAKS MODULE ==============
export const breaks = pgTable("breaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
});

export const insertBreakSchema = createInsertSchema(breaks).omit({ id: true });
export type InsertBreak = z.infer<typeof insertBreakSchema>;
export type Break = typeof breaks.$inferSelect;

// ============== TRANSFER TARGETS ==============
export const transferTargets = pgTable("transfer_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  universityName: text("university_name").notNull(),
  requiredCredits: integer("required_credits").notNull(),
  minimumGpa: real("minimum_gpa"),
});

export const insertTransferTargetSchema = createInsertSchema(transferTargets).omit({ id: true });
export type InsertTransferTarget = z.infer<typeof insertTransferTargetSchema>;
export type TransferTarget = typeof transferTargets.$inferSelect;

// ============== AUDIT LOG ==============
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: text("details"),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({ id: true, timestamp: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

// ============== USER SETTINGS (per student, shared by all users) ==============
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().unique(),
  totalCreditsRequired: integer("total_credits_required").default(60),
  dailyStudyGoalMinutes: integer("daily_study_goal_minutes").default(60),
  weeklyGymGoal: integer("weekly_gym_goal").default(3),
  weeklyMovementMinutes: integer("weekly_movement_minutes").default(90),
  theme: text("theme").default("dark"),
  universityTheme: text("university_theme").default("uf"), // uf, santafe, neutral
  targetGpa: real("target_gpa").default(3.5), // Student's target GPA goal
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// ============== SEMESTERS ==============
export const semesters = pgTable("semesters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  name: text("name").notNull(), // e.g., "Fall 2024", "Spring 2025"
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(false),
  isNew: boolean("is_new").default(true), // true when just created, for welcome message
});

export const insertSemesterSchema = createInsertSchema(semesters).omit({ id: true });
export type InsertSemester = z.infer<typeof insertSemesterSchema>;
export type Semester = typeof semesters.$inferSelect;

// ============== SEMESTER ARCHIVES (read-only summaries) ==============
export const semesterArchives = pgTable("semester_archives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  semesterId: varchar("semester_id").notNull(),
  semesterName: text("semester_name").notNull(),
  classCount: integer("class_count").default(0),
  completedCredits: integer("completed_credits").default(0),
  semesterGpa: real("semester_gpa"),
  totalStudyMinutes: integer("total_study_minutes").default(0),
  notes: text("notes"),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
})

export const insertSemesterArchiveSchema = createInsertSchema(semesterArchives).omit({ id: true, archivedAt: true });
export type InsertSemesterArchive = z.infer<typeof insertSemesterArchiveSchema>;
export type SemesterArchive = typeof semesterArchives.$inferSelect;

// ============== REPLIT DB STUDENT DATA (Single JSON Object) ==============
// This is the unified student data structure stored in Replit DB under "student:michael"
export interface StudentDataClass {
  id: string;
  courseName: string;
  credits: number;
  status: string;
  semester: string | null;
  estimatedCompletionDate: string | null;
  grade: string | null;
  gpa: number | null;
  instructor: string | null;
  passingThreshold: string;
  currentGradePercent: number | null;
  criticalTracking: boolean;
}

export interface StudentDataExam {
  id: string;
  classId: string | null;
  categoryId: string | null;
  examName: string;
  examDate: string;
  weight: number | null;
  grade: string | null;
  gradePercent: number | null;
  maxScore: number | null;
  score: number | null;
  notes: string | null;
}

export interface StudentDataGradingCategory {
  id: string;
  classId: string;
  name: string;
  weight: number;
}

export interface StudentDataStudySession {
  id: string;
  classId: string | null;
  date: string;
  durationMinutes: number;
  focusDuration: number;
  breakDuration: number;
  sessionType: string;
}

export interface StudentDataGymSession {
  id: string;
  date: string;
  durationMinutes: number;
  type: string;
  weight: number | null;
}

export interface StudentDataHappinessEntry {
  id: string;
  date: string;
  entry: string;
}

export interface StudentDataDailyTracking {
  id: string;
  date: string;
  studyCompleted: boolean;
  movementCompleted: boolean;
  happinessCompleted: boolean;
}

export interface StudentDataExpense {
  id: string;
  month: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  isFixed: boolean;
}

export interface StudentDataIncomeEntry {
  id: string;
  amount: number;
  source: string;
  date: string;
  note: string | null;
}

export interface StudentDataCreditCard {
  id: string;
  cardName: string;
  balance: number;
  dueDate: string | null;
  isPaid: boolean;
}

export interface StudentDataEmergencyFund {
  currentAmount: number;
  targetMonths: number;
}

export interface StudentDataEmergencyFundContribution {
  id: string;
  amount: number;
  date: string;
  note: string | null;
}

export interface StudentDataSemester {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isNew: boolean;
}

export interface StudentDataSemesterArchive {
  id: string;
  semesterId: string;
  semesterName: string;
  classCount: number;
  completedCredits: number;
  semesterGpa: number | null;
  totalStudyMinutes: number;
  notes: string | null;
  archivedAt: string;
}

export interface StudentDataSettings {
  totalCreditsRequired: number;
  dailyStudyGoalMinutes: number;
  weeklyGymGoal: number;
  weeklyMovementMinutes: number;
  theme: string;
  universityTheme: string;
  targetGpa: number;
}

export interface StudentData {
  id: string;
  name: string;
  classes: StudentDataClass[];
  exams: StudentDataExam[];
  gradingCategories: StudentDataGradingCategory[];
  studySessions: StudentDataStudySession[];
  gymSessions: StudentDataGymSession[];
  happinessEntries: StudentDataHappinessEntry[];
  dailyTracking: StudentDataDailyTracking[];
  expenses: StudentDataExpense[];
  incomeEntries: StudentDataIncomeEntry[];
  creditCards: StudentDataCreditCard[];
  emergencyFund: StudentDataEmergencyFund;
  emergencyFundContributions: StudentDataEmergencyFundContribution[];
  semesters: StudentDataSemester[];
  semesterArchives: StudentDataSemesterArchive[];
  settings: StudentDataSettings;
}

export function createEmptyStudentData(): StudentData {
  return {
    id: "michael",
    name: "Michael",
    classes: [],
    exams: [],
    gradingCategories: [],
    studySessions: [],
    gymSessions: [],
    happinessEntries: [],
    dailyTracking: [],
    expenses: [],
    incomeEntries: [],
    creditCards: [],
    emergencyFund: { currentAmount: 0, targetMonths: 3 },
    emergencyFundContributions: [],
    semesters: [],
    semesterArchives: [],
    settings: {
      totalCreditsRequired: 60,
      dailyStudyGoalMinutes: 60,
      weeklyGymGoal: 3,
      weeklyMovementMinutes: 90,
      theme: "dark",
      universityTheme: "uf",
      targetGpa: 3.5,
    },
  };
}
