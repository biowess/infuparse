export default function References() {
  const references = [
    {
      id: 1,
      text: "Marino PL. The ICU Book. 4th ed. Wolters Kluwer; 2014.",
    },
    {
      id: 2,
      text: "Evans L, Rhodes A, Alhazzani W, Antonelli M, Coopersmith CM, French C, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021 Nov;49(11):e1063-e1143.",
    },
    {
      id: 3,
      text: "Lexicomp. Pediatric & Neonatal Lexi-Drugs. In: Lexicomp Online. Hudson, OH: Lexicomp; 2024 [cited 2024 Apr 16].",
    },
    {
      id: 4,
      text: "Institute for Safe Medication Practices (ISMP). ISMP List of Error-Prone Abbreviations, Symbols, and Dose Designations. Horsham (PA): ISMP; 2024 [cited 2026 Apr 16].",
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <header className="mb-16">
        <h1 className="text-[40px] md:text-[62px] font-medium tracking-[-2px] leading-[1.1] mb-6">
          References
        </h1>
        <p className="text-[18px] text-framer-silver leading-relaxed">
          Clinical sources and mathematical foundations used in the development of InfuParse.
        </p>
      </header>

      <div className="space-y-8">
        {references.map((ref) => (
          <div key={ref.id} className="flex gap-6 py-6 border-b border-white/5 last:border-0">
            <span className="text-[15px] font-mono text-framer-blue shrink-0">{ref.id}.</span>
            <p className="text-[16px] text-framer-silver leading-relaxed">
              {ref.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
