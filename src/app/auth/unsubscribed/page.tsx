import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Unsubscribed</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              You have been successfully unsubscribed from promotional emails. You will still receive
              important transactional emails related to your bookings and account.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Link</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              This unsubscribe link is invalid or has already been used.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
