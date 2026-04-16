export default function Docs() {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <header className="mb-16">
        <h1 className="text-[40px] md:text-[62px] font-medium tracking-[-2px] leading-[1.1] mb-6">
          Documentation
        </h1>
        <p className="text-[18px] text-framer-silver leading-relaxed">
          A comprehensive guide to the InfuParse infusion computation engine, parsing logic, and safety tiers.
        </p>
      </header>

      <article className="prose prose-invert prose-p:text-framer-silver prose-p:leading-relaxed prose-headings:text-white prose-headings:font-medium prose-headings:tracking-tight prose-a:text-framer-blue prose-strong:text-white max-w-none">
        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">1. Overview</h2>
          <p>
            InfuParse is a specialized ICU infusion expression parser. It is designed to take unstructured clinical shorthand—the kind often used in high-acuity environments—and convert it into precise, structured infusion rates (mL/hr).
          </p>
          <p>
            The engine uses a multi-pass regex pipeline to identify drugs, doses, weights, and concentrations, allowing for a "natural language" approach to clinical math.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">2. Input Syntax Examples</h2>
          <p>The parser is flexible but follows a logical structure. Here are the primary patterns recognized:</p>
          
          <div className="space-y-6 my-8">
            <div className="bg-[#090909] border border-white/10 rounded-[12px] p-6">
              <h4 className="text-[14px] uppercase tracking-widest text-framer-blue mb-3 font-semibold">Weight-Based Infusion</h4>
              <code className="block bg-white/5 p-3 rounded text-[15px] mb-3">dopamine 5 mcg/kg/min 70kg 400mg in 250mL</code>
              <p className="text-[13px] text-framer-silver">Computes the mL/hr rate for a weight-based dose given a specific concentration.</p>
            </div>

            <div className="bg-[#090909] border border-white/10 rounded-[12px] p-6">
              <h4 className="text-[14px] uppercase tracking-widest text-framer-blue mb-3 font-semibold">Volume Over Time</h4>
              <code className="block bg-white/5 p-3 rounded text-[15px] mb-3">1000 mL over 8 hr</code>
              <p className="text-[13px] text-framer-silver">Simple conversion of a total volume and duration into a continuous hourly rate.</p>
            </div>

            <div className="bg-[#090909] border border-white/10 rounded-[12px] p-6">
              <h4 className="text-[14px] uppercase tracking-widest text-framer-blue mb-3 font-semibold">Fixed Rate Infusion</h4>
              <code className="block bg-white/5 p-3 rounded text-[15px] mb-3">propofol 20 mg/hr 1000mg in 100mL</code>
              <p className="text-[13px] text-framer-silver">Computes the rate for a non-weight-based dose (e.g., mg/hr or units/hr).</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">3. Multi-Drug Parsing</h2>
          <p>
            InfuParse supports simultaneous calculation of multiple medications. You can separate distinct infusion definitions using "+" or "and".
          </p>
          <div className="bg-[#090909] border border-white/10 rounded-[12px] p-6 my-6">
            <code className="block bg-white/5 p-3 rounded text-[14px] text-framer-blue mb-3">
              dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg
            </code>
            <p className="text-[13px] text-framer-silver italic">
              Note: Each drug is isolated and computed independently. If one drug is invalid, the engine will still return results for the valid components (Safe Partial Execution).
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">4. Shared Concentration Behavior</h2>
          <p>
            In clinical practice, multiple drugs are often mixed in the same bag. InfuParse recognizes markers like "same bag" or "shared solution" to apply a single concentration to multiple dose rates.
          </p>
          <div className="bg-[#090909] border border-white/10 rounded-[12px] p-6 my-6">
            <code className="block bg-white/5 p-3 rounded text-[14px] text-framer-blue mb-3">
              fentanyl 50mcg/hr + midazolam 2mg/hr + 100mg/100mg in 100mL same bag
            </code>
            <p className="text-[13px] text-framer-silver">
              The engine will apply the 100mg/100mL concentration to both the fentanyl and midazolam rates respectively.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">5. Error Types</h2>
          <p>The engine classifies failures into three distinct categories to help the user identify missing data:</p>
          <ul className="space-y-4 list-none pl-0">
            <li className="bg-white/5 p-4 rounded-[8px] border-l-4 border-yellow-500">
              <strong className="text-white block mb-1">Incomplete</strong>
              <span className="text-[14px] text-framer-silver">Essential data is missing for the requested calculation (e.g., a weight-based dose without a weight).</span>
            </li>
            <li className="bg-white/5 p-4 rounded-[8px] border-l-4 border-framer-blue">
              <strong className="text-white block mb-1">Ambiguous</strong>
              <span className="text-[14px] text-framer-silver">The input structure is unclear or tokens cannot be safely assigned to a single meaning.</span>
            </li>
            <li className="bg-white/5 p-4 rounded-[8px] border-l-4 border-red-500">
              <strong className="text-white block mb-1">Invalid</strong>
              <span className="text-[14px] text-framer-silver">Mathematically impossible or clinically unsafe values (e.g., negative numbers or division by zero).</span>
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">6. Confidence System</h2>
          <p>Every result is assigned a confidence score based on the explicitness of the input:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { score: '100%', desc: 'Fully explicit input, no inference required.' },
              { score: '90%', desc: 'Shared concentration based on explicit marker.' },
              { score: '80%', desc: 'Drug alias normalized or minor context inference.' },
              { score: '70%', desc: 'Messy input safely resolved via heuristics.' },
              { score: '0%', desc: 'Incomplete, ambiguous, or unsafe input.' }
            ].map((item) => (
              <div key={item.score} className="bg-[#090909] border border-white/5 p-4 rounded-[10px] flex items-center gap-4">
                <span className="text-framer-blue font-mono font-bold text-[18px]">{item.score}</span>
                <span className="text-[13px] text-framer-silver leading-tight">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 p-8 bg-framer-blue/5 border border-framer-blue/20 rounded-[15px]">
          <h2 className="text-[20px] font-medium text-white mb-4 uppercase tracking-widest text-[12px]">Important Limitations</h2>
          <p className="text-[14px] text-framer-silver mb-4">
            InfuParse is a computational aid, not a clinical decision support system.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[14px] text-framer-silver">
            <li>No clinical validation is performed on dose ranges or drug safety.</li>
            <li>Drug names are treated as labels for calculation purposes only.</li>
            <li>The engine does not account for patient-specific factors like renal function.</li>
            <li>Designed strictly for educational and verification purposes.</li>
          </ul>
        </section>
      </article>
    </div>
  );
}

