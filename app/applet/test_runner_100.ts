import { computeExpression } from './src/lib/compute.ts';

const tests = [
  "dopamine 5 mcg/kg/min 70kg 4mg in 50mL",
  "norepinephrine 0.08 mcg/kg/min 68kg 4mg in 50mL",
  "epinephrine 0.05 mcg/kg/min 65kg 4mg in 50mL",
  "dopamine 10 mcg/kg/min 80kg 400mg in 250mL",
  "dopamine 5 mcg/kg/min seventy kg 4mg in 50mL",
  "dopamine 5 mcg/kg/min 0kg 4mg in 50mL",
  "dopamine 5 mcg/kg/min -70kg 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg 0mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg 4mg in 0mL",
  "dopamine 5 mcg/kg/min 70kg 4mg in 50mL Omg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg",
  "dopamine 5 mcg/kg/min 70kg + epinephrine 0.05 mcg/kg/min 65kg",
  "norepinephrine 0.1 mcg/kg/min 70kg + dopamine 5 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg & norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg and norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + epinephrine 0.05 mcg/kg/min 65kg",
  "dopamine 5 mcg/kg/min 70kg + heparin 25000 units in 500mL",
  "dopamine 5 mcg/kg/min 70kg + insulin 6 units/hr 100mL over 8hr",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL",
  "norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL + epinephrine 0.05 mcg/kg/min 65kg",
  "norepinephrine 0.08 mcg/kg/min 68kg + 4mg in 50mL same bag",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL same bag",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL same solution",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL shared solution",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL using previous context",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL same bag",
  "dopamine + + + norepinephrine",
  "dopamine mcg/kg/min 70kg",
  "dopamine 5 mcg 70kg",
  "dopamine 5 mcg/kg 70kg",
  "dopamine 5 mcg/kg/min kg70",
  "dopamine 5mcg/kg/min70kg",
  "dopamine five mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min seventy kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine +",
  "dopamine 5 mcg/kg/min 70kg +",
  "dopamine 5 mcg/kg/min 70kg 4mg in 0mL",
  "dopamine 5 mcg/kg/min 70kg 0mg in 50mL",
  "dopamine 5 mcg/kg/min 0kg 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg 4mg in 50mL over 0hr",
  "dopamine 5 mcg/kg/min 70kg 4mg in -50mL",
  "500 mL over 4 hr",
  "250 mL over 90 min",
  "100 mL over 0 hr",
  "1000 mL over 8 hr",
  "75 mL over 1.5 hr",
  "levophed 0.1 mcg/kg/min 70kg",
  "levophed 0.08 mcg/kg/min 70kg",
  "ufh 25000 units in 500mL",
  "norepi 0.1 mcg/kg/min 70kg",
  "norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + epinephrine 0.05 mcg/kg/min 65kg + 4mg in 50mL",
  "dopamine 10 mcg/kg/min 80kg + norepinephrine 0.05 mcg/kg/min 70kg + 4mg in 50mL + 500 mL over 4 hr",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 250mL + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 0mL",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL + + + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg 4mg in 50mL + same bag norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + epinephrine 0.05 mcg/kg/min 65kg + insulin 6 units/hr 100mL",
  "dopamine 5 mcg/kg/min 70kg + heparin 25000 units in 500mL + 500 mL over 4 hr",
  "dopamine 5 mcg/kg/min 70kg + 0 mL over 4 hr",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL + 250 mL over 90 min",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + dopamine 5 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + dopamine 5 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + + dopamine 5 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + +",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 250mL + 400mg in 250mL",
  "dopamine 5 mcg/kg/min 70kg + 0mg in 50mL + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + Omg in 50mL",
  "dopamine 5 mcg/kg/min seventy kg + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + levophed 0.1 mcg/kg/min 70kg + norepi 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + epinephrine 0.05 mcg/kg/min 65kg + levophed 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + insulin 6 units/hr 100mL over 0 hr",
  "dopamine 5 mcg/kg/min 70kg + heparin 25000 units in 0mL",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 100 mL over 0 hr",
  "dopamine 5 mcg/kg/min 70kg and norepinephrine 0.08 mcg/kg/min 68kg",
  "dopamine 5 mcg/kg/min 70kg & epinephrine 0.05 mcg/kg/min 65kg",
  "norepi 0.1 mcg/kg/min 70kg + dopamine 5 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg , norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg +++ norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg  norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg and  norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + epinephrine 0.05 mcg/kg/min 65kg",
  "dopamine 5 mcg/kg/min 70kg + ufh 25000 units in 500mL",
  "dopamine 5 mcg/kg/min 70kg + insulin 6 units/hr 100mL over 8 hr",
  "dopamine 5 mcg/kg/min 70kg + 4 mg in 50 mL",
  "levophed 0.1 mcg/kg/min 70kg + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + levophed 0.08 mcg/kg/min 68kg + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL + epinephrine 0.05 mcg/kg/min 65kg",
  "levophed 0.08 mcg/kg/min 68kg + 4mg in 50mL same bag",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL same bag",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL same solution",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL shared solution",
  "dopamine 5 mcg/kg/min 70kg + 4mg in 50mL using previous context",
  "dopamine 5 mcg/kg/min 70kg + levophed 0.1 mcg/kg/min 70kg + 4mg in 50mL same bag"
];

let passed = 0;
let failed = 0;
let parseErrors = 0;
let mathErrors = 0;
let safetyViolations = 0;
let ambiguityFailures = 0;
let contextLeakage = 0;
let incompleteFailures = 0;

tests.forEach((test, index) => {
  const result = computeExpression(test);
  
  let isFailure = false;
  let failureReason = '';
  let failureType = '';

  const hasInfinity = result.finalResult.includes('Infinity') || result.breakdown.some(b => b.value.includes('Infinity'));
  const hasNaN = result.finalResult.includes('NaN') || result.breakdown.some(b => b.value.includes('NaN'));
  const hasZeroDiv = result.warning?.includes('division by zero') || result.warning?.includes('Invalid time duration');
  const hasNegative = result.warning?.includes('Negative values');
  const hasZero = result.warning?.includes('Invalid volume') || result.warning?.includes('Invalid concentration');
  
  if (hasInfinity || hasNaN || hasZeroDiv || hasNegative || hasZero) {
    isFailure = true;
    failureType = 'safety violation';
    failureReason = 'Unsafe output or zero/negative division';
    safetyViolations++;
  } else if (!result.isComplete) {
    isFailure = true;
    if (result.warning?.includes('Ambiguous')) {
      failureType = 'ambiguity';
      failureReason = 'Ambiguous input';
      ambiguityFailures++;
    } else if (result.warning?.includes('Missing') || result.warning?.includes('Unassigned')) {
      failureType = 'incomplete';
      failureReason = 'Incomplete input';
      incompleteFailures++;
    } else if (result.warning?.includes('Invalid input')) {
      failureType = 'parsing error';
      failureReason = 'Parsing error';
      parseErrors++;
    } else {
      failureType = 'parsing error';
      failureReason = 'Unknown parsing failure';
      parseErrors++;
    }
  } else if (result.finalResult === '') {
    isFailure = true;
    failureType = 'parsing error';
    failureReason = 'Empty result for complete input';
    parseErrors++;
  }

  if (!isFailure) {
    passed++;
  } else {
    failed++;
  }

  console.log(`Test ID: ${index + 1}`);
  console.log(`Input: ${test}`);
  console.log(`Result: ${result.finalResult}`);
  console.log(`Confidence: ${result.branches ? result.branches.map(b => b.confidence).join(', ') : 'N/A'}`);
  console.log(`Warnings: ${result.warning || 'None'}`);
  if (isFailure) {
    console.log(`Failure type: ${failureType}`);
    console.log(`Reasoning: ${failureReason}`);
  }
  console.log('---');
});

console.log(`\nFinal summary:`);
console.log(`- passed / failed: ${passed} / ${failed}`);
console.log(`- failure categories breakdown:`);
console.log(`  - parsing error: ${parseErrors}`);
console.log(`  - ambiguity: ${ambiguityFailures}`);
console.log(`  - incomplete: ${incompleteFailures}`);
console.log(`  - safety violation: ${safetyViolations}`);
console.log(`  - math error: ${mathErrors}`);
console.log(`  - context leakage: ${contextLeakage}`);
console.log(`- strict score /100: ${passed}`);
