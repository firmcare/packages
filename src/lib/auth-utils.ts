import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkPermission } from './permissions';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/admin/login");
  }
  
  const user = await import('@/lib/prisma').then(m => m.prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  }));

  if (!user || (user.role.name !== 'ADMIN' && user.role.name !== 'SUPERADMIN')) {
    redirect("/");
  }
  
  return session;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/admin/login");
  }
  
  const user = await import('@/lib/prisma').then(m => m.prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  }));

  if (!user || user.role.name !== 'SUPERADMIN') {
    redirect("/admin");
  }
  
  return session;
}

export async function requirePermission(resource: string, action: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const hasPermission = await checkPermission(
    session.user.id,
    resource as any,
    action as any
  );
  
  if (!hasPermission) {
    redirect("/");
  }
  
  return session;
}

export async function requireAgent() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await import('@/lib/prisma').then(m => m.prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  }));

  const r = user?.role.name;
  if (!r || (r !== 'AGENT' && r !== 'ADMIN' && r !== 'SUPERADMIN')) {
    redirect("/dashboard");
  }

  return session;
}

export function isAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function isSuperAdmin(role?: string) {
  return role === "SUPERADMIN";
}

export function hasPermission(userRole?: string, requiredRole?: "ADMIN" | "SUPERADMIN") {
  if (!userRole) return false;
  if (requiredRole === "SUPERADMIN") {
    return userRole === "SUPERADMIN";
  }
  return userRole === "ADMIN" || userRole === "SUPERADMIN";
}

