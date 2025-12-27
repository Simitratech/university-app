import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  appProfiles, type AppProfile, type InsertAppProfile,
  classes, type Class, type InsertClass,
  gradingCategories, type GradingCategory, type InsertGradingCategory,
  exams, type Exam, type InsertExam,
  studySessions, type StudySession, type InsertStudySession,
  income, type Income, type InsertIncome,
  expenses, type Expense, type InsertExpense,
  creditCards, type CreditCard, type InsertCreditCard,
  emergencyFund, type EmergencyFund, type InsertEmergencyFund,
  emergencyFundContributions, type EmergencyFundContribution, type InsertEmergencyFundContribution,
  incomeEntries, type IncomeEntry, type InsertIncomeEntry,
  gymSessions, type GymSession, type InsertGymSession,
  happinessEntries, type HappinessEntry, type InsertHappinessEntry,
  dailyTracking, type DailyTracking, type InsertDailyTracking,
  breaks, type Break, type InsertBreak,
  userSettings, type UserSettings, type InsertUserSettings,
  auditLog, type AuditLog, type InsertAuditLog,
  semesters, type Semester, type InsertSemester,
  semesterArchives, type SemesterArchive, type InsertSemesterArchive,
} from "@shared/schema";
import { format, startOfWeek, endOfWeek } from "date-fns";

export interface IStorage {
  // App Profiles
  getAppProfile(userId: string): Promise<AppProfile | undefined>;
  createAppProfile(data: InsertAppProfile): Promise<AppProfile>;
  updateAppProfile(userId: string, data: Partial<InsertAppProfile>): Promise<AppProfile | undefined>;

  // Classes - all data queries use studentId
  getClasses(studentId: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(data: InsertClass): Promise<Class>;
  updateClass(id: string, data: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string, studentId: string): Promise<boolean>;

  // Exams
  getExams(studentId: string): Promise<Exam[]>;
  getExamsByClass(classId: string): Promise<Exam[]>;
  getExam(id: string): Promise<Exam | undefined>;
  createExam(data: InsertExam): Promise<Exam>;
  updateExam(id: string, data: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: string, studentId: string): Promise<boolean>;

  // Grading Categories
  getGradingCategories(classId: string): Promise<GradingCategory[]>;
  createGradingCategory(data: InsertGradingCategory): Promise<GradingCategory>;
  updateGradingCategory(id: string, data: Partial<InsertGradingCategory>): Promise<GradingCategory | undefined>;
  deleteGradingCategory(id: string, studentId: string): Promise<boolean>;

  // Study Sessions
  getStudySessions(studentId: string): Promise<StudySession[]>;
  getStudySessionsForWeek(studentId: string): Promise<StudySession[]>;
  createStudySession(data: InsertStudySession): Promise<StudySession>;
  deleteStudySession(id: string, studentId: string): Promise<boolean>;

  // Income
  getIncome(studentId: string, month: string): Promise<Income[]>;
  createOrUpdateIncome(data: InsertIncome): Promise<Income>;

  // Expenses
  getExpenses(studentId: string, month: string): Promise<Expense[]>;
  createExpense(data: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;

  // Credit Cards
  getCreditCards(studentId: string): Promise<CreditCard[]>;
  createCreditCard(data: InsertCreditCard): Promise<CreditCard>;
  updateCreditCard(id: string, data: Partial<InsertCreditCard>): Promise<CreditCard | undefined>;
  deleteCreditCard(id: string): Promise<boolean>;

  // Emergency Fund
  getEmergencyFund(studentId: string): Promise<EmergencyFund | undefined>;
  updateEmergencyFund(studentId: string, data: Partial<InsertEmergencyFund>): Promise<EmergencyFund>;

  // Emergency Fund Contributions
  getEmergencyFundContributions(studentId: string): Promise<EmergencyFundContribution[]>;
  createEmergencyFundContribution(data: InsertEmergencyFundContribution): Promise<EmergencyFundContribution>;
  deleteEmergencyFundContribution(id: string, studentId: string): Promise<boolean>;

  // Income Entries
  getIncomeEntries(studentId: string, month?: string): Promise<IncomeEntry[]>;
  createIncomeEntry(data: InsertIncomeEntry): Promise<IncomeEntry>;
  deleteIncomeEntry(id: string, studentId: string): Promise<boolean>;

  // Gym Sessions
  getGymSessions(studentId: string): Promise<GymSession[]>;
  getGymSessionsForWeek(studentId: string): Promise<GymSession[]>;
  createGymSession(data: InsertGymSession): Promise<GymSession>;
  deleteGymSession(id: string, studentId: string): Promise<boolean>;

  // Happiness
  getHappinessEntries(studentId: string): Promise<HappinessEntry[]>;
  getLatestHappiness(studentId: string): Promise<HappinessEntry | undefined>;
  createHappinessEntry(data: InsertHappinessEntry): Promise<HappinessEntry>;

  // Daily Tracking
  getDailyTracking(studentId: string, date: string): Promise<DailyTracking | undefined>;
  getRecentDailyTracking(studentId: string, days: number): Promise<DailyTracking[]>;
  updateDailyTracking(studentId: string, date: string, data: Partial<InsertDailyTracking>): Promise<DailyTracking>;

  // Breaks
  getBreaks(studentId: string): Promise<Break[]>;
  createBreak(data: InsertBreak): Promise<Break>;
  deleteBreak(id: string): Promise<boolean>;

  // User Settings (per student)
  getUserSettings(studentId: string): Promise<UserSettings | undefined>;
  updateUserSettings(studentId: string, data: Partial<InsertUserSettings>): Promise<UserSettings>;

  // Audit Log
  logAction(data: InsertAuditLog): Promise<AuditLog>;

  // Semesters
  getSemesters(studentId: string): Promise<Semester[]>;
  getActiveSemester(studentId: string): Promise<Semester | undefined>;
  createSemester(data: InsertSemester): Promise<Semester>;
  setActiveSemester(studentId: string, semesterId: string): Promise<Semester | undefined>;
  markSemesterNotNew(semesterId: string): Promise<Semester | undefined>;

  // Semester Archives
  getSemesterArchives(studentId: string): Promise<SemesterArchive[]>;
  createSemesterArchive(data: InsertSemesterArchive): Promise<SemesterArchive>;
}

export class DatabaseStorage implements IStorage {
  // App Profiles
  async getAppProfile(userId: string): Promise<AppProfile | undefined> {
    const [result] = await db.select().from(appProfiles).where(eq(appProfiles.userId, userId));
    return result;
  }

  async createAppProfile(data: InsertAppProfile): Promise<AppProfile> {
    const [result] = await db.insert(appProfiles).values(data).returning();
    return result;
  }

  async updateAppProfile(userId: string, data: Partial<InsertAppProfile>): Promise<AppProfile | undefined> {
    const [result] = await db.update(appProfiles).set(data).where(eq(appProfiles.userId, userId)).returning();
    return result;
  }

  // Classes - query by studentId so all users with same student see same data
  async getClasses(studentId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.studentId, studentId)).orderBy(desc(classes.id));
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [result] = await db.select().from(classes).where(eq(classes.id, id));
    return result;
  }

  async createClass(data: InsertClass): Promise<Class> {
    const [result] = await db.insert(classes).values(data).returning();
    return result;
  }

  async updateClass(id: string, data: Partial<InsertClass>): Promise<Class | undefined> {
    const [result] = await db.update(classes).set(data).where(eq(classes.id, id)).returning();
    return result;
  }

  async deleteClass(id: string, studentId: string): Promise<boolean> {
    await db.delete(classes).where(and(eq(classes.id, id), eq(classes.studentId, studentId)));
    return true;
  }

  // Exams
  async getExams(studentId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.studentId, studentId)).orderBy(exams.examDate);
  }

  async getExamsByClass(classId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.classId, classId)).orderBy(exams.examDate);
  }

  async getExam(id: string): Promise<Exam | undefined> {
    const [result] = await db.select().from(exams).where(eq(exams.id, id));
    return result;
  }

  async createExam(data: InsertExam): Promise<Exam> {
    const [result] = await db.insert(exams).values(data).returning();
    return result;
  }

  async updateExam(id: string, data: Partial<InsertExam>): Promise<Exam | undefined> {
    const [result] = await db.update(exams).set(data).where(eq(exams.id, id)).returning();
    return result;
  }

  async deleteExam(id: string, studentId: string): Promise<boolean> {
    await db.delete(exams).where(and(eq(exams.id, id), eq(exams.studentId, studentId)));
    return true;
  }

  // Grading Categories
  async getGradingCategories(classId: string): Promise<GradingCategory[]> {
    return await db.select().from(gradingCategories).where(eq(gradingCategories.classId, classId));
  }

  async createGradingCategory(data: InsertGradingCategory): Promise<GradingCategory> {
    const [result] = await db.insert(gradingCategories).values(data).returning();
    return result;
  }

  async updateGradingCategory(id: string, data: Partial<InsertGradingCategory>): Promise<GradingCategory | undefined> {
    const [result] = await db.update(gradingCategories).set(data).where(eq(gradingCategories.id, id)).returning();
    return result;
  }

  async deleteGradingCategory(id: string, studentId: string): Promise<boolean> {
    await db.delete(gradingCategories).where(and(eq(gradingCategories.id, id), eq(gradingCategories.studentId, studentId)));
    return true;
  }

  // Study Sessions
  async getStudySessions(studentId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.studentId, studentId)).orderBy(desc(studySessions.date));
  }

  async getStudySessionsForWeek(studentId: string): Promise<StudySession[]> {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    return await db.select().from(studySessions)
      .where(and(
        eq(studySessions.studentId, studentId),
        gte(studySessions.date, weekStart),
        lte(studySessions.date, weekEnd)
      ))
      .orderBy(desc(studySessions.date));
  }

  async createStudySession(data: InsertStudySession): Promise<StudySession> {
    const [result] = await db.insert(studySessions).values(data).returning();
    return result;
  }

  async deleteStudySession(id: string, studentId: string): Promise<boolean> {
    await db.delete(studySessions).where(and(eq(studySessions.id, id), eq(studySessions.studentId, studentId)));
    return true;
  }

  // Income
  async getIncome(studentId: string, month: string): Promise<Income[]> {
    return await db.select().from(income).where(and(eq(income.studentId, studentId), eq(income.month, month)));
  }

  async createOrUpdateIncome(data: InsertIncome): Promise<Income> {
    const existing = await this.getIncome(data.studentId, data.month);
    if (existing.length > 0) {
      const [result] = await db.update(income)
        .set(data)
        .where(and(eq(income.studentId, data.studentId), eq(income.month, data.month)))
        .returning();
      return result;
    }
    const [result] = await db.insert(income).values(data).returning();
    return result;
  }

  // Expenses
  async getExpenses(studentId: string, month: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(and(eq(expenses.studentId, studentId), eq(expenses.month, month))).orderBy(desc(expenses.id));
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const [result] = await db.insert(expenses).values(data).returning();
    return result;
  }

  async deleteExpense(id: string): Promise<boolean> {
    await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }

  // Credit Cards
  async getCreditCards(studentId: string): Promise<CreditCard[]> {
    return await db.select().from(creditCards).where(eq(creditCards.studentId, studentId));
  }

  async createCreditCard(data: InsertCreditCard): Promise<CreditCard> {
    const [result] = await db.insert(creditCards).values(data).returning();
    return result;
  }

  async updateCreditCard(id: string, data: Partial<InsertCreditCard>): Promise<CreditCard | undefined> {
    const [result] = await db.update(creditCards).set(data).where(eq(creditCards.id, id)).returning();
    return result;
  }

  async deleteCreditCard(id: string): Promise<boolean> {
    await db.delete(creditCards).where(eq(creditCards.id, id));
    return true;
  }

  // Emergency Fund
  async getEmergencyFund(studentId: string): Promise<EmergencyFund | undefined> {
    const [result] = await db.select().from(emergencyFund).where(eq(emergencyFund.studentId, studentId));
    return result;
  }

  async updateEmergencyFund(studentId: string, data: Partial<InsertEmergencyFund>): Promise<EmergencyFund> {
    const existing = await this.getEmergencyFund(studentId);
    if (existing) {
      const [result] = await db.update(emergencyFund).set(data).where(eq(emergencyFund.studentId, studentId)).returning();
      return result;
    }
    const [result] = await db.insert(emergencyFund).values({ studentId, ...data }).returning();
    return result;
  }

  // Emergency Fund Contributions
  async getEmergencyFundContributions(studentId: string): Promise<EmergencyFundContribution[]> {
    return await db.select().from(emergencyFundContributions)
      .where(eq(emergencyFundContributions.studentId, studentId))
      .orderBy(desc(emergencyFundContributions.date));
  }

  async createEmergencyFundContribution(data: InsertEmergencyFundContribution): Promise<EmergencyFundContribution> {
    const [result] = await db.insert(emergencyFundContributions).values(data).returning();
    // Update the emergency fund total
    const contributions = await this.getEmergencyFundContributions(data.studentId);
    const total = contributions.reduce((sum, c) => sum + c.amount, 0);
    await this.updateEmergencyFund(data.studentId, { currentAmount: total });
    return result;
  }

  async deleteEmergencyFundContribution(id: string, studentId: string): Promise<boolean> {
    await db.delete(emergencyFundContributions)
      .where(and(eq(emergencyFundContributions.id, id), eq(emergencyFundContributions.studentId, studentId)));
    // Update the emergency fund total
    const contributions = await this.getEmergencyFundContributions(studentId);
    const total = contributions.reduce((sum, c) => sum + c.amount, 0);
    await this.updateEmergencyFund(studentId, { currentAmount: total });
    return true;
  }

  // Income Entries
  async getIncomeEntries(studentId: string, month?: string): Promise<IncomeEntry[]> {
    if (month) {
      const startDate = `${month}-01`;
      const year = parseInt(month.split("-")[0]);
      const monthNum = parseInt(month.split("-")[1]);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDate = `${month}-${lastDay.toString().padStart(2, "0")}`;
      return await db.select().from(incomeEntries)
        .where(and(
          eq(incomeEntries.studentId, studentId),
          gte(incomeEntries.date, startDate),
          lte(incomeEntries.date, endDate)
        ))
        .orderBy(desc(incomeEntries.date));
    }
    return await db.select().from(incomeEntries)
      .where(eq(incomeEntries.studentId, studentId))
      .orderBy(desc(incomeEntries.date));
  }

  async createIncomeEntry(data: InsertIncomeEntry): Promise<IncomeEntry> {
    const [result] = await db.insert(incomeEntries).values(data).returning();
    return result;
  }

  async deleteIncomeEntry(id: string, studentId: string): Promise<boolean> {
    await db.delete(incomeEntries)
      .where(and(eq(incomeEntries.id, id), eq(incomeEntries.studentId, studentId)));
    return true;
  }

  // Gym Sessions
  async getGymSessions(studentId: string): Promise<GymSession[]> {
    return await db.select().from(gymSessions).where(eq(gymSessions.studentId, studentId)).orderBy(desc(gymSessions.date));
  }

  async getGymSessionsForWeek(studentId: string): Promise<GymSession[]> {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    return await db.select().from(gymSessions)
      .where(and(
        eq(gymSessions.studentId, studentId),
        gte(gymSessions.date, weekStart),
        lte(gymSessions.date, weekEnd)
      ))
      .orderBy(desc(gymSessions.date));
  }

  async createGymSession(data: InsertGymSession): Promise<GymSession> {
    const [result] = await db.insert(gymSessions).values(data).returning();
    return result;
  }

  async deleteGymSession(id: string, studentId: string): Promise<boolean> {
    const result = await db.delete(gymSessions)
      .where(and(eq(gymSessions.id, id), eq(gymSessions.studentId, studentId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Happiness
  async getHappinessEntries(studentId: string): Promise<HappinessEntry[]> {
    return await db.select().from(happinessEntries).where(eq(happinessEntries.studentId, studentId)).orderBy(desc(happinessEntries.date));
  }

  async getLatestHappiness(studentId: string): Promise<HappinessEntry | undefined> {
    const [result] = await db.select().from(happinessEntries)
      .where(eq(happinessEntries.studentId, studentId))
      .orderBy(desc(happinessEntries.date))
      .limit(1);
    return result;
  }

  async createHappinessEntry(data: InsertHappinessEntry): Promise<HappinessEntry> {
    const [result] = await db.insert(happinessEntries).values(data).returning();
    return result;
  }

  // Daily Tracking
  async getDailyTracking(studentId: string, date: string): Promise<DailyTracking | undefined> {
    const [result] = await db.select().from(dailyTracking)
      .where(and(eq(dailyTracking.studentId, studentId), eq(dailyTracking.date, date)));
    return result;
  }

  async getRecentDailyTracking(studentId: string, days: number): Promise<DailyTracking[]> {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return await db.select().from(dailyTracking)
      .where(and(
        eq(dailyTracking.studentId, studentId),
        sql`${dailyTracking.date} IN (${sql.join(dates.map(d => sql`${d}`), sql`, `)})`
      ))
      .orderBy(desc(dailyTracking.date));
  }

  async updateDailyTracking(studentId: string, date: string, data: Partial<InsertDailyTracking>): Promise<DailyTracking> {
    const existing = await this.getDailyTracking(studentId, date);
    if (existing) {
      const [result] = await db.update(dailyTracking)
        .set(data)
        .where(and(eq(dailyTracking.studentId, studentId), eq(dailyTracking.date, date)))
        .returning();
      return result;
    }
    const [result] = await db.insert(dailyTracking).values({ studentId, date, ...data }).returning();
    return result;
  }

  // Breaks
  async getBreaks(studentId: string): Promise<Break[]> {
    return await db.select().from(breaks).where(eq(breaks.studentId, studentId)).orderBy(breaks.startDate);
  }

  async createBreak(data: InsertBreak): Promise<Break> {
    const [result] = await db.insert(breaks).values(data).returning();
    return result;
  }

  async deleteBreak(id: string): Promise<boolean> {
    await db.delete(breaks).where(eq(breaks.id, id));
    return true;
  }

  // User Settings (per student, shared by all users)
  async getUserSettings(studentId: string): Promise<UserSettings | undefined> {
    const [result] = await db.select().from(userSettings).where(eq(userSettings.studentId, studentId));
    return result;
  }

  async updateUserSettings(studentId: string, data: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(studentId);
    if (existing) {
      const [result] = await db.update(userSettings).set(data).where(eq(userSettings.studentId, studentId)).returning();
      return result;
    }
    const [result] = await db.insert(userSettings).values({ studentId, ...data }).returning();
    return result;
  }

  // Audit Log
  async logAction(data: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLog).values(data).returning();
    return result;
  }

  // Semesters
  async getSemesters(studentId: string): Promise<Semester[]> {
    return await db.select().from(semesters).where(eq(semesters.studentId, studentId)).orderBy(desc(semesters.startDate));
  }

  async getActiveSemester(studentId: string): Promise<Semester | undefined> {
    const [result] = await db.select().from(semesters).where(and(eq(semesters.studentId, studentId), eq(semesters.isActive, true)));
    return result;
  }

  async createSemester(data: InsertSemester): Promise<Semester> {
    const [result] = await db.insert(semesters).values(data).returning();
    return result;
  }

  async setActiveSemester(studentId: string, semesterId: string): Promise<Semester | undefined> {
    await db.update(semesters).set({ isActive: false }).where(eq(semesters.studentId, studentId));
    const [result] = await db.update(semesters).set({ isActive: true }).where(and(eq(semesters.id, semesterId), eq(semesters.studentId, studentId))).returning();
    return result;
  }

  async markSemesterNotNew(semesterId: string): Promise<Semester | undefined> {
    const [result] = await db.update(semesters).set({ isNew: false }).where(eq(semesters.id, semesterId)).returning();
    return result;
  }

  // Semester Archives
  async getSemesterArchives(studentId: string): Promise<SemesterArchive[]> {
    return await db.select().from(semesterArchives).where(eq(semesterArchives.studentId, studentId)).orderBy(desc(semesterArchives.archivedAt));
  }

  async createSemesterArchive(data: InsertSemesterArchive): Promise<SemesterArchive> {
    const [result] = await db.insert(semesterArchives).values(data).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
