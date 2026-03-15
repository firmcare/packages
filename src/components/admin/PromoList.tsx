"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

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

  const filteredPromos = promos.filter((promo) =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (!confirm("Are you sure you want to delete this promo code?")) return;

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
      <div className="p-6 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search promo codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

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
            {filteredPromos.map((promo) => (
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
                      : `₦${Number(promo.discountValue).toLocaleString()}`}
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
                      onClick={() => handleDelete(promo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
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
    </div>
  );
}

