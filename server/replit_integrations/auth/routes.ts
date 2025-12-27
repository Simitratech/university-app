import type { Express } from "express";

// Auth routes are now registered in setupAuth (replitAuth.ts)
// This file is kept for backwards compatibility
export function registerAuthRoutes(_app: Express): void {
  // All auth routes are registered in setupAuth
}
