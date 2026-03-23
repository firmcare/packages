"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Eye, Ban, CheckCircle, Loader2, PackageX } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Package {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: any;
  imageUrl: string | null;
  isActive: boolean;
  category: {
    name: string;
  };
  tests: any[];
  _count: {
    bookings: number;
  };
}

interface PackageListProps {
  packages: Package[];
}

export default function PackageList({ packages: initialPackages }: PackageListProps) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [packageList, setPackageList] = useState(initialPackages);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; isActive: boolean } | null>(null);

  const filteredPackages = packageList.filter((pkg) =>
    pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const { page, setPage, totalPages, paged, totalItems, pageSize } = usePagination(filteredPackages, 15);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "disable" : "enable";
    setTogglingId(id);
    setPackageList((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, isActive: !currentStatus } : pkg))
    );

    try {
      const response = await fetch(`/api/packages/${id}/toggle`, { method: "PATCH" });

      if (response.ok) {
        toast.success(`Package ${action}d successfully.`);
      } else {
        setPackageList((prev) =>
          prev.map((pkg) => (pkg.id === id ? { ...pkg, isActive: currentStatus } : pkg))
        );
        toast.error(`Failed to ${action} package`);
      }
    } catch {
      setPackageList((prev) =>
        prev.map((pkg) => (pkg.id === id ? { ...pkg, isActive: currentStatus } : pkg))
      );
      toast.error("An error occurred");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-primary rounded-lg focus:ring-2 focus:border-transparent"
        />
      </div>

      {filteredPackages.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <PackageX className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">No packages found</p>
          <p className="text-xs mt-1">Try adjusting your search or add a new package</p>
        </div>
      ) : (
      <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bookings
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
            {paged.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {pkg.imageUrl && (
                      <Image
                        src={pkg.imageUrl}
                        alt={pkg.title}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{pkg.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{pkg.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pkg.category.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₦{Number(pkg.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pkg.tests.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pkg._count.bookings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pkg.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {pkg.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/packages/${pkg.id}/detail`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/packages/${pkg.id}/edit`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setConfirmToggle({ id: pkg.id, isActive: pkg.isActive })}
                      disabled={togglingId === pkg.id}
                      className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        pkg.isActive
                          ? "text-orange-600 hover:bg-orange-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={pkg.isActive ? "Disable" : "Enable"}
                    >
                      {togglingId === pkg.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : pkg.isActive ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
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
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? "Disable this package?" : "Enable this package?"}
        description={
          confirmToggle?.isActive
            ? "This package will no longer be visible to users and cannot be booked."
            : "This package will become visible to users and available for booking."
        }
        confirmLabel={confirmToggle?.isActive ? "Yes, Disable" : "Yes, Enable"}
        variant={confirmToggle?.isActive ? "danger" : "warning"}
        onConfirm={() => {
          if (confirmToggle) handleToggleActive(confirmToggle.id, confirmToggle.isActive);
          setConfirmToggle(null);
        }}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  );
}

