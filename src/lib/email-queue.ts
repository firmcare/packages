import { prisma } from "./prisma";
import { sendGeneralEmail } from "./email";

const ROLE_FILTER: Record<string, string[]> = {
  users:  ["USER"],
  agents: ["AGENT"],
  admins: ["ADMIN", "SUPERADMIN"],
};

async function resolveRecipients(
  recipientType: string,
  specificEmails: string[]
): Promise<Array<{ email: string; unsubscribeToken: string | null }>> {
  if (recipientType === "specific") {
    return specificEmails.map((email) => ({ email, unsubscribeToken: null }));
  }
  const roleNames = ROLE_FILTER[recipientType];
  const users = await prisma.user.findMany({
    where: {
      emailUnsubscribed: false,
      ...(roleNames ? { role: { name: { in: roleNames } } } : {}),
    },
    select: { email: true, unsubscribeToken: true },
  });
  return users.filter((u) => u.email) as Array<{ email: string; unsubscribeToken: string | null }>;
}

export async function processNextEmailJob() {
  // Claim the oldest queued job atomically
  const job = await prisma.emailBroadcastJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return;

  await prisma.emailBroadcastJob.update({
    where: { id: job.id },
    data: { status: "PROCESSING" },
  });

  try {
    const specificEmails = job.specificEmails
      ? (JSON.parse(job.specificEmails) as string[])
      : [];

    const recipients = await resolveRecipients(job.recipientType, specificEmails);

    await prisma.emailBroadcastJob.update({
      where: { id: job.id },
      data: { totalRecipients: recipients.length },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const unsubUrl = recipient.unsubscribeToken
        ? `${baseUrl}/api/email/unsubscribe?token=${recipient.unsubscribeToken}`
        : null;
      const result = await sendGeneralEmail(recipient.email, job.subject, job.htmlContent, unsubUrl);
      if (result.success) sent++;
      else failed++;

      // Persist progress every 10 emails so UI updates in near-real-time
      if ((sent + failed) % 10 === 0) {
        await prisma.emailBroadcastJob.update({
          where: { id: job.id },
          data: { sent, failed },
        });
      }
    }

    await prisma.emailBroadcastJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", sent, failed },
    });
  } catch (err) {
    await prisma.emailBroadcastJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
