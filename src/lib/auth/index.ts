import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { compare } from "bcryptjs";
import { getNext6AM } from "@/lib/utils/blockUntil";

const STALE_SESSION_MS = 15 * 60 * 1000; // 15 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user?.passwordHash) return null;
        const ok = await compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        if (user.status !== "ACTIVE") return null;
        // Email verification disabled for now

        // Technician: bloqueo hasta 6am si se desconectó sin Punch Out
        if (user.role === "TECHNICIAN") {
          const now = new Date();
          if (user.blockedUntil && now < user.blockedUntil) {
            return null; // cliente debe mostrar "Bloqueado hasta mañana 6:00"
          }
          if (user.blockedUntil && now >= user.blockedUntil) {
            // Use raw SQL to avoid Prisma client issue with column 'new'
            await prisma.$executeRaw`
              UPDATE "User"
              SET "blockedUntil" = NULL,
                  "updatedAt" = ${now}::timestamptz(6)
              WHERE "id" = ${user.id}
            `;
          }
          // ¿Tiene sesión activa sin ubicación reciente? → bloquear hasta 6am
          const activeSession = await prisma.workSession.findFirst({
            where: { technicianId: user.id, isActive: true },
            include: {
              locations: {
                orderBy: { timestamp: "desc" },
                take: 1,
              },
            },
          });
          if (activeSession) {
            const lastLocationAt = activeSession.locations[0]?.timestamp;
            const lastActivity = lastLocationAt ?? activeSession.startTime;
            if (now.getTime() - new Date(lastActivity).getTime() > STALE_SESSION_MS) {
              const next6AM = getNext6AM();
              // Update work session first
              await prisma.workSession.update({
                where: { id: activeSession.id },
                data: { isActive: false, endTime: now },
              });
              // Then update user using raw SQL to avoid Prisma client issue with column 'new'
              await prisma.$executeRaw`
                UPDATE "User"
                SET "blockedUntil" = ${next6AM}::timestamptz(3),
                    "updatedAt" = ${now}::timestamptz(6)
                WHERE "id" = ${user.id}
              `;
              return null; // sesión cerrada y usuario bloqueado hasta 6am
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/tech/login",
  },
  session: { strategy: "jwt" },
  trustHost: true, // Required for Vercel and other serverless hosts
};
