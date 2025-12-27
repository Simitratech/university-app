import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated, isStudent } from "./replit_integrations/auth";
import { format } from "date-fns";
import {
  insertAppProfileSchema,
  insertClassSchema,
  insertGradingCategorySchema,
  insertExamSchema,
  insertStudySessionSchema,
  insertIncomeSchema,
  insertExpenseSchema,
  insertCreditCardSchema,
  insertEmergencyFundContributionSchema,
  insertIncomeEntrySchema,
  insertGymSessionSchema,
  insertHappinessEntrySchema,
  insertSemesterSchema,
  insertSemesterArchiveSchema,
  type StudentData,
  type StudentDataClass,
  type StudentDataExam,
  type StudentDataGradingCategory,
  type StudentDataStudySession,
  type StudentDataGymSession,
  type StudentDataHappinessEntry,
  type StudentDataDailyTracking,
  type StudentDataExpense,
  type StudentDataIncomeEntry,
  type StudentDataCreditCard,
  type StudentDataEmergencyFundContribution,
  type StudentDataSemester,
  type StudentDataSemesterArchive,
  createEmptyStudentData,
  classes,
  exams,
  gradingCategories,
  studySessions,
  gymSessions,
  happinessEntries,
  dailyTracking,
  expenses,
  incomeEntries,
  creditCards,
  emergencyFund,
  emergencyFundContributions,
  semesters,
  semesterArchives,
  userSettings,
} from "@shared/schema";

// Default student ID for the shared family data
const DEFAULT_STUDENT_ID = "michael";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to get studentId from request - all data is shared by studentId
  const getStudentId = (req: any): string => {
    const studentId = req.currentUser?.studentId;
    if (!studentId) {
      throw new Error("User not attached to a student");
    }
    return studentId;
  };

  // Helper to get user ID from request (for profile operations)
  const getUserId = (req: any): string => req.currentUser?.id;

  // ============== APP PROFILE ==============
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getAppProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertAppProfileSchema.parse({ ...req.body, userId });
      const result = await storage.createAppProfile(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.updateAppProfile(userId, req.body);
      if (!result) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // ============== POSTGRESQL STUDENT DATA (Single Source of Truth) ==============
  
  // Helper function to convert Date objects to ISO strings for JSON response
  const dateToString = (d: Date | string | null): string | null => {
    if (!d) return null;
    if (typeof d === 'string') return d;
    return d.toISOString();
  };

  // GET /api/student - Load all student data from PostgreSQL
  app.get("/api/student", isAuthenticated, async (req, res) => {
    try {
      const studentId = DEFAULT_STUDENT_ID;
      
      // Fetch all data from PostgreSQL tables in parallel
      const [
        classesData,
        examsData,
        gradingCategoriesData,
        studySessionsData,
        gymSessionsData,
        happinessEntriesData,
        dailyTrackingData,
        expensesData,
        incomeEntriesData,
        creditCardsData,
        emergencyFundData,
        emergencyFundContributionsData,
        semestersData,
        semesterArchivesData,
        settingsData,
      ] = await Promise.all([
        db.select().from(classes).where(eq(classes.studentId, studentId)),
        db.select().from(exams).where(eq(exams.studentId, studentId)),
        db.select().from(gradingCategories).where(eq(gradingCategories.studentId, studentId)),
        db.select().from(studySessions).where(eq(studySessions.studentId, studentId)),
        db.select().from(gymSessions).where(eq(gymSessions.studentId, studentId)),
        db.select().from(happinessEntries).where(eq(happinessEntries.studentId, studentId)),
        db.select().from(dailyTracking).where(eq(dailyTracking.studentId, studentId)),
        db.select().from(expenses).where(eq(expenses.studentId, studentId)),
        db.select().from(incomeEntries).where(eq(incomeEntries.studentId, studentId)),
        db.select().from(creditCards).where(eq(creditCards.studentId, studentId)),
        db.select().from(emergencyFund).where(eq(emergencyFund.studentId, studentId)),
        db.select().from(emergencyFundContributions).where(eq(emergencyFundContributions.studentId, studentId)),
        db.select().from(semesters).where(eq(semesters.studentId, studentId)),
        db.select().from(semesterArchives).where(eq(semesterArchives.studentId, studentId)),
        db.select().from(userSettings).where(eq(userSettings.studentId, studentId)),
      ]);

      // Transform data to match StudentData interface
      const studentData: StudentData = {
        id: studentId,
        name: "Michael",
        classes: classesData.map(c => ({
          id: c.id,
          courseName: c.courseName,
          credits: c.credits,
          status: c.status,
          semester: c.semester,
          estimatedCompletionDate: c.estimatedCompletionDate,
          grade: c.grade,
          gpa: c.gpa,
          instructor: c.instructor,
          passingThreshold: c.passingThreshold || "C",
          currentGradePercent: c.currentGradePercent,
          criticalTracking: c.criticalTracking || false,
        })),
        exams: examsData.map(e => ({
          id: e.id,
          classId: e.classId,
          categoryId: e.categoryId,
          examName: e.examName,
          examDate: dateToString(e.examDate) || "",
          weight: e.weight,
          grade: e.grade,
          gradePercent: e.gradePercent,
          maxScore: e.maxScore,
          score: e.score,
          notes: e.notes,
        })),
        gradingCategories: gradingCategoriesData.map(gc => ({
          id: gc.id,
          classId: gc.classId,
          name: gc.name,
          weight: gc.weight,
        })),
        studySessions: studySessionsData.map(s => ({
          id: s.id,
          classId: s.classId,
          date: dateToString(s.date) || "",
          durationMinutes: s.durationMinutes,
          focusDuration: s.focusDuration || 25,
          breakDuration: s.breakDuration || 5,
          sessionType: s.sessionType || "solo",
        })),
        gymSessions: gymSessionsData.map(g => ({
          id: g.id,
          date: dateToString(g.date) || "",
          durationMinutes: g.durationMinutes,
          type: g.type,
          weight: g.weight,
        })),
        happinessEntries: happinessEntriesData.map(h => ({
          id: h.id,
          date: h.date || "",
          entry: h.entry,
        })),
        dailyTracking: dailyTrackingData.map(dt => ({
          id: dt.id,
          date: dt.date || "",
          studyCompleted: dt.studyCompleted || false,
          movementCompleted: dt.movementCompleted || false,
          happinessCompleted: dt.happinessCompleted || false,
        })),
        expenses: expensesData.map(e => ({
          id: e.id,
          month: e.month,
          category: e.category,
          description: e.description,
          amount: e.amount,
          date: e.date || "",
          isFixed: e.isFixed || false,
        })),
        incomeEntries: incomeEntriesData.map(ie => ({
          id: ie.id,
          amount: ie.amount,
          source: ie.source,
          date: ie.date || "",
          note: ie.note,
        })),
        creditCards: creditCardsData.map(cc => ({
          id: cc.id,
          cardName: cc.cardName,
          balance: cc.balance || 0,
          dueDate: cc.dueDate,
          isPaid: cc.isPaid || false,
        })),
        emergencyFund: emergencyFundData[0] 
          ? { currentAmount: emergencyFundData[0].currentAmount || 0, targetMonths: emergencyFundData[0].targetMonths || 3 }
          : { currentAmount: 0, targetMonths: 3 },
        emergencyFundContributions: emergencyFundContributionsData.map(efc => ({
          id: efc.id,
          amount: efc.amount,
          date: efc.date || "",
          note: efc.note,
        })),
        semesters: semestersData.map(s => ({
          id: s.id,
          name: s.name,
          startDate: s.startDate || "",
          endDate: s.endDate,
          isActive: s.isActive || false,
          isNew: s.isNew || false,
        })),
        semesterArchives: semesterArchivesData.map(sa => ({
          id: sa.id,
          semesterId: sa.semesterId,
          semesterName: sa.semesterName,
          classCount: sa.classCount || 0,
          completedCredits: sa.completedCredits || 0,
          semesterGpa: sa.semesterGpa,
          totalStudyMinutes: sa.totalStudyMinutes || 0,
          notes: sa.notes,
          archivedAt: dateToString(sa.archivedAt) || "",
        })),
        settings: settingsData[0]
          ? {
              totalCreditsRequired: settingsData[0].totalCreditsRequired || 60,
              dailyStudyGoalMinutes: settingsData[0].dailyStudyGoalMinutes || 60,
              weeklyGymGoal: settingsData[0].weeklyGymGoal || 3,
              weeklyMovementMinutes: settingsData[0].weeklyMovementMinutes || 90,
              theme: settingsData[0].theme || "dark",
              universityTheme: settingsData[0].universityTheme || "uf",
              targetGpa: settingsData[0].targetGpa || 3.5,
            }
          : {
              totalCreditsRequired: 60,
              dailyStudyGoalMinutes: 60,
              weeklyGymGoal: 3,
              weeklyMovementMinutes: 90,
              theme: "dark",
              universityTheme: "uf",
              targetGpa: 3.5,
            },
      };

      res.json(studentData);
    } catch (error) {
      console.error("Error fetching student data from PostgreSQL:", error);
      res.status(500).json({ error: "Failed to fetch student data" });
    }
  });

  // POST /api/student - Sync full student data to PostgreSQL
  app.post("/api/student", isAuthenticated, async (req, res) => {
    try {
      const studentData: StudentData = req.body;
      const studentId = DEFAULT_STUDENT_ID;

      // Sync all data using database transactions for consistency
      // Delete existing data and re-insert (full sync approach)
      
      // 1. Sync Classes
      await db.delete(classes).where(eq(classes.studentId, studentId));
      if (studentData.classes.length > 0) {
        await db.insert(classes).values(
          studentData.classes.map(c => ({
            id: c.id,
            studentId,
            courseName: c.courseName,
            credits: c.credits,
            status: c.status,
            semester: c.semester,
            estimatedCompletionDate: c.estimatedCompletionDate,
            grade: c.grade,
            gpa: c.gpa,
            instructor: c.instructor,
            passingThreshold: c.passingThreshold,
            currentGradePercent: c.currentGradePercent,
            criticalTracking: c.criticalTracking,
          }))
        );
      }

      // 2. Sync Exams
      await db.delete(exams).where(eq(exams.studentId, studentId));
      if (studentData.exams.length > 0) {
        await db.insert(exams).values(
          studentData.exams.map(e => ({
            id: e.id,
            studentId,
            classId: e.classId,
            categoryId: e.categoryId,
            examName: e.examName,
            examDate: new Date(e.examDate),
            weight: e.weight,
            grade: e.grade,
            gradePercent: e.gradePercent,
            maxScore: e.maxScore,
            score: e.score,
            notes: e.notes,
          }))
        );
      }

      // 3. Sync Grading Categories
      await db.delete(gradingCategories).where(eq(gradingCategories.studentId, studentId));
      if (studentData.gradingCategories.length > 0) {
        await db.insert(gradingCategories).values(
          studentData.gradingCategories.map(gc => ({
            id: gc.id,
            studentId,
            classId: gc.classId,
            name: gc.name,
            weight: gc.weight,
          }))
        );
      }

      // 4. Sync Study Sessions
      await db.delete(studySessions).where(eq(studySessions.studentId, studentId));
      if (studentData.studySessions.length > 0) {
        await db.insert(studySessions).values(
          studentData.studySessions.map(s => ({
            id: s.id,
            studentId,
            classId: s.classId,
            date: new Date(s.date),
            durationMinutes: s.durationMinutes,
            focusDuration: s.focusDuration,
            breakDuration: s.breakDuration,
            sessionType: s.sessionType,
          }))
        );
      }

      // 5. Sync Gym Sessions
      await db.delete(gymSessions).where(eq(gymSessions.studentId, studentId));
      if (studentData.gymSessions.length > 0) {
        await db.insert(gymSessions).values(
          studentData.gymSessions.map(g => ({
            id: g.id,
            studentId,
            date: new Date(g.date),
            durationMinutes: g.durationMinutes,
            type: g.type,
            weight: g.weight,
          }))
        );
      }

      // 6. Sync Happiness Entries
      await db.delete(happinessEntries).where(eq(happinessEntries.studentId, studentId));
      if (studentData.happinessEntries.length > 0) {
        await db.insert(happinessEntries).values(
          studentData.happinessEntries.map(h => ({
            id: h.id,
            studentId,
            date: h.date,
            entry: h.entry,
          }))
        );
      }

      // 7. Sync Daily Tracking
      await db.delete(dailyTracking).where(eq(dailyTracking.studentId, studentId));
      if (studentData.dailyTracking.length > 0) {
        await db.insert(dailyTracking).values(
          studentData.dailyTracking.map(dt => ({
            id: dt.id,
            studentId,
            date: dt.date,
            studyCompleted: dt.studyCompleted,
            movementCompleted: dt.movementCompleted,
            happinessCompleted: dt.happinessCompleted,
          }))
        );
      }

      // 8. Sync Expenses
      await db.delete(expenses).where(eq(expenses.studentId, studentId));
      if (studentData.expenses.length > 0) {
        await db.insert(expenses).values(
          studentData.expenses.map(e => ({
            id: e.id,
            studentId,
            month: e.month,
            category: e.category,
            description: e.description,
            amount: e.amount,
            date: e.date,
            isFixed: e.isFixed,
          }))
        );
      }

      // 9. Sync Income Entries
      await db.delete(incomeEntries).where(eq(incomeEntries.studentId, studentId));
      if (studentData.incomeEntries.length > 0) {
        await db.insert(incomeEntries).values(
          studentData.incomeEntries.map(ie => ({
            id: ie.id,
            studentId,
            amount: ie.amount,
            source: ie.source,
            date: ie.date,
            note: ie.note,
          }))
        );
      }

      // 10. Sync Credit Cards
      await db.delete(creditCards).where(eq(creditCards.studentId, studentId));
      if (studentData.creditCards.length > 0) {
        await db.insert(creditCards).values(
          studentData.creditCards.map(cc => ({
            id: cc.id,
            studentId,
            cardName: cc.cardName,
            balance: cc.balance,
            dueDate: cc.dueDate,
            isPaid: cc.isPaid,
          }))
        );
      }

      // 11. Sync Emergency Fund
      await db.delete(emergencyFund).where(eq(emergencyFund.studentId, studentId));
      await db.insert(emergencyFund).values({
        studentId,
        currentAmount: studentData.emergencyFund.currentAmount,
        targetMonths: studentData.emergencyFund.targetMonths,
      });

      // 12. Sync Emergency Fund Contributions
      await db.delete(emergencyFundContributions).where(eq(emergencyFundContributions.studentId, studentId));
      if (studentData.emergencyFundContributions.length > 0) {
        await db.insert(emergencyFundContributions).values(
          studentData.emergencyFundContributions.map(efc => ({
            id: efc.id,
            studentId,
            amount: efc.amount,
            date: efc.date,
            note: efc.note,
          }))
        );
      }

      // 13. Sync Semesters
      await db.delete(semesters).where(eq(semesters.studentId, studentId));
      if (studentData.semesters.length > 0) {
        await db.insert(semesters).values(
          studentData.semesters.map(s => ({
            id: s.id,
            studentId,
            name: s.name,
            startDate: s.startDate,
            endDate: s.endDate,
            isActive: s.isActive,
            isNew: s.isNew,
          }))
        );
      }

      // 14. Sync Semester Archives
      await db.delete(semesterArchives).where(eq(semesterArchives.studentId, studentId));
      if (studentData.semesterArchives.length > 0) {
        await db.insert(semesterArchives).values(
          studentData.semesterArchives.map(sa => ({
            id: sa.id,
            studentId,
            semesterId: sa.semesterId,
            semesterName: sa.semesterName,
            classCount: sa.classCount,
            completedCredits: sa.completedCredits,
            semesterGpa: sa.semesterGpa,
            totalStudyMinutes: sa.totalStudyMinutes,
            notes: sa.notes,
          }))
        );
      }

      // 15. Sync Settings
      await db.delete(userSettings).where(eq(userSettings.studentId, studentId));
      await db.insert(userSettings).values({
        studentId,
        totalCreditsRequired: studentData.settings.totalCreditsRequired,
        dailyStudyGoalMinutes: studentData.settings.dailyStudyGoalMinutes,
        weeklyGymGoal: studentData.settings.weeklyGymGoal,
        weeklyMovementMinutes: studentData.settings.weeklyMovementMinutes,
        theme: studentData.settings.theme,
        universityTheme: studentData.settings.universityTheme,
        targetGpa: studentData.settings.targetGpa,
      });

      res.json({ success: true, data: studentData });
    } catch (error) {
      console.error("Error saving student data to PostgreSQL:", error);
      res.status(500).json({ error: "Failed to save student data" });
    }
  });

  // ============== CLASSES (shared by studentId) ==============
  app.get("/api/classes", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const classes = await storage.getClasses(studentId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      // Default status to in_progress if not provided
      const status = req.body.status || "in_progress";
      const data = insertClassSchema.parse({ ...req.body, studentId, status });
      const result = await storage.createClass(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(400).json({ error: "Invalid class data" });
    }
  });

  app.patch("/api/classes/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const result = await storage.updateClass(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ error: "Class not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/classes/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteClass(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  // ============== EXAMS (shared by studentId) ==============
  app.get("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const exams = await storage.getExams(studentId);
      res.json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  app.get("/api/classes/:classId/exams", isAuthenticated, async (req, res) => {
    try {
      const exams = await storage.getExamsByClass(req.params.classId);
      res.json(exams);
    } catch (error) {
      console.error("Error fetching exams for class:", error);
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  app.post("/api/exams", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const body = { ...req.body, studentId };
      // Coerce examDate from string to Date if needed
      if (typeof body.examDate === 'string') {
        body.examDate = new Date(body.examDate);
      }
      const data = insertExamSchema.parse(body);
      const result = await storage.createExam(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(400).json({ error: "Invalid exam data" });
    }
  });

  app.patch("/api/exams/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const result = await storage.updateExam(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ error: "Exam not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating exam:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/exams/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteExam(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ error: "Failed to delete exam" });
    }
  });

  // ============== GRADING CATEGORIES (shared by studentId) ==============
  app.get("/api/classes/:classId/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getGradingCategories(req.params.classId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching grading categories:", error);
      res.status(500).json({ error: "Failed to fetch grading categories" });
    }
  });

  app.post("/api/grading-categories", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertGradingCategorySchema.parse({ ...req.body, studentId });
      const result = await storage.createGradingCategory(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating grading category:", error);
      res.status(400).json({ error: "Invalid grading category data" });
    }
  });

  app.patch("/api/grading-categories/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const result = await storage.updateGradingCategory(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ error: "Grading category not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating grading category:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/grading-categories/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteGradingCategory(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting grading category:", error);
      res.status(500).json({ error: "Failed to delete grading category" });
    }
  });

  // ============== STUDY SESSIONS (shared by studentId) ==============
  app.get("/api/study-sessions", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const sessions = await storage.getStudySessions(studentId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      res.status(500).json({ error: "Failed to fetch study sessions" });
    }
  });

  app.get("/api/study-sessions/week", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const sessions = await storage.getStudySessionsForWeek(studentId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching weekly study sessions:", error);
      res.status(500).json({ error: "Failed to fetch weekly study sessions" });
    }
  });

  app.post("/api/study-sessions", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertStudySessionSchema.parse({ ...req.body, studentId });
      const result = await storage.createStudySession(data);
      
      // Update daily tracking
      const today = format(new Date(), "yyyy-MM-dd");
      await storage.updateDailyTracking(studentId, today, { studyCompleted: true });
      
      res.json(result);
    } catch (error) {
      console.error("Error creating study session:", error);
      res.status(400).json({ error: "Invalid study session data" });
    }
  });

  app.delete("/api/study-sessions/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteStudySession(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting study session:", error);
      res.status(500).json({ error: "Failed to delete study session" });
    }
  });

  // ============== INCOME (shared by studentId) ==============
  app.get("/api/income", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const month = req.query.month as string || format(new Date(), "yyyy-MM");
      const incomeData = await storage.getIncome(studentId, month);
      res.json(incomeData);
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ error: "Failed to fetch income" });
    }
  });

  app.post("/api/income", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertIncomeSchema.parse({ ...req.body, studentId });
      const result = await storage.createOrUpdateIncome(data);
      res.json(result);
    } catch (error) {
      console.error("Error updating income:", error);
      res.status(400).json({ error: "Invalid income data" });
    }
  });

  // ============== EXPENSES (shared by studentId) ==============
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const month = req.query.month as string || format(new Date(), "yyyy-MM");
      const expensesData = await storage.getExpenses(studentId, month);
      res.json(expensesData);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertExpenseSchema.parse({ ...req.body, studentId });
      const result = await storage.createExpense(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      await storage.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // ============== CREDIT CARDS (shared by studentId) ==============
  app.get("/api/credit-cards", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const cards = await storage.getCreditCards(studentId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching credit cards:", error);
      res.status(500).json({ error: "Failed to fetch credit cards" });
    }
  });

  app.post("/api/credit-cards", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertCreditCardSchema.parse({ ...req.body, studentId });
      const result = await storage.createCreditCard(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating credit card:", error);
      res.status(400).json({ error: "Invalid credit card data" });
    }
  });

  app.patch("/api/credit-cards/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const result = await storage.updateCreditCard(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ error: "Credit card not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating credit card:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/credit-cards/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      await storage.deleteCreditCard(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting credit card:", error);
      res.status(500).json({ error: "Failed to delete credit card" });
    }
  });

  // ============== EMERGENCY FUND (shared by studentId) ==============
  app.get("/api/emergency-fund", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const fund = await storage.getEmergencyFund(studentId);
      res.json(fund || { currentAmount: 0, targetMonths: 3 });
    } catch (error) {
      console.error("Error fetching emergency fund:", error);
      res.status(500).json({ error: "Failed to fetch emergency fund" });
    }
  });

  app.patch("/api/emergency-fund", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const result = await storage.updateEmergencyFund(studentId, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating emergency fund:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // ============== EMERGENCY FUND CONTRIBUTIONS (shared by studentId) ==============
  app.get("/api/emergency-fund-contributions", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const contributions = await storage.getEmergencyFundContributions(studentId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching emergency fund contributions:", error);
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.post("/api/emergency-fund-contributions", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertEmergencyFundContributionSchema.parse({ ...req.body, studentId });
      const result = await storage.createEmergencyFundContribution(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating emergency fund contribution:", error);
      res.status(400).json({ error: "Invalid contribution data" });
    }
  });

  app.delete("/api/emergency-fund-contributions/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteEmergencyFundContribution(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting emergency fund contribution:", error);
      res.status(500).json({ error: "Failed to delete contribution" });
    }
  });

  // ============== INCOME ENTRIES (shared by studentId) ==============
  app.get("/api/income-entries", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const month = req.query.month as string | undefined;
      const entries = await storage.getIncomeEntries(studentId, month);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching income entries:", error);
      res.status(500).json({ error: "Failed to fetch income entries" });
    }
  });

  app.post("/api/income-entries", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertIncomeEntrySchema.parse({ ...req.body, studentId });
      const result = await storage.createIncomeEntry(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating income entry:", error);
      res.status(400).json({ error: "Invalid income entry data" });
    }
  });

  app.delete("/api/income-entries/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteIncomeEntry(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting income entry:", error);
      res.status(500).json({ error: "Failed to delete income entry" });
    }
  });

  // ============== GYM SESSIONS (shared by studentId) ==============
  app.get("/api/gym-sessions", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const sessions = await storage.getGymSessions(studentId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching gym sessions:", error);
      res.status(500).json({ error: "Failed to fetch gym sessions" });
    }
  });

  app.get("/api/gym-sessions/week", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const sessions = await storage.getGymSessionsForWeek(studentId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching weekly gym sessions:", error);
      res.status(500).json({ error: "Failed to fetch weekly gym sessions" });
    }
  });

  app.post("/api/gym-sessions", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertGymSessionSchema.parse({ ...req.body, studentId });
      const result = await storage.createGymSession(data);
      
      // Update daily tracking
      const today = format(new Date(), "yyyy-MM-dd");
      await storage.updateDailyTracking(studentId, today, { movementCompleted: true });
      
      res.json(result);
    } catch (error) {
      console.error("Error creating gym session:", error);
      res.status(400).json({ error: "Invalid gym session data" });
    }
  });

  app.delete("/api/gym-sessions/:id", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      await storage.deleteGymSession(req.params.id, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gym session:", error);
      res.status(500).json({ error: "Failed to delete gym session" });
    }
  });

  // ============== HAPPINESS (shared by studentId) ==============
  app.get("/api/happiness", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const entries = await storage.getHappinessEntries(studentId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching happiness entries:", error);
      res.status(500).json({ error: "Failed to fetch happiness entries" });
    }
  });

  app.get("/api/happiness/latest", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const entry = await storage.getLatestHappiness(studentId);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching latest happiness:", error);
      res.status(500).json({ error: "Failed to fetch latest happiness" });
    }
  });

  app.post("/api/happiness", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const data = insertHappinessEntrySchema.parse({ ...req.body, studentId });
      const result = await storage.createHappinessEntry(data);
      
      // Update daily tracking
      const today = format(new Date(), "yyyy-MM-dd");
      await storage.updateDailyTracking(studentId, today, { happinessCompleted: true });
      
      res.json(result);
    } catch (error) {
      console.error("Error creating happiness entry:", error);
      res.status(400).json({ error: "Invalid happiness entry data" });
    }
  });

  // ============== DAILY TRACKING (shared by studentId) ==============
  app.get("/api/daily-tracking/today", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const today = format(new Date(), "yyyy-MM-dd");
      const tracking = await storage.getDailyTracking(studentId, today);
      res.json(tracking || {
        studyCompleted: false,
        movementCompleted: false,
        happinessCompleted: false,
      });
    } catch (error) {
      console.error("Error fetching daily tracking:", error);
      res.status(500).json({ error: "Failed to fetch daily tracking" });
    }
  });

  app.get("/api/daily-tracking/recovery-status", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const recentTracking = await storage.getRecentDailyTracking(studentId, 7);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let consecutiveInactiveDays = 0;
      
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const dayRecord = recentTracking.find(t => t.date === dateStr);
        
        const hasAnyActivity = dayRecord && (
          dayRecord.studyCompleted || 
          dayRecord.movementCompleted || 
          dayRecord.happinessCompleted
        );
        
        if (hasAnyActivity) {
          break;
        }
        consecutiveInactiveDays++;
      }
      
      const todayTracking = await storage.getDailyTracking(studentId, format(today, "yyyy-MM-dd"));
      const todayHasActivity = todayTracking && (
        todayTracking.studyCompleted || 
        todayTracking.movementCompleted || 
        todayTracking.happinessCompleted
      );
      
      const recoveryMode = consecutiveInactiveDays >= 2 && !todayHasActivity;
      
      res.json({
        consecutiveInactiveDays,
        recoveryMode,
      });
    } catch (error) {
      console.error("Error fetching recovery status:", error);
      res.status(500).json({ error: "Failed to fetch recovery status" });
    }
  });

  // ============== USER SETTINGS (per student, shared by all users) ==============
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const settings = await storage.getUserSettings(studentId);
      res.json(settings || {
        totalCreditsRequired: 60,
        dailyStudyGoalMinutes: 60,
        weeklyGymGoal: 3,
        weeklyMovementMinutes: 90,
        theme: "dark",
        targetGpa: 3.5,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const result = await storage.updateUserSettings(studentId, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // ============== SEMESTERS ==============
  app.get("/api/semesters", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const semesterList = await storage.getSemesters(studentId);
      res.json(semesterList);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      res.status(500).json({ error: "Failed to fetch semesters" });
    }
  });

  app.get("/api/semesters/active", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const semester = await storage.getActiveSemester(studentId);
      res.json(semester || null);
    } catch (error) {
      console.error("Error fetching active semester:", error);
      res.status(500).json({ error: "Failed to fetch active semester" });
    }
  });

  app.post("/api/semesters", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      
      // Archive current active semester first
      const currentActive = await storage.getActiveSemester(studentId);
      if (currentActive) {
        // Get semester stats for archive
        const allClasses = await storage.getClasses(studentId);
        
        // Match classes by semester name OR in-progress status (current semester's work)
        const semesterClasses = allClasses.filter(c => 
          c.semester === currentActive.name || 
          (c.status === "in_progress" && !c.semester)
        );
        const completedClasses = semesterClasses.filter(c => c.status === "completed");
        const completedCredits = completedClasses.reduce((sum, c) => sum + c.credits, 0);
        
        // Calculate semester GPA
        const classesWithGpa = completedClasses.filter(c => c.gpa !== null);
        const semesterGpa = classesWithGpa.length > 0 && completedCredits > 0
          ? classesWithGpa.reduce((sum, c) => sum + (c.gpa || 0) * c.credits, 0) / completedCredits
          : null;
        
        // Get total study minutes for this semester (filter by semester start date)
        const allStudySessions = await storage.getStudySessions(studentId);
        const semesterStartDate = new Date(currentActive.startDate);
        const semesterStudySessions = allStudySessions.filter(s => 
          new Date(s.date) >= semesterStartDate
        );
        const totalStudyMinutes = semesterStudySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        
        // Create archive
        await storage.createSemesterArchive({
          studentId,
          semesterId: currentActive.id,
          semesterName: currentActive.name,
          classCount: semesterClasses.length,
          completedCredits,
          semesterGpa,
          totalStudyMinutes,
        });
      }
      
      // Create new semester
      const data = insertSemesterSchema.parse({ 
        ...req.body, 
        studentId,
        isActive: true,
        isNew: true,
      });
      const result = await storage.createSemester(data);
      
      // Set as active (deactivates others)
      await storage.setActiveSemester(studentId, result.id);
      
      res.json(result);
    } catch (error) {
      console.error("Error creating semester:", error);
      res.status(400).json({ error: "Invalid semester data" });
    }
  });

  app.post("/api/semesters/:id/activate", isAuthenticated, isStudent, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const result = await storage.setActiveSemester(studentId, req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error activating semester:", error);
      res.status(400).json({ error: "Failed to activate semester" });
    }
  });

  app.post("/api/semesters/:id/dismiss-welcome", isAuthenticated, isStudent, async (req, res) => {
    try {
      const result = await storage.markSemesterNotNew(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error dismissing welcome:", error);
      res.status(400).json({ error: "Failed to dismiss welcome" });
    }
  });

  // ============== SEMESTER ARCHIVES ==============
  app.get("/api/semester-archives", isAuthenticated, async (req, res) => {
    try {
      const studentId = getStudentId(req);
      const archives = await storage.getSemesterArchives(studentId);
      res.json(archives);
    } catch (error) {
      console.error("Error fetching semester archives:", error);
      res.status(500).json({ error: "Failed to fetch semester archives" });
    }
  });

  return httpServer;
}
