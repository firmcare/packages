import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import TransactionList from "@/components/admin/TransactionList";

export default async function TransactionsPage() {
  await requireAdmin();
  const { transactions, stats } = await adminFetch<any>("/api/admin/transactions");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-2">Monitor all payment transactions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
          <h3 className="text-2xl font-bold text-green-600">₦{Number(stats.totalRevenue).toLocaleString()}</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Completed</p>
          <h3 className="text-2xl font-bold text-green-600">{stats.completedCount}</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Pending</p>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Failed</p>
          <h3 className="text-2xl font-bold text-red-600">{stats.failedCount}</h3>
        </div>
      </div>
      <TransactionList transactions={transactions} />
    </div>
  );
}
