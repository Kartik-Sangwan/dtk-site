// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-security";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const ip = req ? getClientIp(req) : "unknown";
        const limitByIp = checkRateLimit(`auth:login:ip:${ip}`, {
          windowMs: 10 * 60 * 1000,
          max: 20,
          blockMs: 15 * 60 * 1000,
        });
        if (!limitByIp.ok) return null;

        const limitByEmail = checkRateLimit(`auth:login:email:${email}`, {
          windowMs: 10 * 60 * 1000,
          max: 8,
          blockMs: 15 * 60 * 1000,
        });
        if (!limitByEmail.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
            emailVerified: true,
          },
        });

        if (!user?.email || !user.passwordHash || !user.emailVerified) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      await prisma.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: "CUSTOMER",
          emailVerified: account?.provider === "google" ? new Date() : null,
        },
        update: {
          name: user.name ?? null,
          image: user.image ?? null,
          ...(account?.provider === "google" ? { emailVerified: new Date() } : {}),
        },
      });

      return true;
    },

    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          (token as typeof token & { uid?: string; role?: string }).uid = dbUser.id;
          (token as typeof token & { uid?: string; role?: string }).role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as typeof token & { uid?: string; role?: string };
      if (session.user && t.uid) {
        (session.user as typeof session.user & { id?: string; role?: string }).id = t.uid;
        (session.user as typeof session.user & { id?: string; role?: string }).role = t.role;
      }
      return session;
    },
  },
});
