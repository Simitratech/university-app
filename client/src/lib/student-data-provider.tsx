import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import {
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
  type StudentDataSettings,
  createEmptyStudentData,
} from "@shared/schema";

interface StudentDataContextType {
  studentData: StudentData | null;
  isLoading: boolean;
  error: Error | null;
  saveStudentData: (data: StudentData) => Promise<void>;
  addClass: (classData: Omit<StudentDataClass, "id">) => Promise<void>;
  updateClass: (id: string, updates: Partial<StudentDataClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addExam: (exam: Omit<StudentDataExam, "id">) => Promise<void>;
  updateExam: (id: string, updates: Partial<StudentDataExam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  addGradingCategory: (category: Omit<StudentDataGradingCategory, "id">) => Promise<void>;
  updateGradingCategory: (id: string, updates: Partial<StudentDataGradingCategory>) => Promise<void>;
  deleteGradingCategory: (id: string) => Promise<void>;
  addStudySession: (session: Omit<StudentDataStudySession, "id">) => Promise<void>;
  deleteStudySession: (id: string) => Promise<void>;
  addGymSession: (session: Omit<StudentDataGymSession, "id">) => Promise<void>;
  addHappinessEntry: (entry: Omit<StudentDataHappinessEntry, "id">) => Promise<void>;
  updateDailyTracking: (date: string, updates: Partial<StudentDataDailyTracking>) => Promise<void>;
  addExpense: (expense: Omit<StudentDataExpense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncomeEntry: (entry: Omit<StudentDataIncomeEntry, "id">) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;
  addCreditCard: (card: Omit<StudentDataCreditCard, "id">) => Promise<void>;
  updateCreditCard: (id: string, updates: Partial<StudentDataCreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  updateEmergencyFund: (amount: number, targetMonths?: number) => Promise<void>;
  addEmergencyFundContribution: (contribution: Omit<StudentDataEmergencyFundContribution, "id">) => Promise<void>;
  deleteEmergencyFundContribution: (id: string) => Promise<void>;
  addSemester: (semester: Omit<StudentDataSemester, "id">) => Promise<void>;
  updateSemester: (id: string, updates: Partial<StudentDataSemester>) => Promise<void>;
  setActiveSemester: (id: string) => Promise<void>;
  addSemesterArchive: (archive: Omit<StudentDataSemesterArchive, "id">) => Promise<void>;
  updateSettings: (updates: Partial<StudentDataSettings>) => Promise<void>;
}

const StudentDataContext = createContext<StudentDataContextType | null>(null);

function generateId(): string {
  return crypto.randomUUID();
}

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: studentData, isLoading, error } = useQuery<StudentData>({
    queryKey: ["/api/student"],
    staleTime: 5000, // Data is stale after 5 seconds - allows refetching on tab focus
    retry: 1,
    refetchOnWindowFocus: true, // Critical: refetch when user comes back to the app
  });

  const saveMutation = useMutation({
    mutationFn: async (data: StudentData) => {
      await apiRequest("POST", "/api/student", data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/student"], data);
      // Invalidate to ensure we get latest server state on next refetch
      queryClient.invalidateQueries({ queryKey: ["/api/student"] });
    },
  });

  const saveStudentData = useCallback(async (data: StudentData) => {
    await saveMutation.mutateAsync(data);
  }, [saveMutation]);

  const getStudentData = useCallback((): StudentData => {
    return studentData || createEmptyStudentData();
  }, [studentData]);

  const addClass = useCallback(async (classData: Omit<StudentDataClass, "id">) => {
    const data = getStudentData();
    const newClass: StudentDataClass = {
      ...classData,
      id: generateId(),
    };
    const updated = { ...data, classes: [...data.classes, newClass] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateClass = useCallback(async (id: string, updates: Partial<StudentDataClass>) => {
    const data = getStudentData();
    const updated = {
      ...data,
      classes: data.classes.map(c => c.id === id ? { ...c, ...updates } : c),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteClass = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = {
      ...data,
      classes: data.classes.filter(c => c.id !== id),
      exams: data.exams.filter(e => e.classId !== id),
      gradingCategories: data.gradingCategories.filter(gc => gc.classId !== id),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addExam = useCallback(async (exam: Omit<StudentDataExam, "id">) => {
    const data = getStudentData();
    const newExam: StudentDataExam = { ...exam, id: generateId() };
    const updated = { ...data, exams: [...data.exams, newExam] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateExam = useCallback(async (id: string, updates: Partial<StudentDataExam>) => {
    const data = getStudentData();
    const updated = {
      ...data,
      exams: data.exams.map(e => e.id === id ? { ...e, ...updates } : e),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteExam = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = { ...data, exams: data.exams.filter(e => e.id !== id) };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addGradingCategory = useCallback(async (category: Omit<StudentDataGradingCategory, "id">) => {
    const data = getStudentData();
    const newCategory: StudentDataGradingCategory = { ...category, id: generateId() };
    const updated = { ...data, gradingCategories: [...data.gradingCategories, newCategory] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateGradingCategory = useCallback(async (id: string, updates: Partial<StudentDataGradingCategory>) => {
    const data = getStudentData();
    const updated = {
      ...data,
      gradingCategories: data.gradingCategories.map(gc => gc.id === id ? { ...gc, ...updates } : gc),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteGradingCategory = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = { ...data, gradingCategories: data.gradingCategories.filter(gc => gc.id !== id) };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addStudySession = useCallback(async (session: Omit<StudentDataStudySession, "id">) => {
    const data = getStudentData();
    const newSession: StudentDataStudySession = { ...session, id: generateId() };
    const updated = { ...data, studySessions: [...data.studySessions, newSession] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteStudySession = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = { ...data, studySessions: data.studySessions.filter(s => s.id !== id) };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addGymSession = useCallback(async (session: Omit<StudentDataGymSession, "id">) => {
    const data = getStudentData();
    const newSession: StudentDataGymSession = { ...session, id: generateId() };
    const updated = { ...data, gymSessions: [...data.gymSessions, newSession] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addHappinessEntry = useCallback(async (entry: Omit<StudentDataHappinessEntry, "id">) => {
    const data = getStudentData();
    const newEntry: StudentDataHappinessEntry = { ...entry, id: generateId() };
    const updated = { ...data, happinessEntries: [...data.happinessEntries, newEntry] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateDailyTracking = useCallback(async (date: string, updates: Partial<StudentDataDailyTracking>) => {
    const data = getStudentData();
    const existingIndex = data.dailyTracking.findIndex(dt => dt.date === date);
    let updatedTracking: StudentDataDailyTracking[];
    if (existingIndex >= 0) {
      updatedTracking = data.dailyTracking.map((dt, i) =>
        i === existingIndex ? { ...dt, ...updates } : dt
      );
    } else {
      const newTracking: StudentDataDailyTracking = {
        id: generateId(),
        date,
        studyCompleted: false,
        movementCompleted: false,
        happinessCompleted: false,
        ...updates,
      };
      updatedTracking = [...data.dailyTracking, newTracking];
    }
    const updated = { ...data, dailyTracking: updatedTracking };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addExpense = useCallback(async (expense: Omit<StudentDataExpense, "id">) => {
    const data = getStudentData();
    const newExpense: StudentDataExpense = { ...expense, id: generateId() };
    const updated = { ...data, expenses: [...data.expenses, newExpense] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteExpense = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = { ...data, expenses: data.expenses.filter(e => e.id !== id) };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addIncomeEntry = useCallback(async (entry: Omit<StudentDataIncomeEntry, "id">) => {
    const data = getStudentData();
    const newEntry: StudentDataIncomeEntry = { ...entry, id: generateId() };
    const updated = { ...data, incomeEntries: [...data.incomeEntries, newEntry] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteIncomeEntry = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = { ...data, incomeEntries: data.incomeEntries.filter(e => e.id !== id) };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addCreditCard = useCallback(async (card: Omit<StudentDataCreditCard, "id">) => {
    const data = getStudentData();
    const newCard: StudentDataCreditCard = { ...card, id: generateId() };
    const updated = { ...data, creditCards: [...data.creditCards, newCard] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<StudentDataCreditCard>) => {
    const data = getStudentData();
    const updated = {
      ...data,
      creditCards: data.creditCards.map(c => c.id === id ? { ...c, ...updates } : c),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteCreditCard = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = { ...data, creditCards: data.creditCards.filter(c => c.id !== id) };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateEmergencyFund = useCallback(async (amount: number, targetMonths?: number) => {
    const data = getStudentData();
    const updated = {
      ...data,
      emergencyFund: {
        ...data.emergencyFund,
        currentAmount: amount,
        ...(targetMonths !== undefined && { targetMonths }),
      },
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addEmergencyFundContribution = useCallback(async (contribution: Omit<StudentDataEmergencyFundContribution, "id">) => {
    const data = getStudentData();
    const newContribution: StudentDataEmergencyFundContribution = { ...contribution, id: generateId() };
    const newAmount = data.emergencyFund.currentAmount + contribution.amount;
    const updated = {
      ...data,
      emergencyFundContributions: [...data.emergencyFundContributions, newContribution],
      emergencyFund: { ...data.emergencyFund, currentAmount: newAmount },
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const deleteEmergencyFundContribution = useCallback(async (id: string) => {
    const data = getStudentData();
    const contribution = data.emergencyFundContributions.find(c => c.id === id);
    const newAmount = contribution 
      ? data.emergencyFund.currentAmount - contribution.amount 
      : data.emergencyFund.currentAmount;
    const updated = {
      ...data,
      emergencyFundContributions: data.emergencyFundContributions.filter(c => c.id !== id),
      emergencyFund: { ...data.emergencyFund, currentAmount: Math.max(0, newAmount) },
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addSemester = useCallback(async (semester: Omit<StudentDataSemester, "id">) => {
    const data = getStudentData();
    const newSemester: StudentDataSemester = { ...semester, id: generateId() };
    const updated = { ...data, semesters: [...data.semesters, newSemester] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateSemester = useCallback(async (id: string, updates: Partial<StudentDataSemester>) => {
    const data = getStudentData();
    const updated = {
      ...data,
      semesters: data.semesters.map(s => s.id === id ? { ...s, ...updates } : s),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const setActiveSemester = useCallback(async (id: string) => {
    const data = getStudentData();
    const updated = {
      ...data,
      semesters: data.semesters.map(s => ({
        ...s,
        isActive: s.id === id,
      })),
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const addSemesterArchive = useCallback(async (archive: Omit<StudentDataSemesterArchive, "id">) => {
    const data = getStudentData();
    const newArchive: StudentDataSemesterArchive = { ...archive, id: generateId() };
    const updated = { ...data, semesterArchives: [...data.semesterArchives, newArchive] };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const updateSettings = useCallback(async (updates: Partial<StudentDataSettings>) => {
    const data = getStudentData();
    const updated = {
      ...data,
      settings: { ...data.settings, ...updates },
    };
    await saveStudentData(updated);
  }, [getStudentData, saveStudentData]);

  const value: StudentDataContextType = {
    studentData: studentData || null,
    isLoading,
    error: error as Error | null,
    saveStudentData,
    addClass,
    updateClass,
    deleteClass,
    addExam,
    updateExam,
    deleteExam,
    addGradingCategory,
    updateGradingCategory,
    deleteGradingCategory,
    addStudySession,
    deleteStudySession,
    addGymSession,
    addHappinessEntry,
    updateDailyTracking,
    addExpense,
    deleteExpense,
    addIncomeEntry,
    deleteIncomeEntry,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    updateEmergencyFund,
    addEmergencyFundContribution,
    deleteEmergencyFundContribution,
    addSemester,
    updateSemester,
    setActiveSemester,
    addSemesterArchive,
    updateSettings,
  };

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error("useStudentData must be used within a StudentDataProvider");
  }
  return context;
}
