const CLIENTS = [
  {
    name: 'Healthcare International',
    initials: 'HI',
    color: '#2e7d32',
  },
  {
    name: 'Adcem Healthcare',
    initials: 'AH',
    color: '#1565c0',
  },
  {
    name: 'Songhai Health Trust Ltd.',
    initials: 'SH',
    color: '#4a148c',
  },
  {
    name: 'Custodian',
    initials: 'CU',
    color: '#b71c1c',
  },
  {
    name: 'TAJ Bank',
    initials: 'TB',
    color: '#e65100',
  },
  {
    name: 'Transcorp',
    initials: 'TC',
    color: '#006064',
  },
  {
    name: 'Jaiz Bank',
    initials: 'JB',
    color: '#1b5e20',
  },
  {
    name: 'TETFUND',
    initials: 'TF',
    color: '#37474f',
  },
];

export default function ClientsSection() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
          Our clients
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {CLIENTS.map((client) => (
            <div
              key={client.name}
              className="bg-white border border-gray-100 rounded-sm flex flex-col items-center justify-center gap-3 py-8 px-4 hover:shadow-md transition-shadow duration-200"
            >
              {/* Avatar-style logo placeholder */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ backgroundColor: client.color }}
              >
                {client.initials}
              </div>
              <span className="text-xs font-semibold text-gray-600 text-center leading-snug">
                {client.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
