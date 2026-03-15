import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import TransactionList from "@/components/admin/TransactionList";

async function getTransactions() {
  return await prisma.transaction.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
      booking: {
        select: { id: true, date: true },
      },
      promo: {
        select: { code: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getTransactionStats() {
  const [totalRevenue, completedCount, pendingCount, failedCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { finalAmount: true },
    }),
    prisma.transaction.count({ where: { status: "COMPLETED" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "FAILED" } }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.finalAmount || 0,
    completedCount,
    pendingCount,
    failedCount,
  };
}

export default async function TransactionsPage() {
  await requireAdmin();
  const [transactions, stats] = await Promise.all([
    getTransactions(),
    getTransactionStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-2">Monitor all payment transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
          <h3 className="text-2xl font-bold text-green-600">
            ₦{Number(stats.totalRevenue).toLocaleString()}
          </h3>
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

