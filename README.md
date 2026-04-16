# InfuParse

[![Beta](https://img.shields.io/badge/status-beta-orange?style=for-the-badge)](https://shields.io)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue?style=for-the-badge)](./LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge\&logo=react\&logoColor=white)](https://react.dev)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org)
[![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS 3.4](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)](https://tailwindcss.com)
[![React Router 7](https://img.shields.io/badge/React%20Router-7-CA4245?style=for-the-badge\&logo=react-router\&logoColor=white)](https://reactrouter.com)
[![Framer Motion 12](https://img.shields.io/badge/Framer%20Motion-12-0055FF?style=for-the-badge\&logo=framer\&logoColor=white)](https://www.framer.com/motion/)
[![Lucide React](https://img.shields.io/badge/Lucide%20React-icons-black?style=for-the-badge)](https://lucide.dev)

> **Experimental beta for parsing ICU-style shorthand into infusion math and concentration calculations.**

**Educational use only. Not for clinical decision-making, prescribing, or patient care.**

---

## Overview

InfuParse is a browser-based clinical computation workspace that parses shorthand expressions such as infusion rates, weights, concentrations, and volume-over-time inputs, then turns them into structured results with a step-by-step breakdown.

This repository is a learning and portfolio project. It is intentionally presented as an experimental beta tool, not as a clinical or commercial product. The parser is useful for practice, verification, and exploration, but it must not be used as a substitute for professional judgment or institutional medication workflow.

## Features

* Parses common clinical shorthand into entities such as drug names, dose rates, weights, concentrations, volumes, and durations.
* Computes several supported expression types:

  * weight-based infusion rates
  * fixed-dose infusion rates
  * volume-over-time rates
  * concentration calculations
  * standalone dose values
* Supports multi-expression inputs separated by `+`, `and`, `&`, commas, or new lines.
* Recognizes a built-in drug alias map and normalizes common shorthand names.
* Detects incomplete, ambiguous, negative, zero, and unit-mismatched inputs instead of silently guessing.
* Supports partial execution across multi-branch inputs when some segments are valid and others are not.
* Shows a step-by-step breakdown by default, with an option to compact the display.
* Lets users adjust decimal precision and rounding behavior in Settings.
* Saves bookmarks and display preferences in `localStorage`.
* Includes dedicated pages for Docs, Settings, Bookmarks, About, and References.

## Tech Stack

* React
* React Router DOM
* TypeScript
* Vite
* Tailwind CSS
* PostCSS + Autoprefixer
* Lucide React icons
* Framer Motion
* `localStorage` for client-side persistence

## Installation

### Prerequisites

* Node.js
* npm

### Setup

```bash
npm install
```

The repository includes a `.env.example` file from the AI Studio scaffold, but the current app is frontend-only and does not require a backend to run locally.

### Run locally

```bash
npm run dev
```

The app runs on Vite at `http://localhost:3000`.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Usage

1. Open the app in your browser.
2. Type a clinical-style expression into the main input.
3. Press Enter or click the arrow button.
4. Review the computed result, warnings, and breakdown.
5. Save useful results to Bookmarks.
6. Adjust precision, rounding, breakdown visibility, and compact display in Settings.

## Example Inputs

```text
100 mL over 2 hr
```

**Expected result:**

```text
50.0 mL/hr
```

```text
500 mg in 100 mL
```

**Expected result:**

```text
5.0 mg/mL
```

```text
dopamine 5 mcg/kg/min 70kg 400mg in 250mL
```

**Expected result:**

```text
Dopamine: 13.1 mL/hr
```

The app also supports multi-branch inputs, for example:

```text
dopamine 5 mcg/kg/min 70kg + norepinephrine 0.1 mcg/kg/min 70kg + 4mg in 50mL same bag
```

In these cases, InfuParse attempts to resolve each branch independently and reports warnings when a segment is incomplete or ambiguous.

## How It Works

At a high level, the app follows this flow:

1. **Normalize input**
   Common shorthand is standardized, such as unit aliases and spacing.

2. **Split into segments**
   Multi-expression inputs are separated so each branch can be evaluated independently.

3. **Extract clinical entities**
   The parser identifies drug names, weights, dose rates, concentrations, volumes, and time spans.

4. **Resolve a computation path**
   Each segment is mapped to a supported calculation type and evaluated with safety checks.

5. **Format and display results**
   Final values are formatted according to the chosen precision and rounding mode, then rendered with breakdowns and warnings.

6. **Persist local preferences**
   Settings and bookmarks are stored in the browser via `localStorage`.

## Safety / Limitations

InfuParse is an educational beta project only.

* It is not for clinical use and must not be used for patient care, medication ordering, or bedside decision-making.
* The code does not perform clinical validation of dose ranges, appropriateness, contraindications, or patient-specific factors.
* It does not account for variables such as renal function, age, indication, lab values, or institutional protocols.
* Drug names are treated as labels for calculation purposes only.
* The parser depends on shorthand patterns and numeric input; spelled-out numbers and unusual formats may fail.
* Ambiguous or incomplete inputs are flagged rather than guessed, which means some expressions will intentionally return warnings or partial results.
* Bookmarks and settings are stored only in the current browser via `localStorage`; they are not synced to an account.

## Project Structure

```text
src/
  components/
    Layout.tsx
  lib/
    compute.ts
    utils.ts
  pages/
    Home.tsx
    Docs.tsx
    Settings.tsx
    Bookmarks.tsx
    About.tsx
    References.tsx
app/applet/
  run_tests.ts
  test_runner.ts
  test_runner_100.ts
index.html
vite.config.ts
tailwind.config.js
postcss.config.js
```

## Future Improvements

* Add automated unit tests for parser branches and edge cases.
* Expand unit normalization and drug alias coverage.
* Improve handling of malformed shorthand and spelled-out numbers.
* Add import/export for bookmarks and settings.
* Add clearer validation messages for unsupported expressions.
* Build a safer demo mode with more explicit example-driven onboarding.
* Add accessibility and mobile UX refinements.

## License

This project is licensed under the Apache License 2.0.

You are free to use, modify, and distribute this project under the terms of the license.

