const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE = "https://api.paystack.co";

function headers() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  };
}

export async function getNigerianBanks(): Promise<{ code: string; name: string }[]> {
  const res = await fetch(`${BASE}/bank?country=nigeria&perPage=100`, {
    headers: headers(),
    next: { revalidate: 86400 }, // cache 24h
  });
  const data = await res.json();
  return data.data ?? [];
}

export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<{ accountName: string; accountNumber: string } | null> {
  const res = await fetch(
    `${BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: headers() }
  );
  const data = await res.json();
  if (!data.status) return null;
  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
  };
}

export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string
): Promise<string> {
  const res = await fetch(`${BASE}/transferrecipient`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message ?? "Failed to create recipient");
  return data.data.recipient_code;
}

export async function initiateTransfer(
  recipientCode: string,
  amountNaira: number,
  reference: string,
  reason: string
): Promise<{ transferCode: string; status: string }> {
  const res = await fetch(`${BASE}/transfer`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      source: "balance",
      reason,
      amount: Math.round(amountNaira * 100), // kobo
      recipient: recipientCode,
      reference,
    }),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message ?? "Transfer failed");
  return {
    transferCode: data.data.transfer_code,
    status: data.data.status,
  };
}

export async function verifyTransfer(
  transferCode: string
): Promise<"success" | "failed" | "pending"> {
  const res = await fetch(`${BASE}/transfer/${transferCode}`, {
    headers: headers(),
  });
  const data = await res.json();
  const status = data.data?.status;
  if (status === "success") return "success";
  if (status === "failed" || status === "reversed") return "failed";
  return "pending";
}
