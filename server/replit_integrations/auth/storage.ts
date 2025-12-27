import { users, students, type User, type Student } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(data: { email: string; firstName: string; role: string; studentId: string }): Promise<User>;
  updateUser(id: string, data: { firstName?: string; role?: string; studentId?: string }): Promise<User | undefined>;
  
  // Student management
  getStudent(): Promise<Student | undefined>;
  createStudent(name: string): Promise<Student>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firstName, name));
    return user;
  }

  async createUser(data: { email: string; firstName: string; role: string; studentId: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email,
      firstName: data.firstName,
      role: data.role,
      studentId: data.studentId,
    }).returning();
    return user;
  }

  async updateUser(id: string, data: { firstName?: string; role?: string; studentId?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Get the single student (there should only be one)
  async getStudent(): Promise<Student | undefined> {
    const [student] = await db.select().from(students).limit(1);
    return student;
  }

  // Create the single student record
  async createStudent(name: string): Promise<Student> {
    const [student] = await db.insert(students).values({ name }).returning();
    return student;
  }
}

export const authStorage = new AuthStorage();
