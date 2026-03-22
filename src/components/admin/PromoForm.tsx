"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PromoFormProps {
  packages: { id: string; title: string }[];
  initialData?: {
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
    isActive: boolean;
    applyToAll: boolean;
  };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function PromoForm({ packages, initialData }: PromoFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const today = todayStr();
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    description: initialData?.description || "",
    discountType: initialData?.discountType || "PERCENTAGE",
    discountValue: initialData?.discountValue ? Number(initialData.discountValue) : 0,
    minAmount: initialData?.minAmount ? Number(initialData.minAmount) : 0,
    maxDiscount: initialData?.maxDiscount ? Number(initialData.maxDiscount) : 0,
    validFrom: initialData?.validFrom
      ? new Date(initialData.validFrom).toISOString().split("T")[0]
      : "",
    validUntil: initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().split("T")[0]
      : "",
    usageLimit: initialData?.usageLimit || 0,
    isActive: initialData?.isActive ?? true,
    applyToAll: initialData?.applyToAll ?? false,
    packageIds: [] as string[],
  });

  const minValidUntil = (() => {
    if (!formData.validFrom) return today;
    const d = new Date(formData.validFrom);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData ? `/api/promos/${initialData.id}` : "/api/promos";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          usageLimit: formData.usageLimit || null,
          minAmount: formData.minAmount || null,
          maxDiscount: formData.maxDiscount || null,
          packageIds: formData.applyToAll ? undefined : formData.packageIds,
        }),
      });

      if (response.ok) {
        toast.success(initialData ? "Promo updated successfully." : "Promo created successfully.");
        router.push("/admin/promos");
        router.refresh();
      } else {
        const error = await response.text();
        toast.error(`Error: ${error}`);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Promo Code *
        </label>
        <input
          type="text"
          required
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
          placeholder="SUMMER2026"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Summer discount for all packages"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Type *
          </label>
          <select
            required
            value={formData.discountType}
            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Value * {formData.discountType === "PERCENTAGE" ? "(%)" : "(₦)"}
          </label>
          {formData.discountType === "FIXED" ? (
            <input
              type="text"
              inputMode="numeric"
              required
              value={formData.discountValue ? Number(formData.discountValue).toLocaleString("en-NG") : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                  setFormData({ ...formData, discountValue: raw === "" ? 0 : parseFloat(raw) });
                }
              }}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          ) : (
            <input
              type="number"
              required
              min="0"
              step="0.01"
              max="100"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </div>
      </div>

      {formData.discountType === "PERCENTAGE" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Amount (₦)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Discount (₦)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid From *
          </label>
          <input
            type="date"
            required
            min={today}
            value={formData.validFrom}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value, validUntil: formData.validUntil && e.target.value > formData.validUntil ? "" : formData.validUntil })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid Until *
          </label>
          <input
            type="date"
            required
            min={minValidUntil}
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usage Limit (leave 0 for unlimited)
        </label>
        <input
          type="number"
          min="0"
          value={formData.usageLimit}
          onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="applyToAll"
            checked={formData.applyToAll}
            onChange={(e) => setFormData({ ...formData, applyToAll: e.target.checked, packageIds: [] })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="applyToAll" className="text-sm font-medium text-gray-700">
            Apply to all packages
          </label>
        </div>

        {!formData.applyToAll && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Packages *
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`pkg-${pkg.id}`}
                    checked={formData.packageIds.includes(pkg.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, packageIds: [...formData.packageIds, pkg.id] });
                      } else {
                        setFormData({ ...formData, packageIds: formData.packageIds.filter(id => id !== pkg.id) });
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={`pkg-${pkg.id}`} className="text-sm text-gray-700">
                    {pkg.title}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Promo"}
        </button>
      </div>
    </form>
  );
}

