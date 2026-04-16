export default function About() {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <header className="mb-16">
        <h1 className="text-[40px] md:text-[62px] font-medium tracking-[-2px] leading-[1.1] mb-6">
          About InfuParse
        </h1>
        <p className="text-[18px] text-framer-silver leading-relaxed">
          The methodology behind the clinical computation engine.
        </p>
      </header>

      <article className="prose prose-invert prose-p:text-framer-silver prose-p:leading-relaxed prose-headings:text-white prose-headings:font-medium prose-headings:tracking-tight prose-a:text-framer-blue prose-strong:text-white max-w-none">
        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">What the app does</h2>
          <p>
            InfuParse is a specialized computation engine designed to parse ICU-style infusion expressions and compute infusion rates with high precision and safety. It eliminates the need for complex forms by allowing clinicians to type expressions in a natural, shorthand format.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-[32px] tracking-[-1px] mb-6">Key Features</h2>
          <ul className="list-disc pl-5 space-y-3 text-framer-silver">
            <li>
              <strong className="text-white">Multi-drug parsing:</strong> Handle multiple medications in a single expression (e.g., "dopamine + norepinephrine").
            </li>
            <li>
              <strong className="text-white">Safe partial execution:</strong> If one part of an expression is invalid, the engine still computes the valid components.
            </li>
            <li>
              <strong className="text-white">Ambiguity detection:</strong> Identifies and flags unclear or conflicting input patterns.
            </li>
            <li>
              <strong className="text-white">Confidence scoring:</strong> Provides a transparency score for every calculation based on the explicitness of the input.
            </li>
          </ul>
        </section>

        <section className="mb-12 p-6 bg-framer-blue/5 border border-framer-blue/20 rounded-[12px]">
          <h2 className="text-[20px] font-medium text-white mb-4 flex items-center gap-2">
            Disclaimer
          </h2>
          <p className="text-[15px] text-framer-silver mb-0">
            InfuParse is an educational tool designed for learning and verification purposes. It is <strong>not</strong> intended for clinical decision-making or direct patient care. Drug names are treated as labels for calculation purposes only. Always verify calculations manually according to institutional protocols.
          </p>
        </section>

       <section className="mb-12">
  <h2 className="text-[32px] tracking-[-1px] mb-6">License</h2>

  <div className="bg-[#090909] border border-white/10 rounded-[8px] p-6 font-mono text-[13px] text-framer-silver leading-relaxed">
    <p className="mb-4 text-white font-medium">Apache License 2.0</p>

    <p>Copyright (c) 2026 Biowess</p>

    <p className="mt-4">
      Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance
      with the License. You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
    </p>

    <p className="mt-4">
      Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
      on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
      for the specific language governing permissions and limitations under the License.
    </p>
  </div>
</section>
      </article>
    </div>
  );
}
