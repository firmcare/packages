import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER" | "SUPERADMIN" | "AGENT";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "USER" | "SUPERADMIN" | "AGENT";
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "USER" | "SUPERADMIN" | "AGENT";
    referralCode?: string;
  }
}
