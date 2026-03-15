interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export default function RevenueChart({ monthlyRevenue }: { monthlyRevenue: MonthlyRevenue[] }) {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);
  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">
            ₦{totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      {totalRevenue === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <p className="text-sm">No revenue data yet</p>
          <p className="text-xs mt-1">Revenue will appear here once bookings are made</p>
        </div>
      ) : (
        <div className="space-y-4">
          {monthlyRevenue.map(({ month, revenue }) => {
            const pct = (revenue / maxRevenue) * 100;
            const label = revenue >= 1_000_000
              ? `₦${(revenue / 1_000_000).toFixed(1)}M`
              : revenue >= 1_000
              ? `₦${(revenue / 1_000).toFixed(0)}k`
              : `₦${revenue}`;

            return (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-10 shrink-0 text-right">{month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${Math.max(pct, revenue > 0 ? 8 : 0)}%` }}
                  >
                    {pct >= 20 && (
                      <span className="text-xs text-white font-medium whitespace-nowrap">{label}</span>
                    )}
                  </div>
                </div>
                {pct < 20 && (
                  <span className="text-xs text-gray-600 font-medium w-16 shrink-0">{revenue > 0 ? label : '—'}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
