// compute.ts
export type ComputeSettings = {
  precision?: number;
  roundingMode?: 'round' | 'floor' | 'ceil';
  compactDisplay?: boolean;
  showBreakdown?: boolean;
};

export type CalcResult = {
  parsed: Record<string, any>;
  normalized: Record<string, any>;
  finalResult: string;
  breakdown: { step: string; value: string }[];
  note?: string;
  warning?: string;
  isComplete: boolean;
  branches?: {
    label: string;
    result: string;
    confidence: number;
    warnings: string[];
  }[];
};

// ==========================================
// DRUG DATABASE
// ==========================================
const DRUG_DB: Record<string, string[]> = {
  norepinephrine: ['noradrenaline', 'levophed', 'norepi'],
  epinephrine: ['adrenaline', 'epi'],
  dopamine: ['inotropin'],
  dobutamine: ['dobutrex'],
  vasopressin: ['pitressin', 'vaso'],
  phenylephrine: ['neo-synephrine', 'neo'],
  milrinone: ['primacor'],
  nitroprusside: ['nipride'],
  nitroglycerin: ['tridil', 'ntg'],
  amiodarone: ['cordarone'],
  diltiazem: ['cardizem'],
  esmolol: ['brevibloc'],
  labetalol: ['trandate'],
  nicardipine: ['cardene'],
  clevidipine: ['cleviprex'],
  propofol: ['diprivan'],
  dexmedetomidine: ['precedex'],
  midazolam: ['versed'],
  lorazepam: ['ativan'],
  ketamine: ['ketalar'],
  fentanyl: ['sublimaze'],
  remifentanil: ['ultiva'],
  morphine: ['duramorph'],
  hydromorphone: ['dilaudid'],
  heparin: ['unfractionated heparin', 'ufh'],
  argatroban: ['acova'],
  bivalirudin: ['angiomax'],
  alteplase: ['tpa', 'activase'],
  insulin: ['regular insulin', 'humulin r', 'novolin r'],
  octreotide: ['sandostatin'],
  pantoprazole: ['protonix'],
  furosemide: ['lasix'],
  bumetanide: ['bumex'],
  chlorothiazide: ['diuril'],
  cisatracurium: ['nimbex'],
  rocuronium: ['zemuron'],
  vecuronium: ['norcuron'],
  succinylcholine: ['anectine'],
  dexrazoxane: ['zinecard'],
  isoproterenol: ['isuprel'],
  lidocaine: ['xylocaine'],
  procainamide: ['pronestyl'],
  magnesium: ['magnesium sulfate', 'mag'],
  calcium: ['calcium chloride', 'calcium gluconate'],
  potassium: ['potassium chloride', 'kcl'],
  sodium: ['sodium bicarbonate', 'bicarb'],
  albumin: ['albuminar']
};

const ALL_DRUG_ALIASES = Object.entries(DRUG_DB).flatMap(([main, aliases]) => [main, ...aliases]);
// Sort by length descending to match longest aliases first
ALL_DRUG_ALIASES.sort((a, b) => b.length - a.length);
const DRUG_REGEX = new RegExp(`\\b(${ALL_DRUG_ALIASES.join('|')})\\b`, 'gi');

function getCanonicalDrugName(alias: string): string {
  const lower = alias.toLowerCase();
  for (const [main, aliases] of Object.entries(DRUG_DB)) {
    if (main === lower || aliases.includes(lower)) return main;
  }
  return lower;
}

// ==========================================
// INTERNAL TYPES
// ==========================================
type EntityType = 'dose_rate' | 'weight' | 'concentration' | 'vol_time' | 'amount' | 'volume' | 'time' | 'drug_name';

type BaseEntity = { type: EntityType; raw: string };
type DoseRateEntity = BaseEntity & { type: 'dose_rate'; value: number; massUnit: string; weightBased: boolean; timeUnit: string };
type WeightEntity = BaseEntity & { type: 'weight'; value: number; unit: string };
type ConcentrationEntity = BaseEntity & { type: 'concentration'; drugValue: number; drugUnit: string; volValue: number; volUnit: string };
type VolTimeEntity = BaseEntity & { type: 'vol_time'; volValue: number; volUnit: string; timeValue: number; timeUnit: string };
type AmountEntity = BaseEntity & { type: 'amount'; value: number; unit: string };
type VolumeEntity = BaseEntity & { type: 'volume'; value: number; unit: string };
type TimeEntity = BaseEntity & { type: 'time'; value: number; unit: string };
type DrugNameEntity = BaseEntity & { type: 'drug_name'; name: string };

type Entity = DoseRateEntity | WeightEntity | ConcentrationEntity | VolTimeEntity | AmountEntity | VolumeEntity | TimeEntity | DrugNameEntity;

type ComputationPath =
  | { type: 'complete_infusion'; doseRate: DoseRateEntity; weight?: WeightEntity; concentration: ConcentrationEntity; confidence: number; warnings: string[] }
  | { type: 'vol_time_infusion'; volTime: VolTimeEntity; confidence: number; warnings: string[] }
  | { type: 'vol_time_implicit'; volume: VolumeEntity; time: TimeEntity; confidence: number; warnings: string[] }
  | { type: 'concentration_only'; concentration: ConcentrationEntity; confidence: number; warnings: string[] }
  | { type: 'concentration_implicit'; amount: AmountEntity; volume: VolumeEntity; confidence: number; warnings: string[] }
  | { type: 'standalone_dose'; amount: AmountEntity; confidence: number; warnings: string[] }
  | { type: 'incomplete'; reason: string }
  | { type: 'ambiguous'; reason: string };

type Context = {
  weight?: WeightEntity;
  concentration?: ConcentrationEntity;
  amount?: AmountEntity;
  volume?: VolumeEntity;
  time?: TimeEntity;
  drugName?: string;
  isSharedConcentration?: boolean;
  isMultiDrug?: boolean;
};

// ==========================================
// 1. NORMALIZATION LAYER
// ==========================================
function normalizeInput(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(/μg|ug/g, 'mcg');
  s = s.replace(/\bcc\b/g, 'ml');
  s = s.replace(/\bh\b|\bhours?\b/g, 'hr');
  s = s.replace(/\bm\b|\bmins?\b|\bminutes?\b/g, 'min');
  s = s.replace(/\biu\b/g, 'units');
  s = s.replace(/\s*\/\s*/g, '/');
  s = s.replace(/\s*\*\s*/g, ' * ');
  s = s.replace(/(?<=\d)\s*x\s*(?=\d)/g, ' * ');
  s = s.replace(/(?<=\s|^)x(?=\s|$)/g, ' * ');
  s = s.replace(/(?<=\s|^)x\s*(?=\d)/g, ' * ');
  s = s.replace(/(?<=\d)\s*x(?=\s|$)/g, ' * ');
  return s;
}

// ==========================================
// 2. SEGMENTATION LAYER
// ==========================================
// Safely splits independent expressions to prevent drug/branch contamination
function segmentExpressions(normalized: string): string[] {
  // Split by explicit separators that indicate new clinical chains
  return normalized
    .split(/(?:\s*(?:\+|and|&|,|\n)\s*)+/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ==========================================
// 3. EXTRACTION LAYER
// ==========================================
function extractEntities(segment: string): Entity[] {
  const entities: Entity[] = [];
  let remaining = segment;

  // Known drug names for context
  remaining = remaining.replace(DRUG_REGEX, (match) => {
    const canonical = getCanonicalDrugName(match);
    entities.push({ type: 'drug_name', name: canonical, raw: match });
    return ' ';
  });

  // Concentration (in X mL)
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|units)\s+in\s+(\d+(?:\.\d+)?)\s*(ml|l)/g, (match, v1, u1, v2, u2) => {
    entities.push({ type: 'concentration', drugValue: parseFloat(v1), drugUnit: u1, volValue: parseFloat(v2), volUnit: u2, raw: match });
    return ' ';
  });

  // Vol/Time (over X hr/min)
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(ml|l)\s+over\s+(\d+(?:\.\d+)?)\s*(hr|min)/g, (match, v1, u1, v2, u2) => {
    entities.push({ type: 'vol_time', volValue: parseFloat(v1), volUnit: u1, timeValue: parseFloat(v2), timeUnit: u2, raw: match });
    return ' ';
  });

  // Direct Concentration (mg/mL)
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|units)\/(ml|l)/g, (match, v1, u1, u2) => {
    entities.push({ type: 'concentration', drugValue: parseFloat(v1), drugUnit: u1, volValue: 1, volUnit: u2, raw: match });
    return ' ';
  });

  // Vol/Time shorthand (e.g. 250mL/hr)
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(ml|l)\/(?:(\d+(?:\.\d+)?)\s*)?(hr|min)/g, (match, v1, u1, v2, u2) => {
    entities.push({ type: 'vol_time', volValue: parseFloat(v1), volUnit: u1, timeValue: v2 ? parseFloat(v2) : 1, timeUnit: u2, raw: match });
    return ' ';
  });

  // Dose rate (mcg/kg/min or mg/hr)
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|units)\/((?:kg\/)?)(min|hr)/g, (match, v1, u1, k, u2) => {
    entities.push({ type: 'dose_rate', value: parseFloat(v1), massUnit: u1, weightBased: !!k, timeUnit: u2, raw: match });
    return ' ';
  });

  // Weight
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(kg)/g, (match, v1, u1) => {
    entities.push({ type: 'weight', value: parseFloat(v1), unit: u1, raw: match });
    return ' ';
  });

  // Standalone properties
  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(mcg|mg|g|units)(?!\w)/g, (match, v1, u1) => {
    entities.push({ type: 'amount', value: parseFloat(v1), unit: u1, raw: match });
    return ' ';
  });

  remaining = remaining.replace(/(\d+(?:\.\d+)?)\s*(ml|l)(?!\w)/g, (match, v1, u1) => {
    entities.push({ type: 'volume', value: parseFloat(v1), unit: u1, raw: match });
    return ' ';
  });

  remaining.replace(/(\d+(?:\.\d+)?)\s*(hr|min)(?!\w)/g, (match, v1, u1) => {
    entities.push({ type: 'time', value: parseFloat(v1), unit: u1, raw: match });
    return ' ';
  });

  return entities;
}

// ==========================================
// 4. DEPENDENCY GRAPH FUSION
// ==========================================
function buildSegmentGraph(entities: Entity[], raw: string, context: Context): ComputationPath {
  const get = <T extends EntityType>(type: T) => entities.filter(e => e.type === type) as Extract<Entity, { type: T }>[];
  
  const doseRates = get('dose_rate');
  const weights = get('weight');
  const concs = get('concentration');
  const volTimes = get('vol_time');
  const amounts = get('amount');
  const volumes = get('volume');
  const times = get('time');

  let confidence = 100;
  const warnings: string[] = [];

  // Update context with new explicit findings
  if (weights.length > 0) context.weight = weights[0];
  if (concs.length > 0) context.concentration = concs[0];
  if (amounts.length > 0) context.amount = amounts[0];
  if (volumes.length > 0) context.volume = volumes[0];
  if (times.length > 0) context.time = times[0];

  // Complete Infusion Priority
  if (doseRates.length > 0) {
    const drugNames = get('drug_name');
    const uniqueDrugs = new Set(drugNames.map(d => d.name));
    if (uniqueDrugs.size > 1 || doseRates.length > 1) {
      return { type: 'ambiguous', reason: 'Multiple drugs or dose rates detected in a single segment without clear separation.' };
    }

    const dr = doseRates[0];
    let w = weights[0];
    if (!w && dr.weightBased) {
      if (context.weight) {
        if (!context.isMultiDrug) {
          w = context.weight;
          confidence = Math.min(confidence, 80);
          warnings.push('Patient weight inferred from context.');
        } else if (context.isSharedConcentration) {
          w = context.weight;
          confidence = Math.min(confidence, 90);
          warnings.push('Patient weight shared based on explicit marker.');
        } else {
          return { type: 'incomplete', reason: 'Missing patient weight (explicit per-drug requirement).' };
        }
      }
    }

    let conc = concs[0];
    if (!conc && context.concentration) {
      if (!context.isMultiDrug) {
        conc = context.concentration;
        confidence = Math.min(confidence, 80);
        warnings.push('Concentration inferred from context.');
      } else if (context.isSharedConcentration) {
        conc = context.concentration;
        confidence = Math.min(confidence, 90);
        warnings.push('Concentration shared based on explicit marker.');
      } else {
        return { type: 'incomplete', reason: 'Missing concentration (explicit per-drug requirement).' };
      }
    }

    if (!conc) {
      const amt = amounts[0] || context.amount;
      const vol = volumes[0] || context.volume;
      if (amt && vol) {
        const isLocalAmt = amounts.length > 0;
        const isLocalVol = volumes.length > 0;
        
        if (!isLocalAmt || !isLocalVol) {
          if (context.isMultiDrug && !context.isSharedConcentration) {
            return { type: 'incomplete', reason: 'Missing concentration (explicit per-drug requirement).' };
          }
        }

        conc = { type: 'concentration', drugValue: amt.value, drugUnit: amt.unit, volValue: vol.value, volUnit: vol.unit, raw: 'implicit concentration' };
        
        if (!isLocalAmt || !isLocalVol) {
          confidence = Math.min(confidence, context.isSharedConcentration ? 90 : 80);
          warnings.push(context.isMultiDrug ? 'Concentration implicitly derived and shared based on explicit marker.' : 'Concentration implicitly derived from context.');
        } else {
          confidence = Math.min(confidence, 90);
          warnings.push('Concentration implicitly derived from amount and volume.');
        }
      }
    }

    if (dr.weightBased && !w) return { type: 'incomplete', reason: 'Missing patient weight for /kg dose.' };
    if (!conc) return { type: 'incomplete', reason: 'Missing concentration (amount in volume).' };

    return { type: 'complete_infusion', doseRate: dr, weight: w, concentration: conc, confidence, warnings: Array.from(new Set(warnings)) };
  }

  // Volume-Time Priority
  if (volTimes.length > 0) return { type: 'vol_time_infusion', volTime: volTimes[0], confidence, warnings: Array.from(new Set(warnings)) };
  
  let vol = volumes[0];
  let t = times[0];
  if (!vol && context.volume) {
    if (!context.isMultiDrug) {
      vol = context.volume;
      confidence = Math.min(confidence, 80);
      warnings.push('Volume inferred from context.');
    } else if (context.isSharedConcentration) {
      vol = context.volume;
      confidence = Math.min(confidence, 90);
      warnings.push('Volume shared based on explicit marker.');
    }
  }
  if (!t && context.time) {
    if (!context.isMultiDrug) {
      t = context.time;
      confidence = Math.min(confidence, 80);
      warnings.push('Time inferred from context.');
    } else if (context.isSharedConcentration) {
      t = context.time;
      confidence = Math.min(confidence, 90);
      warnings.push('Time shared based on explicit marker.');
    }
  }

  if (vol && t) {
    return { type: 'vol_time_implicit', volume: vol, time: t, confidence, warnings: Array.from(new Set(warnings)) };
  }

  // Concentration Only
  if (concs.length > 0) {
    if (context.isMultiDrug && doseRates.length === 0 && !context.isSharedConcentration) {
      return { type: 'ambiguous', reason: 'Unassigned concentration context without explicit shared marker.' };
    }
    return { type: 'concentration_only', concentration: concs[0], confidence, warnings: Array.from(new Set(warnings)) };
  }
  if (amounts.length > 0 && volumes.length > 0) {
    if (context.isMultiDrug && doseRates.length === 0 && !context.isSharedConcentration) {
      return { type: 'ambiguous', reason: 'Unassigned concentration context without explicit shared marker.' };
    }
    return { type: 'concentration_implicit', amount: amounts[0], volume: volumes[0], confidence, warnings: Array.from(new Set(warnings)) };
  }

  // Standalone Dose
  if (amounts.length > 0) return { type: 'standalone_dose', amount: amounts[0], confidence, warnings: Array.from(new Set(warnings)) };

  // Detection of disconnected fragments
  if (raw.includes(' over ') && times.length === 0 && !context.time) return { type: 'incomplete', reason: 'Missing time duration.' };
  if (raw.includes(' in ') && volumes.length === 0 && !context.volume) return { type: 'incomplete', reason: 'Missing diluent volume.' };

  return { type: 'ambiguous', reason: 'No clear clinical path detected. Expression may be malformed.' };
}

// ==========================================
// 5. COMPUTATION MATH ENGINE (Pure & Deterministic)
// ==========================================
// Note: NO ROUNDING occurs in this layer. Only pure math logic.
function convertMass(val: number, from: string, to: string): number {
  if (from === to) return val;
  const baseMg = from === 'g' ? val * 1000 : (from === 'mcg' ? val / 1000 : val);
  if (to === 'g') return baseMg / 1000;
  if (to === 'mcg') return baseMg * 1000;
  return baseMg; 
}

function convertVol(val: number, from: string): number { return from === 'l' ? val * 1000 : val; }
function convertTime(val: number, from: string): number { return from === 'min' ? val / 60 : val; }

type MathResult = 
  | { type: 'rate'; mlPerHour: number; steps: any[] }
  | { type: 'conc'; concPerMl: number; unit: string; steps: any[] }
  | { type: 'dose'; value: number; unit: string; steps: any[] }
  | { type: 'error'; message: string };

function computePath(path: ComputationPath): MathResult {
  if (path.type === 'complete_infusion') {
    const { doseRate, weight, concentration } = path;
    const baseUnit = doseRate.massUnit.includes('units') ? 'units' : 'mg';

    if (doseRate.value <= 0) {
      return { type: 'error', message: 'Invalid dose rate (must be greater than 0)' };
    }
    if (doseRate.weightBased && weight && weight.value <= 0) {
      return { type: 'error', message: 'Invalid input: Invalid patient weight (0 kg not physiologically valid)' };
    }

    // Unit mismatch detection
    const doseMassType = doseRate.massUnit.includes('units') ? 'units' : 'mass';
    const concMassType = concentration.drugUnit.includes('units') ? 'units' : 'mass';
    
    if (doseMassType !== concMassType) {
      return { type: 'error', message: `Unit mismatch: Cannot compute dose in ${doseRate.massUnit} with concentration in ${concentration.drugUnit}.` };
    }

    const concMass = convertMass(concentration.drugValue, concentration.drugUnit, baseUnit);
    const concVol = convertVol(concentration.volValue, concentration.volUnit);
    if (concMass <= 0 || concVol <= 0 || !Number.isFinite(concVol)) {
      return { type: 'error', message: 'Invalid concentration (division by zero risk)' };
    }
    
    const concPerMl = concMass / concVol;
    const steps = [
      { id: 'conc', label: 'Concentration', exp: `${concentration.drugValue}${concentration.drugUnit} / ${concentration.volValue}${concentration.volUnit}`, val: concPerMl, unit: `${baseUnit}/mL` }
    ];

    let dosePerHour = doseRate.value;
    if (doseRate.weightBased && weight) {
      dosePerHour *= weight.value;
      steps.push({ id: 'wt_dose', label: 'Weight-based dose', exp: `${doseRate.value}${doseRate.massUnit}/kg/${doseRate.timeUnit} * ${weight.value}kg`, val: dosePerHour, unit: `${doseRate.massUnit}/${doseRate.timeUnit}` });
    }

    if (doseRate.timeUnit === 'min') dosePerHour *= 60;
    const dosePerHourBase = convertMass(dosePerHour, doseRate.massUnit, baseUnit);
    steps.push({ id: 'hourly_dose', label: 'Total hourly dose', exp: '', val: dosePerHourBase, unit: `${baseUnit}/hr` });

    const mlPerHour = dosePerHourBase / concPerMl;
    steps.push({ id: 'final_rate', label: 'Infusion rate', exp: `dose / concentration`, val: mlPerHour, unit: `mL/hr` });

    return { type: 'rate', mlPerHour, steps };
  }

  if (path.type === 'vol_time_infusion' || path.type === 'vol_time_implicit') {
    const vol = path.type === 'vol_time_infusion' ? convertVol(path.volTime.volValue, path.volTime.volUnit) : convertVol(path.volume.value, path.volume.unit);
    const time = path.type === 'vol_time_infusion' ? convertTime(path.volTime.timeValue, path.volTime.timeUnit) : convertTime(path.time.value, path.time.unit);
    if (vol <= 0) return { type: 'error', message: 'Invalid volume (must be greater than 0)' };
    if (time <= 0) return { type: 'error', message: 'Invalid time duration (cannot divide by zero)' };
    const mlPerHour = vol / time;

    return { type: 'rate', mlPerHour, steps: [
      { id: 'vol', label: 'Total volume', exp: '', val: vol, unit: 'mL' },
      { id: 'time', label: 'Duration', exp: '', val: time, unit: 'hr' },
      { id: 'final_rate', label: 'Infusion rate', exp: `volume / time`, val: mlPerHour, unit: 'mL/hr' }
    ]};
  }

  if (path.type === 'concentration_only' || path.type === 'concentration_implicit') {
    const dVal = path.type === 'concentration_only' ? path.concentration.drugValue : path.amount.value;
    const dUnit = path.type === 'concentration_only' ? path.concentration.drugUnit : path.amount.unit;
    const vVal = path.type === 'concentration_only' ? path.concentration.volValue : path.volume.value;
    const vUnit = path.type === 'concentration_only' ? path.concentration.volUnit : path.volume.unit;
    const vMl = convertVol(vVal, vUnit);
    if (dVal <= 0 || vMl <= 0 || !Number.isFinite(vMl)) {
      return { type: 'error', message: 'Invalid concentration (division by zero risk)' };
    }
    const concPerMl = dVal / vMl;

    return { type: 'conc', concPerMl, unit: dUnit, steps: [
      { id: 'final_conc', label: 'Concentration', exp: `${dVal}${dUnit} / ${vMl}mL`, val: concPerMl, unit: `${dUnit}/mL` }
    ]};
  }

  if (path.type === 'standalone_dose') {
    if (path.amount.value <= 0) {
      return { type: 'error', message: 'Invalid dose amount (must be greater than 0)' };
    }
    return { type: 'dose', value: path.amount.value, unit: path.amount.unit, steps: [
      { id: 'dose', label: 'Standalone dose', exp: '', val: path.amount.value, unit: path.amount.unit }
    ]};
  }

  return { type: 'error', message: 'Execution reached an unhandled state.' };
}

// ==========================================
// 6. FORMATTING LAYER
// ==========================================
// Strictly applies precision, rounding, and UI strings
function formatNum(val: number, settings: ComputeSettings): string {
  const precision = settings.precision ?? 1;
  const mode = settings.roundingMode ?? 'round';
  const factor = Math.pow(10, precision);
  
  let rounded = val * factor;
  if (mode === 'round') rounded = Math.round(rounded);
  else if (mode === 'floor') rounded = Math.floor(rounded);
  else if (mode === 'ceil') rounded = Math.ceil(rounded);
  
  const finalStr = (rounded / factor).toFixed(precision);
  return settings.compactDisplay ? parseFloat(finalStr).toString() : finalStr;
}

// ==========================================
// MAIN EXPORT API
// ==========================================
export function computeExpression(input: string, settings: ComputeSettings = {}): CalcResult {
  const globalResult: CalcResult = {
    parsed: {},
    normalized: {},
    finalResult: '',
    breakdown: [],
    isComplete: true,
    branches: []
  };

  try {
    // 0. PRE-VALIDATION (Safety Guards)
    if (/(-\s*\d+)/.test(input)) {
      globalResult.warning = "Invalid input: Negative values are not permitted in clinical expressions.";
      globalResult.isComplete = false;
      return globalResult;
    }
    if (/\b0\s*(?:hr|min|hours|minutes)\b/i.test(input)) {
      globalResult.warning = "Invalid time duration (cannot divide by zero)";
      globalResult.isComplete = false;
      return globalResult;
    }
    if (/\b0\s*(?:ml|l|liters)\b/i.test(input)) {
      globalResult.warning = "Invalid volume (must be greater than 0)";
      globalResult.isComplete = false;
      return globalResult;
    }
    if (/\b0\s*(?:mcg|mg|g|units)\s+in\b/i.test(input)) {
      globalResult.warning = "Invalid concentration (division by zero risk)";
      globalResult.isComplete = false;
      return globalResult;
    }

    const normalized = normalizeInput(input);
    const segments = segmentExpressions(normalized);
    
    if (segments.length === 0) {
      globalResult.warning = "No recognizable clinical data found.";
      globalResult.isComplete = false;
      return globalResult;
    }

    const finalResultsArr: string[] = [];
    const warningsArr: string[] = [];
    
    const rawLower = input.toLowerCase();
    const sharedMarkers = ["same solution", "shared bag", "same bag", "using previous context", "apply to both", "shared solution"];
    const hasSharedMarker = sharedMarkers.some(marker => rawLower.includes(marker));
    
    const uniqueDrugs = new Set<string>();
    segments.forEach(s => {
       const entities = extractEntities(s);
       entities.filter(e => e.type === 'drug_name').forEach(e => uniqueDrugs.add((e as DrugNameEntity).name));
    });
    const totalDrugs = uniqueDrugs.size;

    const context: Context = {
      isSharedConcentration: hasSharedMarker,
      isMultiDrug: totalDrugs > 1
    };

    // Pre-pass: gather global context
    segments.forEach((segmentText) => {
      const entities = extractEntities(segmentText);
      const get = <T extends EntityType>(type: T) => entities.filter(e => e.type === type) as Extract<Entity, { type: T }>[];
      
      const weights = get('weight');
      const concs = get('concentration');
      const amounts = get('amount');
      const volumes = get('volume');
      const times = get('time');
      const drugs = get('drug_name');

      if (weights.length > 0 && !context.weight) context.weight = weights[0];
      if (concs.length > 0 && !context.concentration) {
        context.concentration = concs[0];
        if (drugs.length > 0) context.drugName = drugs[0].name;
      }
      if (amounts.length > 0 && volumes.length > 0 && !context.concentration) {
        context.concentration = { type: 'concentration', drugValue: amounts[0].value, drugUnit: amounts[0].unit, volValue: volumes[0].value, volUnit: volumes[0].unit, raw: 'implicit concentration' };
        if (drugs.length > 0) context.drugName = drugs[0].name;
      }
      if (amounts.length > 0 && !context.amount) context.amount = amounts[0];
      if (volumes.length > 0 && !context.volume) context.volume = volumes[0];
      if (times.length > 0 && !context.time) context.time = times[0];
      if (drugs.length > 0 && !context.drugName) context.drugName = drugs[0].name;
    });

  const segmentPaths = segments.map((segmentText) => {
  const entities = extractEntities(segmentText);
  const drugEntity = entities.find(
    (e) => e.type === "drug_name"
  ) as DrugNameEntity | undefined;

  const basePath = buildSegmentGraph(entities, segmentText, context);

  const path = {
    ...basePath,
    warnings: "warnings" in basePath ? [...(basePath.warnings ?? [])] : [],
  };

  // Apply alias penalty if the raw name doesn't match the canonical name
  const isCompletePath =
  path.type === "complete_infusion" ||
  path.type === "vol_time_infusion" ||
  path.type === "vol_time_implicit" ||
  path.type === "standalone_dose";

if (
  drugEntity &&
  drugEntity.name !== drugEntity.raw.toLowerCase() &&
  isCompletePath &&
  "confidence" in path &&
  "warnings" in path
) {
  path.confidence = Math.min(path.confidence, 80);

  if (!path.warnings) path.warnings = [];

  if (!path.warnings.includes("Drug alias normalized.")) {
    path.warnings.push("Drug alias normalized.");
  }
}

  return { segmentText, entities, drugEntity, path };
});

    segmentPaths.forEach(({ entities, drugEntity, path }, index) => {
      let resolvedDrugName = drugEntity ? drugEntity.name : null;
      if (!resolvedDrugName && context.drugName && !context.isMultiDrug) {
        resolvedDrugName = context.drugName;
      } else if (!resolvedDrugName && context.drugName && context.isSharedConcentration) {
        resolvedDrugName = context.drugName;
      }
      
      const branchLabel = resolvedDrugName ? resolvedDrugName.charAt(0).toUpperCase() + resolvedDrugName.slice(1) : (segments.length > 1 ? `Branch ${index + 1}` : null);
      
      // Map entities to parsed output safely
      globalResult.parsed[`segment_${index}`] = entities;

      const isCompleteInfusion = path.type === 'complete_infusion' || path.type === 'vol_time_infusion' || path.type === 'vol_time_implicit' || path.type === 'standalone_dose';
      const isStandaloneConc = path.type === 'concentration_only' || path.type === 'concentration_implicit';
      
      let shouldEmitBranch = !!resolvedDrugName || isCompleteInfusion;
      
      if (isStandaloneConc) {
        if (segments.length === 1 || totalDrugs === 0) {
          shouldEmitBranch = true;
        } else if (resolvedDrugName) {
          // Check if there is a complete infusion for the same canonical drug
          const canonicalName = getCanonicalDrugName(resolvedDrugName);
          const hasCompleteForSameDrug = segmentPaths.some((sp, spIndex) => {
            if (spIndex === index) return false;
            let spResolvedName = sp.drugEntity ? sp.drugEntity.name : null;
            if (!spResolvedName && context.drugName && !context.isMultiDrug) spResolvedName = context.drugName;
            else if (!spResolvedName && context.drugName && context.isSharedConcentration) spResolvedName = context.drugName;
            
            return spResolvedName && 
              getCanonicalDrugName(spResolvedName) === canonicalName &&
              (sp.path.type === 'complete_infusion' || sp.path.type === 'vol_time_infusion' || sp.path.type === 'standalone_dose');
          });
          if (hasCompleteForSameDrug) {
            shouldEmitBranch = false;
          }
        }
      }

      if (path.type === 'incomplete' || path.type === 'ambiguous') {
        globalResult.isComplete = false;
        if (path.reason) {
          if (shouldEmitBranch) {
            let formattedReason: string;
            if (path.type === 'ambiguous') {
              formattedReason = `- Ambiguous input for ${drugEntity?.name || 'segment'}: ${path.reason}`;
            } else if (path.reason.includes('Missing concentration')) {
              formattedReason = `- Missing concentration for ${drugEntity?.name || 'infusion'}`;
            } else if (path.reason.includes('Missing patient weight')) {
              formattedReason = `- Missing patient weight for ${drugEntity?.name || 'infusion'}`;
            } else {
              formattedReason = `- ${drugEntity ? drugEntity.name + ': ' : ''}${path.reason}`;
            }
            warningsArr.push(formattedReason);
            
            if (globalResult.branches) {
              globalResult.branches.push({
                label: branchLabel || `Branch ${index + 1}`,
                result: path.type === 'ambiguous' ? 'Ambiguous' : 'Incomplete',
                confidence: 0,
                warnings: [formattedReason.replace(/^- /, '')]
              });
            }
          } else {
            if (path.type === 'ambiguous') {
              warningsArr.push(`- Ambiguous input: ${path.reason}`);
            } else {
              warningsArr.push(`- ${path.reason}`);
            }
          }
        }
        return;
      }

      if (!shouldEmitBranch) return;

      const mathRes = computePath(path);
      const pathWarnings = 'warnings' in path ? path.warnings : [];

      if (mathRes.type === 'error') {
        globalResult.isComplete = false;
        const warnMsg = drugEntity ? `- ${drugEntity.name}: ${mathRes.message}` : `- ${mathRes.message}`;
        warningsArr.push(warnMsg);
        if (globalResult.branches) {
          globalResult.branches.push({
            label: branchLabel || `Branch ${index + 1}`,
            result: 'Error',
            confidence: 0,
            warnings: [mathRes.message]
          });
        }
        return;
      }

      // Format outputs
      let segmentFinalStr = '';
      if (mathRes.type === 'rate') segmentFinalStr = `${formatNum(mathRes.mlPerHour, settings)} mL/hr`;
      else if (mathRes.type === 'conc') segmentFinalStr = `${formatNum(mathRes.concPerMl, settings)} ${mathRes.unit}/mL`;
      else if (mathRes.type === 'dose') segmentFinalStr = `${formatNum(mathRes.value, settings)} ${mathRes.unit}`;

      const prefix = branchLabel ? `${branchLabel}: ` : '';
      finalResultsArr.push(`${prefix}${segmentFinalStr}`);

      if (pathWarnings.length > 0) {
        warningsArr.push(...pathWarnings.map(w => `${prefix}${w}`));
      }

      if (globalResult.branches) {
        globalResult.branches.push({
          label: branchLabel || `Branch ${index + 1}`,
          result: segmentFinalStr,
          confidence: 'confidence' in path ? path.confidence : 100,
          warnings: pathWarnings,
          mathRes // Store mathRes temporarily to rebuild breakdown later
        } as any);
      }
    });

    globalResult.finalResult = finalResultsArr.join('  |  ');
    if (warningsArr.length > 0) {
      globalResult.warning = Array.from(new Set(warningsArr)).join('\n');
    }

    if (globalResult.branches) {
      // Deduplicate branches
      const deduplicated: typeof globalResult.branches = [];
      const seen = new Set<string>();
      
      globalResult.branches.forEach(b => {
        const canonical = getCanonicalDrugName(b.label.toLowerCase());
        const key = `${canonical}|${b.result}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(b);
        } else {
          const existing = deduplicated.find(d => getCanonicalDrugName(d.label.toLowerCase()) === canonical && d.result === b.result);
          if (existing) {
             existing.confidence = Math.min(existing.confidence, 80);
             if (!existing.warnings.includes('Duplicate drug mention merged.')) {
               existing.warnings.push('Duplicate drug mention merged.');
             }
          }
        }
      });
      globalResult.branches = deduplicated;

      // Rebuild finalResult from deduplicated branches to avoid duplicate text
      const validResults = deduplicated.filter(b => b.result !== 'Incomplete' && b.result !== 'Ambiguous' && b.result !== 'Error');
      if (validResults.length > 0) {
        globalResult.finalResult = validResults.map(b => `${b.label}: ${b.result}`).join('  |  ');
        globalResult.isComplete = true;
      } else {
        globalResult.finalResult = '';
        globalResult.isComplete = false;
      }

      // Rebuild breakdown from deduplicated branches
      globalResult.breakdown = [];
      if (settings.showBreakdown !== false) {
        deduplicated.forEach((b: any) => {
          if (b.mathRes && b.mathRes.steps) {
            if (b.label) globalResult.breakdown.push({ step: '---', value: b.label.toUpperCase() });
            b.mathRes.steps.forEach((step: any) => {
              const valStr = formatNum(step.val, settings);
              const expStr = step.exp ? ` (${step.exp})` : '';
              globalResult.breakdown.push({ step: step.label, value: `${valStr} ${step.unit}${expStr}` });
            });
          }
          delete b.mathRes; // Clean up temporary property
        });
      }

      const hasInvalid = segments.length > validResults.length || deduplicated.some(b => b.result === 'Incomplete' || b.result === 'Ambiguous' || b.result === 'Error');
      if (hasInvalid) {
        globalResult.branches.forEach(b => {
          if (b.result !== 'Incomplete' && b.result !== 'Ambiguous' && b.result !== 'Error') {
            b.confidence = Math.min(b.confidence, 70);
          }
        });
      }
    }

    return globalResult;

  } catch (e: any) {
    globalResult.isComplete = false;
    globalResult.warning = e.message || "A fatal error occurred during pipeline execution.";
    return globalResult;
  }
}
