# Financial model, version 1

Amounts are nominal USD. Income input is annual gross household income. Expenses, contributions, and debt payments are monthly. Rates in the UI are percentages; calculations retain floating-point precision and round only for display. Read linked authorities in `dist/content.js` for background; the app does not implement a complete tax code or underwriting system.

## Home and income

Monthly principal and interest is `L*r/(1-(1+r)^(-n))`, with monthly mortgage rate `r = annual percent / 1200`, term `n = years*12`, and loan `L = price*(1-down percent/100)`. Zero interest uses `L/n`. Cash purchases have zero principal and interest.

Housing adds property tax and maintenance at annual percentage of price divided by 12, monthly insurance, HOA, utilities, and conventional-loan modeled PMI below 20% down. PMI is not modeled as declining over an amortization schedule. It is an editable initial monthly planning expense.

In effective-rate mode, let G be monthly gross income, K pre-tax retirement, t effective income-tax rate, p effective payroll-tax rate, E non-housing spending including after-tax savings, and B desired buffer. Take-home = `G - K - t*(G-K) - p*G`. Available housing budget = take-home − E − B. Payroll taxes remain on gross. Brackets and wage caps are not applied in effective-rate mode; the optional 2026 wage mode is described below.

Required monthly gross reverses the same equation: `(housing + E + B + K*(1-t)) / (1-t-p)`. Combined tax rates must be under 95% and K cannot exceed current gross monthly income. A forward calculation still compares the desired home with current income and available cash separately.

Backward maximum price is the smaller of the monthly-budget cap and `(available cash − untouched reserve)/(down fraction + closing-cost fraction)`. Negative feasible limits become zero. Desired-price checks use the original target, even when the maximum is smaller. A zero home budget can still display fixed ownership assumptions; it does not imply those costs are affordable.

Stress tests raise mortgage rate and property-tax percentage in percentage points; scale lifestyle, utilities and car insurance; and separately scale healthcare. Base inputs remain intact. Changes are reflected consistently in results and category totals.

## Net worth and future age

Current net worth = full asset values − remaining debt balances. Use resale value for vehicles and belongings. Enter full property value and mortgage balance separately. Retirement balances are before withdrawal taxes. Do not duplicate emergency cash or count both property value and equity.

The target-age UI derives elapsed whole years, at least 1 and at most 100, with target age no later than 120. These bounds are UI modeling choices. The initial household age is 35 and target age 65. When current age changes, retain the target if still valid; otherwise use the next valid future age.

Annual asset return g becomes monthly growth factor `(1+g)^(1/12)`. Each month, grow the balance then add planned contributions to cash/investments until the selected stop age. Vehicle/belonging depreciation d uses `(1-d)^(1/12)` and no additions. A 100% depreciation assumption reduces value to zero.

Withdrawals begin at the selected age after growth/additions and use eligible cash first, then eligible investments, in displayed account order. HSA and 529 rows default to excluded from general withdrawals, while remaining included in net worth. Unfunded withdrawal requests are reported rather than silently borrowing or selling property. Debt interest is `balance*contractualAnnualRate/1200`, followed by the capped payment; balances stop at zero. Growing balances are flagged. Inflation-adjusted net worth = nominal net worth / `(1+inflation)^years`.

Contributions and debt payments are assumed funded from future outside income; they are not also deducted from listed cash. No automatic home purchase, inheritance, pension, Social Security, replacement vehicle, retirement tax, transaction cost, or reinvestment of finished loan payments occurs. Fixed returns are hypothetical, not a market simulation. Longer horizons can diverge dramatically from reality.

## Defaults and coach

Closing costs: editable 3%, informed by CFPB's 2–5% typical range. Vehicle depreciation: editable 10%, a midlife-car assumption informed by KBB's 8–12% after the first two years; not a new-car first-year estimate. Belongings: illustrative 20%, not a sourced universal rate. Income defaults to the 2024 Census household median of $83,730; desired home price to NAR’s July 2026 existing-home sale median of $431,400; down payment to NAR’s 2025 buyer median of 19%. The starting mortgage rate is the September 10, 2026 Freddie Mac average of 6.76%, not a median. Current rent defaults to the 2024 ACS gross-rent median of $1,487 including utilities. All other starting amounts remain editable assumptions; missing comparable medians are explicitly disclosed. BLS means in help are comparison context, not relabeled medians. Cross-population medians do not describe one representative household.

Age-group medians are explicitly dated to the Federal Reserve's 2022 SCF, in 2022 dollars; income covers the preceding year. They are context, not a current-dollar target. Ask Dave uses the current worksheet and selected Budget housing mode, prioritizing cash-flow and purchase-cash gaps, excessive car payments, negative worth and forecast funding. Reactions are not actual Dave Ramsey advice or endorsement. The prior extra 10% take-home cushion is superseded by the user's explicit monthly buffer; configurable commentary thresholds never alter calculator answers.

## Shared Budget and summary imports

Budget uses the same home income, tax, retirement, spending, debt-payment, and after-tax savings fields. Current remaining = modeled take-home − non-housing costs − current all-in housing. Proposed remaining replaces current housing with modeled target-home housing. Current housing includes utilities; proposed-home utilities are never also added to the current budget. Health premiums are included once in essentials, after the modeled take-home calculation. Gross income is required; paycheck deposits must not be entered as gross. Annual expense entry is a display convenience: divide by 12 into the existing monthly field. Net-worth balances remain explicit. Forecast additions can optionally reuse matching Budget savings; no automatic home purchase or account transfer is inferred.

A summary CSV has field, amount, period headers. Categories are allowlisted; numbers are finite and nonnegative; periods monthly or annual; duplicates rejected. Review shows replacements before applying. Files never leave the browser. Unlisted fields remain unchanged. Raw bank transactions are not auto-categorized. Old v1 scenarios without Budget settings retain financial entries and receive only the new budget defaults. The original localStorage key is preserved.

## September 12 presentation rules

The target-home meter is a categorical monthly-fit indicator, not a continuous score or lender rule. Red means negative monthly money remaining at the target; amber means nonnegative remaining money below the user-selected buffer; green means the buffer is met (one-cent comparison tolerance). A separate upfront-cash message remains visible even when monthly fit is green. A zero target has no marker. Mortgage, tax, cash-cap, and reverse-income formulas above are unchanged. Zero-price results label residual fixed ownership assumptions explicitly and distinguish a monthly constraint from a cash-only constraint.

Budget defaults to horizontal category bars, with a circle option. Both use identical current/proposed housing allocations. Positive unallocated income is a separate ring segment; when allocations exceed take-home, the ring represents allocations only and the shortfall is displayed separately. No tracked-spending claims are made. Budget compares base inputs, with stress adjustments confined to the home views and disclosed beside proposed housing.

Optional `provenance.home` and `provenance.budget` metadata labels example, entered, imported, and legacy saved values; it never changes calculations. New untouched fields are gray examples. Explicit edits, including edits equal to defaults, remain entered. Legacy saves are marked Saved value rather than retroactively guessed as user input. Gray examples and dark entered/saved values also have text labels. Saving/importing preserves this distinction. Collapsed categories remain included in every calculation.

## Optional 2026 wage-tax model and local ownership estimates

`tax.js` owns the alternative annual W-2 wage calculation, selected with `home.taxMode=1`; zero retains effective-rate mode and old saves. Federal taxable income is nonnegative wages less entered pre-tax retirement and the selected standard deduction. Progressive marginal rates are 10%, 12%, 22%, 24%, 32%, 35%, 37%; exact filing-status tables live once in `TAX_SCHEDULES`. Standard deductions are $16,100 single, $32,200 married filing jointly, $24,150 head of household. This is an ordinary wage estimate, not a tax-return implementation: no credits, itemized/additional deductions (including age-based deductions), non-wage/self-employment income, pre-tax health benefits or contribution-limit enforcement.

Social Security is 6.2% of each earner's wages up to $184,500. Joint filers can select two earners and the second earner's share of total wages; one earner or other filing statuses use the total as one wage stream. Medicare is 1.45% of all wages plus 0.9% above $250,000 joint or $200,000 single/head. Pre-tax retirement does not reduce these payroll wages. The user-entered state/local effective rate applies to wages after pre-tax retirement; no state jurisdiction is inferred. Annual taxes and retirement are divided by 12 to calculate take-home. Reverse income uses bounded bisection over annual wages to fund housing, other spending and the same buffer under the same chosen tax mode.

Primary sources checked September 12, 2026: [IRS Publication 505, 2026 tables](https://www.irs.gov/publications/p505), [SSA 2026 fact sheet](https://www.ssa.gov/cola/factsheets/2026.html), [IRS Additional Medicare Tax](https://www.irs.gov/taxtopics/tc560). The head-of-household 24% bracket ends at $201,750 and 32% ends at $256,200; these differ from single-filer cutoffs.

The annual ownership dialog converts `annual property-tax estimate / target home price * 100` into the existing rate and `annual insurance premium / 12` into fixed monthly insurance. It previews the result before applying. Changing target price subsequently scales taxes with that calibrated rate; insurance stays fixed. A positive target is required. Enter post-purchase local tax estimates and actual insurance quotes; no ZIP lookup, automatic exemptions or live insurance feed is claimed. [CFPB Loan Estimate guide](https://www.consumerfinance.gov/owning-a-home/loan-estimate/).

## Contextual coach and saved comparisons

`diagnosis.js` contains the sole reaction engine. Priority findings: monthly deficit, purchase cash shortage, car payments above the configurable take-home share (15% initial app preference), unfunded forecast withdrawals, or forecast payments below initial debt interest. A current-worth-only view treats unentered forecast payments as data to confirm. Other findings include a buffer shortfall, negative net worth, loss of real purchasing power, long horizons and missing/insufficient designated emergency reserves (initial target three months of Budget housing, essentials and debt). Each finding includes a quantified explanation and an editable destination. No age-group median determines the mood.

Optional Ramsey preferences flag consumer debt, mortgages longer than 15 years or above 25% take-home (principal, interest, tax, insurance, HOA, PMI), and vehicle values above half annual gross income. These preferences cite Ramsey's own publications in the panel and source list. They do not constrain the main answer. The UI identifies unchanged examples and mixed household inputs, and does not imply blank net-worth data is a diagnosis. Coach preferences persist in named scenarios and migrate safely into old saves.

Scenario comparisons validate independent copies and show both home views, base Budget balances, net worth, future nominal/real values, unfunded withdrawals and differences in stored assumptions. Different ages/horizons are explicitly flagged; stress and tax modes are labeled. Comparing does not load or mutate either plan. Amount entry groups dollars after blur; it validates the whole numeric string and preserves invalid drafts when navigating or editing another field.


## September 12 accepted planning update

Personal additions may link to the stable emergency/401k/Roth/brokerage/529 account IDs, or remain manual. Existing saves default to manual so prior assumptions are preserved. Missing destinations are reported. Row account types are separate from editable names; an explicit inclusion checkbox controls general withdrawals. Employer matching is a separate, fixed nominal monthly addition to the 401k account, stopping with contributions; enter vested expected match only. Never include it again in personal additions.

Annual personal-contribution growth applies in whole-year steps. Income growth affects funding checks only; optional replacement annual income starts at the chosen age and grows thereafter. Budget expenses remain fixed nominal amounts. This is an illustration, not a retirement-income tax engine. Contributions still project when funding is inadequate, accompanied by current/future shortfall messages.

Funding uses selected current/proposed housing, essentials, flexible costs, and reconciled debt payments. Already-budgeted contributions are replaced by forecast contributions, not deducted twice. Employer money does not reduce take-home. Consumer debt uses the larger of Budget debt and forecast nonmortgage obligations. Proposed mortgage overlap reserves the larger PI amount; current all-in housing is assumed to include the current mortgage. If renting while paying another property loan, both must be included in current housing as the warning states. This aggregate model does not infer separate properties or automatically purchase the proposed home.

Optional inflation-adjusted withdrawals multiply today's monthly amount by `(1+inflation)^(elapsedMonths/12)`, including years before withdrawals start. Nominal net worth and purchasing power are labeled separately. Chart attribution reconciles starting net worth, personal additions, employer additions, asset growth/depreciation, debt principal paid, and withdrawals; losses remain signed rather than portrayed as positive stacked growth.

Full JSON plan backups use validated v1 state. Local draft recovery separately permits the two cross-field household errors (combined taxes and retirement above gross pay), retains raw invalid numeric input text, and withholds results until corrected. Named scenarios and exports remain strict. The selected Budget housing mode persists across scenarios and drafts.
