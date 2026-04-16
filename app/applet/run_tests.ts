import { computeExpression } from './src/lib/compute';

const tests = [
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg + 4mg in 50mL",
  "norepinephrine 0.12 mcg/kg/min 82kg",
  "dopamine 400mg in 250mL dopamine 5mcg/kg/min 70kg",
  "500 mL over 4 hr",
  "250ml over 90min",
  "dopamine 5 mcg/kg/min + norepinephrine 0.1 mcg/kg/min + 100mg in 50ml",
  "insulin 6 units/hr 100ml over 8hr",
  "heparin 25000 units in 500 ml over 24 hr",
  "epinephrine 0.05 mcg/kg/min 65 kg",
  "propofol 50 mg/hr 20ml in 200mg",
  "dopamine 10mcg/kg/min 80kg + 4mg in 50mL + norepinephrine 0.05 mcg/kg/min 70kg",
  "unknowndrug 5 mg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg norepinephrine 0.1 mcg/kg/min 70kg epinephrine 0.05 mcg/kg/min 70kg 4mg in 50mL",
  "5 mcg/kg/min dopamine 70kg",
  "dopamine 5 mcg/kg/min 0kg",
  "dopamine 5 mcg/kg/min seventy kg",
  "dopamine 5 mcg/kg/min 70kg + + + norepinephrine 0.1 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + 0 mL over 4 hr",
  "dopamine 500mg in 0mL",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 100ml over 0 hr",
  "dopamine 5 mcg/kg/min 70kg 0mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg Omg in 50mL",
  "dopamine 5 mcg/kg/min 70kg 4mg in 50mL shared solution",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL same bag",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL apply to both",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL same solution",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL using previous context",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL",
  "noradrenaline 0.08 mcg/kg/min 68kg 4mg in 50mL",
  "levophed 0.08 mcg/kg/min 68kg 4mg in 50mL",
  "epinephrine 0.05 mcg/kg/min 65kg + insulin 6 units/hr 100mL over 8hr",
  "propofol 10 mg/hr 100mg in 50mL + midazolam 2 mg/hr 50mg in 25mL",
  "fentanyl 50 mcg/hr 500mcg in 50mL + propofol 25 mg/hr 200mg in 20mL",
  "heparin 25000 units in 500mL + dopamine 5 mcg/kg/min 70kg",
  "dopamine 5 mcg/kg/min 70kg + heparin 25000 units in 500mL",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg + epinephrine 0.05 mcg/kg/min 65kg",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg + epinephrine 0.05 mcg/kg/min 65kg + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg + 4mg in 50mL + 500 mL over 4 hr",
  "dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08 mcg/kg/min 68kg + 4mg in 50mL + 250ml over 90min",
  "dopamine 5mcg/kg/min 70kg 4mg in 50mL + 4mg in 50mL + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 250mL + 100mL over 2hr",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 250mL + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 250mL + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL + shared bag",
  "dopamine 5 mcg/kg/min 70kg + 400mg in 250mL + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL + same solution",
  "dopamine 5 mcg/kg/min 70kg 400mg in 0mL",
  "dopamine 5 mcg/kg/min 70kg 0mg in 0mL",
  "dopamine 5 mcg/kg/min -70kg 4mg in 50mL",
  "dopamine -5 mcg/kg/min 70kg 4mg in 50mL",
  "dopamine 5 mcg/kg/min O kg 4mg in 50mL",
  "dopamine 5 mcg/kg/min 70kg + + norepinephrine 0.1 mcg/kg/min 70kg + + 100ml over 0 hr"
];

const results = tests.map((test, index) => {
  const res = computeExpression(test);
  return {
    id: index + 1,
    input: test,
    result: res
  };
});

console.log(JSON.stringify(results, null, 2));
