
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/referral";
import bcrypt from "bcryptjs";
import { z } from "zod";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class AccountDeactivatedError extends CredentialsSignin {
  code = "account_deactivated";
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { role: true },
        });

        if (!existingUser) {
          const userRole = await prisma.customRole.findUnique({ where: { name: 'USER' } });
          if (!userRole) throw new Error('USER role not found');

          const referralCode = await generateReferralCode(user.email!, user.name || undefined);
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              password: "",
              referralCode,
              roleId: userRole.id,
              emailVerified: true, // Google accounts are pre-verified
            },
          });
        } else if (!existingUser.emailVerified) {
          // Auto-verify existing unverified users who sign in via Google
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: true },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role.name as "ADMIN" | "USER" | "SUPERADMIN" | "AGENT";
          token.id = dbUser.id;
          token.referralCode = dbUser.referralCode;
          token.isActive = dbUser.isActive;
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role.name as "ADMIN" | "USER" | "SUPERADMIN" | "AGENT";
          token.id = dbUser.id;
          token.referralCode = dbUser.referralCode;
          token.isActive = dbUser.isActive;
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
        (session.user as any).referralCode = token.referralCode as string | undefined;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const { email, password } = await loginSchema.parseAsync(credentials);
        
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          throw new InvalidCredentialsError();
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          throw new InvalidCredentialsError();
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        if (!user.isActive) {
          throw new AccountDeactivatedError();
        }

        return { ...user, role: user.role.name as "ADMIN" | "USER" | "SUPERADMIN" | "AGENT" };
      },
    }),
  ],
});
