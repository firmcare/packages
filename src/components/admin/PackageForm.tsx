"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Upload, ImageIcon, Search, CheckSquare, Square, Loader2, Edit } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

interface Category {
  id: string;
  name: string;
}

interface Test {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  price: any;
}

interface PackageFormProps {
  categories: Category[];
  tests: Test[];
  initialData?: {
    id: string;
    title: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    price: any;
    imageUrl: string | null;
    categoryId: string;
    tests: { id: string }[];
  };
  readOnly?: boolean;
}

export default function PackageForm({ categories, tests, initialData, readOnly = false }: PackageFormProps) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testSearch, setTestSearch] = useState("");

  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price ? Number(initialData.price) : 0,
    imageUrl: initialData?.imageUrl ?? "",
    categoryId: initialData?.categoryId ?? "",
    testIds: initialData?.tests.map((t) => t.id) ?? [],
  });

  // ── Cloudinary upload ──────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get a signed upload signature from our API
      const sigRes = await fetch("/api/upload/signature", { method: "POST" });
      if (!sigRes.ok) throw new Error("Failed to get upload signature");
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      // 2. Upload directly to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();

      setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
    } catch (err) {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Test selection ─────────────────────────────────────────────────────────
  const toggleTest = (testId: string) => {
    setFormData((prev) => ({
      ...prev,
      testIds: prev.testIds.includes(testId)
        ? prev.testIds.filter((id) => id !== testId)
        : [...prev.testIds, testId],
    }));
  };

  const filteredTests = tests.filter((t) =>
    t.name.toLowerCase().includes(testSearch.toLowerCase())
  );

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData ? `/api/packages/${initialData.id}` : "/api/packages";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(initialData ? "Package updated successfully." : "Package created successfully.");
        router.push("/admin/packages");
        router.refresh();
      } else {
        const error = await response.text();
        toast.error(`Error: ${error}`);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Basic info ── */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Package Details</h2>
          {readOnly && initialData && (
            <button
              type="button"
              onClick={() => router.push(`/admin/packages/${initialData.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#8a3a7a] text-sm font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Female Wellness Screening"
            disabled={readOnly}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this package includes and who it's for…"
            disabled={readOnly}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none disabled:bg-gray-50 disabled:text-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
              }
              disabled={readOnly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              disabled={readOnly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white disabled:bg-gray-50 disabled:text-gray-700"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Image upload ── */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Package Image</h2>

        {/* Preview */}
        {formData.imageUrl ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={formData.imageUrl}
              alt="Package preview"
              fill
              className="object-cover"
            />
            {!readOnly && <button
              type="button"
              onClick={() => setFormData({ ...formData, imageUrl: "" })}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-center">
              <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No image selected</p>
            </div>
          </div>
        )}

        {/* Upload button */}
        {!readOnly && <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700 ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading…" : "Upload Image"}
          </label>

          <span className="text-xs text-gray-400">or paste a URL below</span>
        </div>}

        {/* Manual URL fallback */}
        {!readOnly && <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
        />}
      </div>

      {/* ── Tests selection ── */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Included Tests
            {formData.testIds.length > 0 && (
              <span className="ml-2 text-sm font-normal text-primary">
                ({formData.testIds.length} selected)
              </span>
            )}
          </h2>
          {!readOnly && formData.testIds.length > 0 && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, testIds: [] }))}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        {!readOnly && <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={testSearch}
            onChange={(e) => setTestSearch(e.target.value)}
            placeholder="Search tests…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
          />
        </div>}

        {/* Checkbox list */}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {filteredTests.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No tests found</p>
          ) : (
            filteredTests.map((test) => {
              const selected = formData.testIds.includes(test.id);
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => !readOnly && toggleTest(test.id)}
                  disabled={readOnly}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selected
                      ? "bg-purple-50 border border-primary/30"
                      : readOnly ? "border border-transparent" : "hover:bg-gray-50 border border-transparent"
                  } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                >
                  {selected ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className={`text-sm ${selected ? "text-primary font-medium" : "text-gray-700"}`}>
                    {test.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      {!readOnly && <div className="flex items-center justify-end gap-4 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? "Saving…" : initialData ? "Update Package" : "Create Package"}
        </button>
      </div>}
    </form>
  );
}


