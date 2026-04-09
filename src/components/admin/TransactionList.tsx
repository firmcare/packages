"use client";

import { useState } from "react";
import { User, Calendar, Tag, FileX2 } from "lucide-react";
import Pagination, { PageSizeSelector } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import DateRangeFilter, { DateRange, inRange } from "@/components/ui/DateRangeFilter";
import { fmtNgn } from "@/lib/format";

interface Transaction {
  id: string;
  amount: any;
  discount: any;
  finalAmount: any;
  paymentMethod: string;
  status: string;
  reference: string | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    name: string | null;
    email: string | null;
  };
  booking: {
    id: string;
    date: string;
  };
  promo: {
    code: string;
  } | null;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

  const filteredTransactions = transactions.filter((txn) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      txn.user.name?.toLowerCase().includes(q) ||
      txn.user.email?.toLowerCase().includes(q) ||
      txn.reference?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || txn.status === statusFilter;
    const matchesMethod = methodFilter === "ALL" || txn.paymentMethod === methodFilter;
    const matchesDate = inRange(txn.createdAt, dateRange.from, dateRange.to);
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const { page, setPage, totalPages, paged, totalItems, pageSize, setPageSize } = usePagination(filteredTransactions, 20);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "CARD":
        return "bg-purple-100 text-purple-800";
      case "BANK_TRANSFER":
        return "bg-blue-100 text-blue-800";
      case "CASH":
        return "bg-green-100 text-green-800";
      case "WALLET":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by user, email, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="ALL">All Methods</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="WALLET">Wallet</option>
          </select>
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
        <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <FileX2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">No transactions found</p>
          <p className="text-xs mt-1">Try adjusting your search, status, method, or date filter</p>
        </div>
      ) : (
      <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Final Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paged.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {txn.user.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">{txn.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">
                    {txn.reference || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {fmtNgn(txn.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {fmtNgn(txn.discount)}
                  </div>
                  {txn.promo && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Tag className="w-3 h-3" />
                      {txn.promo.code}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {fmtNgn(txn.finalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodColor(
                      txn.paymentMethod
                    )}`}
                  >
                    {txn.paymentMethod.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      txn.status
                    )}`}
                  >
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 pb-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      </>
      )}
    </div>
  );
}

