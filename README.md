# Dave’s Dollars

Offline Windows calculators for home affordability, the income your lifestyle needs, household budgets, and current or future net worth.

## Download and run

**[Download the Windows app](https://github.com/donutmx/daves-dollars/releases/latest)** — choose `Daves-Dollars-1.1.0-Windows.exe` from the release assets.

Double-click the portable EXE. No installation, administrator access, Node.js, or internet connection is required for the calculators. The launcher includes both Intel/AMD x64 and ARM64 builds. Target: 64-bit Windows 10/11; tested on Windows 11 x64. ARM hardware and Windows 10 were not runtime-tested. The app is unsigned, so Windows may show an unknown-publisher warning.

**[Use the website](https://daves-dollars.brettpowers40.chatgpt.site)**

## What it does

- Estimates a home budget or the gross income needed for a desired lifestyle.
- Shares household income and expenses across the home calculators and Budget.
- Models net worth, compound growth, contributions, employer match, income changes, debt payments, and withdrawals.
- Offers optional payment breakdowns, home comparisons, and forecast charts.
- Explains assumptions and terms; includes an optional animated financial-coach parody.
- Recovers local drafts and supports named scenarios and JSON plan import/export.

## Your data

Calculations stay on your device. Windows data is stored in `%APPDATA%/Daves Dollars`; website storage is separate. Moving the EXE does not move financial data. Use Export plan / Import plan to transfer a worksheet. No bank linking, account synchronization, automatic updates, or external AI service is included.

## Build from source

Requires Node.js 24 and npm on Windows. The calculator uses native JavaScript modules; `dist/` is the hand-authored source, not disposable build output.

```powershell
node --test tests/*.test.js desktop/policy.test.cjs
cd desktop
npm ci
npm run build
```

Output is under `desktop/release/`. Electron and electron-builder versions are pinned in the lockfile. To preview just the calculator, run `node scripts/serve.mjs` from the repository root and open the printed local URL.

## Assumptions and limitations

This is a planning calculator, not loan approval, a tax return, or a guaranteed forecast. Values and dates are explained inside the app. See [the financial model](docs/FORMULAS.md). Dave is an unaffiliated parody; the app is not endorsed by Dave Ramsey or Ramsey Solutions.

Version 1.1.0 was tested with 73 automated tests, 124 interface controls, randomized and extreme-portfolio checks, and Windows offline/restart/duplicate-launch checks. These describe the tested release, not a guarantee for every device or financial situation.
