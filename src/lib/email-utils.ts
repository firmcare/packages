/**
 * Normalise an email address by stripping plus-addressing from the local part.
 * e.g.  a+1@gmail.com  →  a@gmail.com
 */
export function normalizeEmail(email: string): string {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return email.toLowerCase().trim();
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  return `${local.split("+")[0]}@${domain}`.toLowerCase().trim();
}

/**
 * Prisma OR filter that matches both the normalised address AND any
 * plus-addressed variant that may already exist in the database.
 *
 * Usage:
 *   prisma.user.findFirst({ where: emailVariantsFilter(normalizeEmail(raw)) })
 */
export function emailVariantsFilter(normalised: string) {
  const atIndex = normalised.lastIndexOf("@");
  const local = normalised.slice(0, atIndex);
  const domain = normalised.slice(atIndex + 1);
  return {
    OR: [
      { email: normalised },
      {
        AND: [
          { email: { startsWith: `${local}+` } },
          { email: { endsWith: `@${domain}` } },
        ],
      },
    ],
  };
}
