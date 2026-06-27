import type { SessionConfig } from "@tanstack/react-start/server";

export const userRoles = ["admin", "reviewer"] as const;
export type UserRole = (typeof userRoles)[number];

export type AppSessionData = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
};

export const sessionConfig: SessionConfig = {
  name: "stackdesk_session",
  password: process.env.SESSION_SECRET ?? "dev-secret-change-me-in-production",
  maxAge: 60 * 60 * 24 * 7,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export function requireAuth(session: AppSessionData | null): AppSessionData {
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function requireReviewer(
  session: AppSessionData | null
): AppSessionData {
  const user = requireAuth(session);
  if (user.role !== "admin" && user.role !== "reviewer") {
    throw new Error("Forbidden");
  }
  return user;
}

export function requireAdmin(session: AppSessionData | null): AppSessionData {
  const user = requireAuth(session);
  if (user.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
  return user;
}
