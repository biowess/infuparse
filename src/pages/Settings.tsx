import { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('clincalc_settings');
    return saved ? JSON.parse(saved) : {
      precision: 1,
      roundingMode: 'round',
      showBreakdown: true,
      compactDisplay: false,
    };
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('clincalc_settings');
      if (saved) setSettings(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('clincalc_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-20">
      <header className="mb-12">
        <h1 className="text-[40px] md:text-[62px] font-medium tracking-[-2px] leading-[1.1] mb-4">
          Settings
        </h1>
        <p className="text-[18px] text-framer-silver">
          Configure computation preferences and display formats.
        </p>
      </header>

      <div className="space-y-6">
        {/* Precision */}
        <div className="bg-[#090909] border border-white/10 rounded-[15px] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-white font-medium text-[16px] mb-1">Decimal Precision</h3>
              <p className="text-framer-silver text-[14px]">Number of decimal places in final results.</p>
            </div>
            <div className="flex bg-white/5 rounded-[8px] p-1 border border-white/5">
              {[0, 1, 2, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => updateSetting('precision', val)}
                  className={`px-4 py-1.5 rounded-[6px] text-[14px] transition-colors ${
                    settings.precision === val ? 'bg-white/10 text-white' : 'text-framer-silver hover:text-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rounding Mode */}
        <div className="bg-[#090909] border border-white/10 rounded-[15px] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-white font-medium text-[16px] mb-1">Rounding Behavior</h3>
              <p className="text-framer-silver text-[14px]">How intermediate calculations are rounded.</p>
            </div>
            <div className="flex bg-white/5 rounded-[8px] p-1 border border-white/5">
              {[
                { id: 'round', label: 'Round' },
                { id: 'floor', label: 'Floor' },
                { id: 'ceil', label: 'Ceiling' }
              ].map((val) => (
                <button
                  key={val.id}
                  onClick={() => updateSetting('roundingMode', val.id)}
                  className={`px-4 py-1.5 rounded-[6px] text-[14px] transition-colors ${
                    settings.roundingMode === val.id ? 'bg-white/10 text-white' : 'text-framer-silver hover:text-white'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-[#090909] border border-white/10 rounded-[15px] p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-[16px] mb-1">Step-by-Step Breakdown</h3>
              <p className="text-framer-silver text-[14px]">Show intermediate calculation steps by default.</p>
            </div>
            <button
              onClick={() => updateSetting('showBreakdown', !settings.showBreakdown)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.showBreakdown ? 'bg-framer-blue' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.showBreakdown ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-[16px] mb-1">Compact Display</h3>
              <p className="text-framer-silver text-[14px]">Reduce padding and font sizes in results.</p>
            </div>
            <button
              onClick={() => updateSetting('compactDisplay', !settings.compactDisplay)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.compactDisplay ? 'bg-framer-blue' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.compactDisplay ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

