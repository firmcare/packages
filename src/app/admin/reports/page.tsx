import { requireAdmin } from "@/lib/auth-utils";
import { FileText, Download } from "lucide-react";

const reports = [
  {
    title: "Monthly Revenue Report",
    description: "Detailed breakdown of revenue by month",
    type: "revenue",
  },
  {
    title: "Booking Summary Report",
    description: "Summary of all bookings with status breakdown",
    type: "bookings",
  },
  {
    title: "User Activity Report",
    description: "User registration and activity metrics",
    type: "users",
  },
  {
    title: "Package Performance Report",
    description: "Analysis of package popularity and revenue",
    type: "packages",
  },
  {
    title: "Promo Code Usage Report",
    description: "Promotional code usage and discount analytics",
    type: "promos",
  },
];

export default async function ReportsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download business reports as CSV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                <a
                  href={`/api/reports/${report.type}`}
                  download
                  className="flex items-center gap-2 text-sm text-primary hover:text-[#8a3a7a] font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Custom Reports</h3>
        <p className="text-sm text-blue-700 mb-4">
          Need a custom report? Contact the development team to create specialized reports
          tailored to your specific needs.
        </p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Request Custom Report
        </button>
      </div>
    </div>
  );
}
