import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight, Loader2, BookmarkPlus, AlertCircle, Info, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { computeExpression, CalcResult } from '../lib/compute';
import { cn } from '../lib/utils';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [isComputing, setIsComputing] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const examples = [
    "dopamine 5 mcg/kg/min 70kg 400mg in 250mL",
    "100 mL over 2 hr",
    "500 mg in 100 mL"
  ];

  const handleCompute = (e?: React.FormEvent, q: string = query) => {
    e?.preventDefault();
    if (!q.trim()) return;

    setIsComputing(true);
    setHasSearched(true);
    setIsBookmarked(false);
    
    // Read settings from localStorage
    const savedSettings = localStorage.getItem('clincalc_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      precision: 1,
      roundingMode: 'round',
      showBreakdown: true,
      compactDisplay: false,
    };

    // Simulate slight delay for "processing" feel
    setTimeout(() => {
      const res = computeExpression(q, settings);
      setResult(res);
      setIsComputing(false);
      setSearchParams({ q });
    }, 400);
  };

  const currentSettings = (() => {
    const saved = localStorage.getItem('clincalc_settings');
    return saved ? JSON.parse(saved) : {
      precision: 1,
      roundingMode: 'round',
      showBreakdown: true,
      compactDisplay: false,
    };
  })();

  useEffect(() => {
    inputRef.current?.focus();
    if (initialQuery) {
      handleCompute(undefined, initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetQuery = () => {
    setQuery('');
    setResult(null);
    setHasSearched(false);
    setIsBookmarked(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleCompute(undefined, example);
  };

  const saveBookmark = () => {
    if (!result || !result.isComplete) return;
    
    const saved = localStorage.getItem('clincalc_bookmarks');
    const bookmarks = saved ? JSON.parse(saved) : [];
    
    const newBookmark = {
      id: Date.now().toString(),
      query,
      result: result.finalResult,
      date: new Date().toISOString()
    };
    
    localStorage.setItem('clincalc_bookmarks', JSON.stringify([newBookmark, ...bookmarks]));
    setIsBookmarked(true);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      {/* Hero / Input Area */}
      <div className={cn(
        "w-full transition-all duration-500 ease-in-out flex flex-col items-center",
        hasSearched ? "mt-0 mb-12" : "mt-[15vh] mb-8"
      )}>
        {!hasSearched && (
          <div className="text-center mb-10">
            <h1 className="text-[40px] md:text-[62px] font-medium tracking-[-2px] leading-[1.1] mb-4">
              Clinical Computation
            </h1>
            <p className="text-framer-silver text-[18px] max-w-xl mx-auto">
              Type a medical expression, infusion rate, or dose calculation.
            </p>
          </div>
        )}

        <form onSubmit={handleCompute} className="w-full relative group">
          <div className="absolute inset-0 bg-framer-blue/5 rounded-[20px] blur-xl transition-opacity opacity-0 group-focus-within:opacity-100" />
          <div className="relative flex items-center w-full bg-[#090909] border border-white/10 rounded-[20px] shadow-ring-contained focus-within:shadow-ring focus-within:border-framer-blue/50 transition-all overflow-hidden">
            <div className="pl-6 pr-3 text-framer-silver">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., dopamine 5 mcg/kg/min 70kg 400mg in 250mL"
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30",
                currentSettings.compactDisplay ? "py-3 text-[16px]" : "py-5 text-[18px]"
              )}
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              disabled={!query.trim() || isComputing}
              className="mr-3 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
            >
              {isComputing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </form>

        {!hasSearched && (
          <div className="mt-8 flex flex-wrap justify-center gap-3 w-full">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(ex)}
                className="text-[13px] text-framer-silver bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-[40px] transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Area */}
      {hasSearched && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={resetQuery}
              className="text-[14px] text-framer-silver hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              New Query
            </button>
          </div>
          {isComputing ? (
            <div className="flex flex-col items-center justify-center py-20 text-framer-silver">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-framer-blue" />
              <p className="text-[15px]">Parsing and computing...</p>
            </div>
          ) : result ? (
            <div className="w-full bg-[#090909] border border-white/10 rounded-[15px] overflow-hidden shadow-floating">
              {/* Result Header */}
              <div className={cn(
                "border-b border-white/5 flex justify-between items-start",
                currentSettings.compactDisplay ? "p-4 md:p-5" : "p-6 md:p-8"
              )}>
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-framer-silver text-[14px] font-medium uppercase tracking-wider">Computed Result</h3>
                    {result.isComplete && (
                      <button
                        onClick={saveBookmark}
                        disabled={isBookmarked}
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          isBookmarked 
                            ? "text-framer-blue bg-framer-blue/10" 
                            : "text-framer-silver hover:text-white bg-white/5 hover:bg-white/10"
                        )}
                        title={isBookmarked ? "Saved to bookmarks" : "Bookmark result"}
                      >
                        {isBookmarked ? <Check className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  
                  {result.branches && result.branches.length > 0 ? (
                    <div className="space-y-6">
                      {result.branches.map((branch, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-framer-silver text-[16px] font-medium">{branch.label}</span>
                            <span className={cn("text-[12px] px-2 py-1 rounded-full", branch.confidence >= 90 ? "bg-green-500/10 text-green-400" : branch.confidence >= 70 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400")}>
                              {branch.confidence}% Confidence
                            </span>
                          </div>
                          <div className={cn(
                            "font-medium tracking-tight leading-none text-white",
                            currentSettings.compactDisplay ? "text-[24px] md:text-[32px]" : "text-[32px] md:text-[40px]"
                          )}>
                            {branch.result}
                          </div>
                          {branch.warnings.length > 0 && (
                            <div className="text-[13px] text-framer-blue/80 mt-1">
                              {branch.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : result.isComplete ? (
                    <div className={cn(
                      "font-medium tracking-tight leading-none text-white",
                      currentSettings.compactDisplay ? "text-[32px] md:text-[40px]" : "text-[40px] md:text-[50px]"
                    )}>
                      {result.finalResult}
                    </div>
                  ) : (
                    <div className="text-[24px] font-medium text-white flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-framer-blue" />
                      Incomplete Expression
                    </div>
                  )}
                </div>
              </div>

              {/* Warning / Notes */}
              {result.warning && (
                <div className="px-6 md:px-8 py-4 bg-framer-blue/10 border-b border-framer-blue/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-framer-blue shrink-0 mt-0.5" />
                  <p className="text-[14px] text-white/90 leading-relaxed">{result.warning}</p>
                </div>
              )}

              {/* Breakdown */}
              {currentSettings.showBreakdown && result.isComplete && result.breakdown.length > 0 && (
                <div className={cn(
                  currentSettings.compactDisplay ? "p-4 md:p-5" : "p-6 md:p-8"
                )}>
                  <h4 className="text-[15px] font-medium text-white mb-6 flex items-center gap-2">
                    <Info className="w-4 h-4 text-framer-silver" />
                    Step-by-step Breakdown
                  </h4>
                  <div className="space-y-1">
                    {result.breakdown.map((step, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:justify-between py-3 border-b border-white/5 last:border-0 gap-1 md:gap-4">
                        <span className="text-framer-silver text-[14px]">{step.step}</span>
                        <span className="text-white text-[14px] font-mono">{step.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

