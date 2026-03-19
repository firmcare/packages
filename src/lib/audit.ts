import { prisma } from "@/lib/prisma";

export interface AuditOptions {
  resourceName?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function logAudit(
  actorId: string,
  action: string,
  resource: string,
  resourceId?: string | null,
  detail?: string | null,
  options?: AuditOptions
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        resource,
        resourceId: resourceId ?? null,
        detail: detail ?? null,
        resourceName: options?.resourceName ?? null,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
        ip: options?.ip ?? null,
      },
    });
  } catch {
    // Audit logging must never break the main operation
  }
}
