"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Tag, ToggleLeft, ToggleRight, FlagOff } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import Pagination, { PageSizeSelector } from "@/components/ui/Pagination";
import { fmtNgn } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Promo {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: any;
  minAmount: any;
  maxDiscount: any;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

interface PromoListProps {
  promos: Promo[];
}

export default function PromoList({ promos }: PromoListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPromos = promos.filter((promo) =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const { page, setPage, totalPages, paged, totalItems, pageSize, setPageSize } = usePagination(filteredPromos, 20);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/promos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Promo ${currentStatus ? "deactivated" : "activated"} successfully.`);
        router.refresh();
      } else {
        toast.error("Failed to update promo");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/promos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Promo deleted successfully.");
        router.refresh();
      } else {
        toast.error("Failed to delete promo");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const isExpired = (date: Date) => new Date(date) < new Date();
  const isUpcoming = (date: Date) => new Date(date) > new Date();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search promo codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {filteredPromos.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <FlagOff className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">No promo codes found</p>
          <p className="text-xs mt-1">Try adjusting your search or create a new promo code</p>
        </div>
      ) : (
      <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valid Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paged.map((promo) => (
              <tr key={promo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{promo.code}</div>
                      <div className="text-sm text-gray-500">{promo.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {promo.discountType === "PERCENTAGE"
                      ? `${Number(promo.discountValue)}%`
                      : fmtNgn(Number(promo.discountValue))}
                  </div>
                  {promo.maxDiscount && (
                    <div className="text-xs text-gray-500">
                      Max: ₦{Number(promo.maxDiscount).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{new Date(promo.validFrom).toLocaleDateString()}</div>
                  <div className="text-gray-500">to {new Date(promo.validUntil).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {promo.usageCount} / {promo.usageLimit || "∞"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promo.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                    {isExpired(promo.validUntil) && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                    {isUpcoming(promo.validFrom) && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Upcoming
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(promo.id, promo.isActive)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title={promo.isActive ? "Deactivate" : "Activate"}
                    >
                      {promo.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <Link
                      href={`/admin/promos/${promo.id}/edit`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => promo.usageCount === 0 && setConfirmDeleteId(promo.id)}
                      disabled={promo.usageCount > 0}
                      className={`p-2 rounded-lg ${promo.usageCount > 0 ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
                      title={promo.usageCount > 0 ? "Cannot delete — promo has been used" : "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete this promo code?"
        description="This promo code will be permanently removed and can no longer be applied at checkout."
        confirmLabel="Yes, Delete"
        onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

