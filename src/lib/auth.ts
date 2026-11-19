import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SHORT_SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours default
const LONG_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days when Remember Me checked

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            status: true,
            stationId: true,
          },
        });

        // Reject if user not found or account deactivated
        if (!user || user.status !== "AKTIF") {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          stationId: user.stationId,
          rememberMe:
            credentials.rememberMe === "1" ||
            credentials.rememberMe === true ||
            (credentials.rememberMe as string) === "true",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.stationId = (user as any).stationId;
        token.rememberMe = (user as any).rememberMe ?? false;
        token.loginAt = Date.now();
        return token;
      }
      // Enforce short vs long expiry. Cookie ceiling is 30d (session.maxAge),
      // so short sessions must be killed here when they pass 8h.
      const loginAt =
        (token.loginAt as number | undefined) ??
        (typeof token.iat === "number" ? token.iat * 1000 : Date.now());
      const maxAgeMs = token.rememberMe ? LONG_SESSION_MS : SHORT_SESSION_MS;
      if (Date.now() - loginAt > maxAgeMs) {
        return null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.stationId = token.stationId as string | null;
        (session.user as any).rememberMe = (token as any).rememberMe ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30-day cookie ceiling; jwt() enforces 8h default
    updateAge: 24 * 60 * 60, // sliding refresh once per day while active
  },
});

// Type augmentation for Auth.js v5
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      stationId: string | null;
      rememberMe?: boolean;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role: string;
    stationId: string | null;
    rememberMe?: boolean;
    loginAt?: number;
  }
}
