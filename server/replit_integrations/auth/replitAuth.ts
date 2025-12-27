import session from "express-session";
import type { Express, RequestHandler, Request } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import type { User } from "@shared/models/auth";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const secret = process.env.SESSION_SECRET || "fallback-secret-change-in-production";
  
  return session({
    secret: secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login/Register endpoint - creates or finds user by name
  // All users are attached to the SINGLE student record
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { name, role } = req.body;

      // Validate inputs
      const trimmedName = name?.trim();

      if (!trimmedName || !role) {
        return res.status(400).json({ message: "Name and role are required" });
      }

      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }

      if (!["student", "parent"].includes(role)) {
        return res.status(400).json({ message: "Role must be 'student' or 'parent'" });
      }

      // Get or create the single student record
      let student = await authStorage.getStudent();
      
      if (!student) {
        // Only create student if role is student (first student user creates the student)
        if (role === "student") {
          student = await authStorage.createStudent("Michael");
        } else {
          // Parent cannot create student - must wait for student to register first
          return res.status(400).json({ message: "A student must register first before parents can join" });
        }
      }

      // Find existing user or create new one by name
      let user = await authStorage.getUserByName(trimmedName);
      
      if (user) {
        // Existing user found - update role and ensure they have studentId attached
        const updates: any = { role };
        if (!user.studentId && student) {
          updates.studentId = student.id;
        }
        user = await authStorage.updateUser(user.id, updates);
      } else {
        // Create new user with selected role, attached to the student
        const uniqueId = `${trimmedName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}@app.local`;
        user = await authStorage.createUser({
          email: uniqueId,
          firstName: trimmedName,
          role,
          studentId: student.id,
        });
      }

      if (!user) {
        return res.status(500).json({ message: "Failed to create user" });
      }

      // Set session userId
      req.session.userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await authStorage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await authStorage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to check if user is a student (can create entries)
export const isStudent: RequestHandler = async (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.currentUser.role !== "student") {
    return res.status(403).json({ message: "Only students can perform this action" });
  }
  
  next();
};
