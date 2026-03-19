"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";

interface Package {
  id: string;
  title: string;
  price: any;
}

interface Test {
  id: string;
  name: string;
  description: string | null;
  price: any;
  packages: Package[];
  _count: { packages: number };
}

export default function TestList({ tests }: { tests: Test[] }) {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const { page, setPage, totalPages, paged, totalItems, pageSize } = usePagination(tests, 20);

  return (
    <>
      {/* Scrollable wrapper — allows full table to be viewed on small screens */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Price (NGN)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Packages</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paged.map((test) => (
              <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{test.name}</td>
                <td className="px-6 py-4 text-gray-500 max-w-xs">
                  <span className="line-clamp-2">{test.description || "—"}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  ₦{Number(test.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {test._count.packages > 0 ? (
                    <button
                      onClick={() => setSelectedTest(test)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-primary hover:bg-purple-200 transition-colors"
                    >
                      {test._count.packages} package{test._count.packages !== 1 ? "s" : ""}
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      None
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    href={`/admin/tests/${test.id}/edit`}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {tests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No tests found. Add your first test to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-6 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      </div>

      {/* Packages modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedTest.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Packages using this test — click to open package
                </p>
              </div>
              <button
                onClick={() => setSelectedTest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {selectedTest.packages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No packages use this test.</p>
              ) : (
                selectedTest.packages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/admin/packages/${pkg.id}/detail`}
                    onClick={() => setSelectedTest(null)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-purple-50 transition-colors group"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-primary transition-colors text-sm">
                      {pkg.title}
                    </span>
                    <span className="text-sm font-semibold text-primary shrink-0 ml-4">
                      ₦{Number(pkg.price).toLocaleString()}
                    </span>
                  </Link>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <Link
                href="/admin/packages"
                onClick={() => setSelectedTest(null)}
                className="text-sm text-primary font-semibold hover:underline"
              >
                ← Back to Packages
              </Link>
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
