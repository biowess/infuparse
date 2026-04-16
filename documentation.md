# InfuParse — Technical Documentation

> A deterministic, regex-driven clinical computation engine for parsing ICU-style infusion shorthand into structured calculations.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Flow](#data-flow)
4. [Core Engine: Deep Dive](#core-engine-deep-dive)
   - [Stage 1 — Normalization](#stage-1--normalization)
   - [Stage 2 — Segmentation](#stage-2--segmentation)
   - [Stage 3 — Entity Extraction](#stage-3--entity-extraction)
   - [Stage 4 — Computation Path Selection](#stage-4--computation-path-selection)
   - [Stage 5 — Math Engine](#stage-5--math-engine)
   - [Stage 6 — Formatting](#stage-6--formatting)
5. [Worked Examples](#worked-examples)
6. [Safety Design](#safety-design)
7. [UI & State Management](#ui--state-management)
8. [Limitations](#limitations)
9. [Design Philosophy & Learning Notes](#design-philosophy--learning-notes)
10. [Summary](#summary)

---

## Overview

InfuParse is a single-page clinical computation workspace. It accepts ICU-style shorthand expressions and returns structured, step-by-step calculations — primarily infusion rate conversions (e.g. → mL/hr) and concentration derivations (e.g. → mg/mL).

The core problem it solves is practical: in high-acuity clinical environments, practitioners write terse expressions that don't fit into rigid form fields. InfuParse parses that shorthand directly, extracts the relevant clinical tokens, performs the arithmetic, and explains every step.

**Typical inputs the engine handles:**

```
dopamine 5 mcg/kg/min 70kg 400mg in 250mL
100 mL over 2 hr
500 mg in 100 mL
```

**What InfuParse is not:** a general natural-language medical assistant. It is a regex-driven calculation engine with a thin, purposeful UI wrapped around it. There is no hidden model behavior — every decision is an explicit heuristic you can read and trace.

---

## System Architecture

InfuParse is a React single-page application with a small routing shell and one core computation engine. All state is local; there is no backend.

### File Map

| File | Role |
|---|---|
| `src/lib/compute.ts` | The heart of the app. Parsing pipeline, branching logic, calculation math, confidence scoring, and output formatting. |
| `src/pages/Home.tsx` | Main workspace. Input box, example queries, result card, bookmark action, loading state. |
| `src/pages/Settings.tsx` | Display preferences: precision, rounding mode, breakdown visibility, compact layout toggle. |
| `src/pages/Bookmarks.tsx` | Lists saved calculations from `localStorage`. Supports deletion and query re-opening. |
| `src/components/Layout.tsx` | Global shell: top navigation, responsive mobile menu, shared page layout. |
| `src/pages/Docs.tsx` / `About.tsx` / `References.tsx` | Static explanatory pages describing intended behavior and engine limitations. |
| `src/lib/utils.ts` | Minimal helper for merging Tailwind classes cleanly. |
| `src/App.tsx` / `src/main.tsx` | Application bootstrap and route wiring. |

---

## Data Flow

The application has two parallel data flows that never intersect.

### Calculation Flow

```
input string
  → normalization
  → segmentation
  → entity extraction
  → path selection
  → math
  → formatting
  → CalcResult
```

### UI State Flow

```
user input
  → Home state
  → computeExpression() result
  → result card / warnings / breakdown
  → optional bookmark
```

Settings and bookmarks are entirely external to the compute engine. They are side data, persisted in `localStorage`, and read back by their respective pages. The engine itself is stateless.

---

## Core Engine: Deep Dive

All computation lives in `src/lib/compute.ts`. The engine is divided into six discrete stages. Each stage has exactly one job.

---

### Stage 1 — Normalization

**Function:** `normalizeInput(input)`

The first pass lowercases and trims the raw string, then rewrites common clinical shorthand into a canonical surface form. This stage is purely syntactic — it standardizes spelling so later regexes can match reliably.

**Rewrite rules:**

| Input variant | Normalized to |
|---|---|
| `μg`, `ug` | `mcg` |
| `cc` | `ml` |
| `h`, `hours` | `hr` |
| `m`, `mins`, `minutes` | `min` |
| `iu` | `units` |
| spaces around `/` | collapsed |
| multiplication markers (`x`) | `*` |

This stage does not interpret meaning. It only makes the surface form consistent.

---

### Stage 2 — Segmentation

**Function:** `segmentExpressions(...)`

The normalized string is split on `+`, `and`, `&`, commas, and newlines. Each resulting chunk is treated as an independent clinical expression.

**Example:**

```
dopamine 5 mcg/kg/min 70kg + norepinephrine 0.08mcg/kg/min 68kg
```

→ Two segments, processed independently.

Segmentation is as much a safety feature as a parsing feature. By isolating each drug into its own segment, the engine prevents one drug's concentration or dose from being silently reused for another drug without an explicit shared-context hint.

---

### Stage 3 — Entity Extraction

**Function:** `extractEntities(segment)`

Each segment is scanned and its contents are converted into typed clinical entities.

**Recognized entity types:**

- Drug names and aliases (from an internal dictionary)
- Concentration expressions: `400mg in 250mL`
- Volume/time expressions: `100 mL over 2 hr`
- Direct concentration shorthand: `10mg/mL`
- Shorthand volume/time: `250mL/hr`
- Dose rates: `5 mcg/kg/min`, `2 mg/hr`
- Patient weight: `70kg`
- Standalone amounts, volumes, and times

**Order matters.** The engine tries to capture known drug names first, then structured expressions, then leftover standalone tokens. This ordering prevents double-counting — a token consumed by one pattern cannot be re-matched by a looser one.

**The drug dictionary** maps clinical aliases (`epi`, `levophed`, `precedex`, `lasix`, etc.) to their canonical names. The regex is sorted by alias length so that longer, more specific matches always win over shorter partial matches.

---

### Stage 4 — Computation Path Selection

**Function:** `buildSegmentGraph(...)`

This is the decision layer. It examines the extracted entities and classifies the segment into one of eight computation paths:

| Path | Description |
|---|---|
| `complete_infusion` | Drug + dose rate + weight + concentration — full infusion rate solvable |
| `vol_time_infusion` | Explicit volume/time expression (e.g. `100 mL over 2 hr`) |
| `vol_time_implicit` | Volume and time present but separated |
| `concentration_only` | Amount and volume only — compute mg/mL |
| `concentration_implicit` | Concentration inferable from context |
| `standalone_dose` | A plain amount with no further context |
| `incomplete` | Required information is present but something is missing |
| `ambiguous` | Structure cannot be safely interpreted |

#### Context Inference and Shared State

The engine builds a shared context across segments. If a weight, concentration, amount, volume, or time appears in one segment, it may be cautiously reused in adjacent segments — but only when the expression appears to represent a single clinical scenario.

**Inference rules:**

- **Single-drug expressions:** context inference is permitted.
- **Multi-drug expressions:** inferred cross-segment reuse is blocked by default.

To allow shared context across multiple drugs, the input must include an explicit **shared marker**:

```
same bag  |  same solution  |  shared bag  |  shared solution
using previous context  |  apply to both
```

This is the engine's core uncertainty policy: *prefer explicit local data → allow limited inference for singular expressions → require an explicit hint when multiple drugs are present.*

#### When the Engine Declares `incomplete`

The engine marks a segment `incomplete` when it recognizes the intended calculation but lacks the required input to finish it:

- A weight-based dose without a patient weight
- A dose rate without a concentration
- An `in` expression without a volume
- An `over` expression without a time

#### When the Engine Declares `ambiguous`

`ambiguous` is distinct from `incomplete`. It means the engine cannot safely interpret the *structure* of the expression, not just that data is missing:

- Multiple drugs or multiple dose rates appear in the same segment
- A concentration is present in a multi-drug expression without a shared marker
- The text is malformed enough that no safe clinical assignment is possible

> **Key distinction:** `incomplete` = "I know what you want but don't have enough input." `ambiguous` = "I cannot safely determine what you mean."

---

### Stage 5 — Math Engine

The math layer is pure and deterministic. It does not round. It only computes. Formatting is entirely deferred to Stage 6.

**Supported computation paths:**

**Complete infusion** (e.g. `5 mcg/kg/min 70kg 400mg in 250mL`)
1. Compute concentration: `amount ÷ volume`
2. Multiply dose by weight if weight-based
3. Convert per-minute dosing to per-hour
4. Convert units to a common base
5. Divide dose-per-hour by concentration → mL/hr

**Volume over time** (e.g. `100 mL over 2 hr`)
Divide volume by time.

**Implicit volume/time**
Same division, applied to separated volume and time values.

**Concentration only** (e.g. `500 mg in 100 mL`)
Divide amount by volume → mg/mL (or equivalent unit).

**Standalone dose** (e.g. `10 mg`)
Return the amount directly; no further math needed.

**Safety checks inside the math layer:**

The following inputs cause the math layer to reject a computation entirely:
- Zero or negative dose, weight, volume, or time values
- Unit mismatches (e.g. computing a mcg dose from a `units` concentration)
- Any division-by-zero case

---

### Stage 6 — Formatting

**Function:** `formatNum(...)`

Precision and rounding are applied *only here*, after all arithmetic is complete. The math layer never touches display concerns.

**User-configurable options:**

- Decimal precision (number of places)
- Rounding mode: `round`, `floor`, or `ceil`
- Compact display mode

Because formatting is decoupled from computation, changing display settings never affects the underlying numbers — only how they're presented.

---

## Worked Examples

### Example 1 — Weight-Based Infusion with Concentration

**Input:**
```
dopamine 5 mcg/kg/min 70kg 400mg in 250mL
```

**Internal trace:**
1. String is normalized (no changes needed).
2. Remains one segment — no separators present.
3. Extraction identifies:
   - Drug: `dopamine`
   - Dose rate: `5 mcg/kg/min`
   - Weight: `70 kg`
   - Concentration: `400 mg in 250 mL`
4. Path selected: `complete_infusion`
5. Math:
   ```
   concentration  = 400 ÷ 250       = 1.6 mg/mL
   dose (weight)  = 5 × 70           = 350 mcg/min
   dose (hourly)  = 350 × 60         = 21,000 mcg/hr → 21 mg/hr
   infusion rate  = 21 ÷ 1.6         = 13.125 mL/hr
   ```
6. Formatted to 1 decimal place.

**Result:** `Dopamine: 13.1 mL/hr` — Confidence: **100%**

---

### Example 2 — Volume Over Time

**Input:**
```
100 mL over 2 hr
```

**Internal trace:**
1. Normalization standardizes units.
2. Extraction finds a `vol_time` entity.
3. Path selected: `vol_time_infusion`
4. Math: `100 ÷ 2 = 50 mL/hr`

**Result:** `Branch 1: 50.0 mL/hr`

No drug name is present, so the result is labeled as a branch rather than a medication.

---

### Example 3 — Concentration Only

**Input:**
```
500 mg in 100 mL
```

**Internal trace:**
1. Normalization and extraction detect a concentration expression.
2. Path selected: `concentration_only`
3. Math: `500 ÷ 100 = 5 mg/mL`

**Result:** `Branch 1: 5.0 mg/mL`

---

### Example 4 — Incomplete Weight-Based Dose (Safe Refusal)

**Input:**
```
dopamine 5 mcg/kg/min 70kg
```

**Internal trace:**
1. Extraction finds the drug, dose rate, and weight.
2. No concentration is present.
3. The engine recognizes the intended path but cannot complete it.
4. Returns `incomplete`.
5. UI surfaces the warning: `Missing concentration for dopamine`

This is a deliberate safe refusal. The engine does not guess a missing concentration.

---

### Example 5 — Shared-Bag Multi-Drug Expression

**Input:**
```
fentanyl 50mcg/hr + midazolam 2mg/hr + 100mg/100mg in 100mL same bag
```

**Internal trace:**
1. Segmentation splits the string into three parts.
2. Two drug segments are detected alongside one concentration segment.
3. The phrase `same bag` activates shared-marker logic.
4. `100mg/100mL` becomes the shared context applied to both drugs.
5. The engine computes:
   - Fentanyl branch
   - Midazolam branch
6. Because one segment is treated as shared context rather than standalone output, confidence is reduced to reflect the inference.
7. Warnings explain that the concentration was shared via explicit marker.

**Result:** `Fentanyl: 0.1 mL/hr  |  Midazolam: 2.0 mL/hr`

---

## Safety Design

The safety model in InfuParse is about **computational safety**, not clinical safety. It does not validate dose ranges or assess clinical appropriateness. What it does is refuse to produce silently wrong arithmetic.

### What the Engine Refuses to Do

- Compute with negative or zero values
- Divide by zero
- Silently mix incompatible units
- Assume a missing weight or concentration in a weight-based infusion
- Merge multi-drug expressions without a clear boundary or explicit shared-context hint

### Handling Incomplete Cases

Incomplete results are not treated as application failures. They signal that the user hasn't supplied enough information. The engine may still return valid results for *other* segments in the same input, but marks the overall result as incomplete when any essential data is absent.

### Handling Ambiguous Cases

Ambiguity is a separate category. The engine uses it when a value could belong to multiple parts of an expression or when the expression is too malformed to assign tokens safely. This is useful as a parser design lesson: *"not enough data"* and *"too many possible interpretations"* are fundamentally different failure modes.

### Confidence Scoring

Confidence is not a statistical model. It is a transparency heuristic — an explanation signal, not just a badge.

| Score | Meaning |
|---|---|
| **100%** | Fully explicit, clean calculation |
| **90%** | Explicitly shared concentration mapping |
| **80%** | Alias normalization or light context inference |
| **70%** | Result survives alongside invalid or dropped segments |
| **0%** | Incomplete, ambiguous, or invalid branch |

Confidence is additionally reduced when:
- Weight or concentration was inferred from context
- A drug alias was normalized to a canonical name
- Duplicate drug mentions were merged
- Other parts of the input were invalid

---

## UI & State Management

### Home Page

The primary workspace. It manages local state for:

- `query` — the current input string
- `isComputing` — loading indicator state
- `result` — the `CalcResult` returned by the engine
- `hasSearched` — controls whether the result card is visible
- `isBookmarked` — tracks whether the current result is saved

The `q` URL parameter is read on mount, allowing saved or shared queries to reopen automatically.

**User flow:**
1. Type an expression
2. Press `Enter` or click the arrow button
3. Brief "Parsing and computing..." state (simulated delay — computation is synchronous and local)
4. Inspect the result card
5. Save to bookmarks if the result is complete

### Settings

Persisted in `localStorage` under `InfuParse_settings`. Controls decimal precision, rounding mode, breakdown visibility, and compact display mode. Settings are read fresh on every computation, so display changes take effect immediately without a reload.

### Bookmarks

Persisted in `localStorage` under `InfuParse_bookmarks`. Each bookmark stores:

- A generated `id`
- The original query string
- The final result string
- A timestamp

Only **complete** results can be bookmarked, preventing users from saving incomplete or ambiguous outputs as though they were resolved.

Each bookmark supports deletion and re-opening. Re-opening pushes the saved query back into the Home route as `/?q=...`.

### Layout & Navigation

`Layout.tsx` provides the shared shell and top navigation. All pages share one layout via nested routes. The mobile menu is local UI state only — there is no persisted navigation state.

---

## Limitations

InfuParse is intentionally narrow in scope. It does **not**:

- Validate whether a dose is within a safe clinical range
- Assess whether a calculation is medically appropriate for a given patient
- Adapt to patient-specific pharmacokinetic factors
- Understand free-form natural language
- Resolve every shorthand variant used in real clinical practice
- Replace institutional protocols or independent clinical verification

Drug names are treated as labels for computation, not as entries in a safety database. The engine manipulates numbers and patterns — it does not make clinical judgments.

**Technical limitation:** The parser is regex-based and heuristic. This makes it readable and debuggable, but it is not equivalent to a formal clinical language parser. Edge cases and novel shorthand combinations can break the pattern matching in ways that a grammar-based or ML-based parser might handle more gracefully.

**Implementation note:** The `CalcResult` type includes a `normalized` field, but the current snapshot does not populate it. It exists as a structural placeholder for a future use rather than a fully active part of the output.

---

## Design Philosophy & Learning Notes

InfuParse is structured the way good prototype parsers are structured: normalize the surface, isolate chunks, classify each chunk, compute only when the necessary pieces are confirmed present.

This yields a set of deliberate tradeoffs:

**Readable over clever.**
The regex pipeline is transparent. Every branch can be traced without understanding a machine-learning stack. The code teaches by being legible.

**Deterministic over probabilistic.**
Given the same input and settings, the result is always identical. That matters for debugging, for teaching, and for any context where reproducibility is non-negotiable.

**Conservative over permissive.**
The engine prefers returning `incomplete` or `ambiguous` over making a hidden assumption. That is the right bias for clinical arithmetic, even in a prototype.

**Explicit context over implicit magic.**
Shared-bag logic only activates when the input provides a visible cue. This prevents accidental cross-contamination between drugs and makes the engine's behavior predictable.

**Math separated from presentation.**
The math layer stays pure. Formatting decisions — rounding, precision, display mode — are applied only at the end. This makes the engine easier to test, easier to reason about, and easier to trust.

---

For developers learning from this codebase, the key insight is that the system is not "smart" in one monolithic way. It is a pipeline of small, auditable decisions:

1. Standardize the text
2. Divide it into safe, independent chunks
3. Classify each chunk
4. Compute only when all required pieces are present
5. Explain every compromise through warnings and confidence scoring

That is a strong, generalizable pattern for building reliable domain-specific tools in any field where silent errors are unacceptable.

---

## Summary

InfuParse is a compact, educational clinical computation tool. It parses shorthand infusion expressions, performs deterministic arithmetic, and makes its reasoning visible through warnings, step-by-step breakdowns, and confidence scores. Every architectural choice — the layered pipeline, the conservative ambiguity handling, the decoupled math and formatting — favors clarity, safety, and debuggability over breadth or cleverness.

It is a prototype for education and verification. It is not a clinical decision-making system.
