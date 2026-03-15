export async function generateReferralCode(email: string, name?: string): Promise<string> {
  const base = name ? name.slice(0, 3).toUpperCase() : email.slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
  return (base + timestamp).slice(0, 6);
}
