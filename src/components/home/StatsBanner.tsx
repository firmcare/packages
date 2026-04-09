import { STATS } from '@/lib/constants';

export default function StatsBanner() {
  return (
    <div className="w-full bg-primary py-5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex justify-center gap-0">
        {STATS.map((stat, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center flex-1 ${
              idx > 0 ? 'border-l border-white/30' : ''
            }`}
          >
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</span>
            <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider mt-0.5 text-center px-2">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
