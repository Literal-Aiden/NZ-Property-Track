# NZ Property Tracker

An app for New Zealand property investors and flippers to track their rental properties and current renovation projects. The owner is a real estate agent who is also renovating their first investment property, so their product feedback comes from both sides of the market.

## Current state

A working prototype: plain HTML, CSS and JavaScript with no build step. The only library is Leaflet for the nearby-sales map, loaded from a CDN when needed.

- `index.html` – page shell and tab bar
- `styles.css` – all styling, with light and dark themes via CSS variables
- `app.js` – all logic and rendering
- `sw.js`, `manifest.webmanifest`, `icons/` – install-as-app and offline support
- Data is saved in the browser's localStorage under the key `nzpt.v1`, so it stays on one device only. First load shows sample properties, and "Start fresh" clears them.

Open `index.html` in a browser to run it.

## Layout (keep this)

Three panes the user swipes between, with matching tabs at the top:

- **Left – Properties:** every property added, each with a Delete button that needs a second tap to confirm.
- **Centre – Current (opens here):** the selected property.
- **Right – Add new:** form for adding a rental or a renovation project.

## Features built so far

**Both property types**
- Purchase price, purchase date, legal fees, estimated value now (left blank, it uses the purchase price)
- Rentals: legal fees plus a separate "Healthy Homes / quick reno costs" field. Projects: one "Legal fees and other purchase costs" field (stored in `legal`, with `extra` 0; older projects show legal + extra combined when edited)
- When adding, the mortgage fields sit in a collapsed "Mortgage (optional)" section
- Required fields: inputs with the `required` attribute, checked by `missing()` on save (also: an interest rate whenever a loan amount is entered). Missing fields are outlined, the first is focused, and a collapsed mortgage section opens if needed. Optional fields say "(optional)" in their label
  - Reno project: address, suburb, purchase price, purchase date, reno budget
  - Rental: address, suburb, purchase price, purchase date, weekly rent, annual expenses
  - Potential buy: address, suburb, asking price, reno estimate, rates, insurance, months, sale price/value after reno, plus selling costs (reno to sell) or rent and expenses (buy to rent)
- Number fields are text inputs (no spinner arrows or scroll-wheel changes). Money fields (class `money`) show $ and commas as you type; read them with `num()`/`pnum()`
- Days owned, and total cost in (price + legal + extra + reno spend)

**Renovation projects**
- Renovation budget vs spent so far, shown as a progress bar that turns orange when over budget
- Budget remaining, and equity gain after reno (value minus total cost in)

**Rentals**
- Weekly rent, annual expenses, net annual income, and gross/net yield

**Mortgage (optional, per property)**
- Loan amount and an interest rate the user types in, since some investors use second-tier lenders
- Fixed term chosen from the standard NZ bank options: 6 months, 1 year, 18 months, 2, 3, 4 or 5 years, Floating, or a custom date. The re-fix date is calculated from the term and a "rate fixed from" date.
- The re-fix date is highlighted when it's within 90 days
- P&I vs interest-only: shows the repayment now and on the other loan type. The difference is framed as cash flow, not money saved, because it is mostly principal.
- Remaining loan term, default 30 years

**Potential buys** (third type, listed under "Potential buys" in the Properties pane; no mortgage section)
- Plan: "Reno to sell" or "Buy to rent"
- Estimates: asking/offer price, legal fees and other purchase costs as one field (builder's report, LIM, valuation; stored in `legal`), reno cost, holding costs per month × months until sold/tenanted
- Holding costs are worked out from council rates per year, insurance per year, optional power per month, an optional loan (amount, interest rate, P&I or interest-only, term default 30 years), and optional other costs per month ("e.g. water" for reno to sell, "e.g. water, lawns" for buy to rent). Shown live as a monthly figure (stored as `rates`, `ins`, `power`, `loan`, `rate`, `ltype`, `term`, `oth`, with the monthly total in `hold`)
- The loan's full repayment is counted, so the monthly figure is as close as possible to what actually goes out each month (the owner's choice). On P&I the note says how much of the repayment pays down the loan rather than being a cost. Older potential buys with only `hold` show it under other costs
- Converting to a reno project carries the estimated loan over as the project's mortgage (same loan type and term, no re-fix date yet)
- Reno to sell: est. sale price and selling costs → total cost, est. profit, return on costs. Profit is labelled before tax with an IRD check note
- Buy to rent: est. value after reno, weekly rent, annual expenses → total cost in, equity after reno, gross/net yield on total cost
- Optional bedrooms and land area, used to filter nearby sales
- Comparable sales nearby: entered by hand (address with search, price, date sold, notes) or added from imported sales data → median, range, estimate vs median, warning if the estimate is above every comp

**Reno costs (projects)**
- Categories (Demolition, Kitchen, Bathroom … Contingency, Other, plus custom) each with an optional budget; tap a category to see its costs
- Each cost: description, supplier/tradie, date, quote for the job, invoiced so far, paid. Amounts are incl. GST
- Once anything is itemised, `p.spent` is kept as the total invoiced, and the "Spent so far" field is hidden from Edit details. The first itemised cost turns any existing spent figure into a "Spent before itemising" cost under Other
- Shows spent, committed (larger of quote or invoiced), unpaid invoices, over quotes, contingency used, and unallocated budget. Export CSV for an accountant

**Receipts**
- Photos or PDFs attached to a cost, stored in IndexedDB (`nzpt` database, `rc` store), not localStorage. Items hold only `{id,name,type}`. Photos are scaled to 1600px JPEG

**Reno timeline (projects)**
- Start, target finish, holding cost per month. The first target set is kept as the baseline (`target0`), so delays show as days behind and extra holding cost
- Milestones (trade booked, consent, inspection, delivery, other) with tick-off and overdue highlighting; "Mark reno finished"

**Potential buy → project**
- "Bought it? Track it as a reno project" converts a potential buy, keeping the original estimates in `p.plan`. The project then shows Plan vs actual and projected total cost/profit

**Phone app feel**
- Installable: `manifest.webmanifest`, icons in `icons/`, and `sw.js` (network first for the app's own files, cached copy offline; never caches other sites or `.csv`). Only works when served over http(s), not from `file://`. Chrome shows "Install app" in the banner; iPhone gets a one-off "Add to Home Screen" hint card
- Asks the browser for persistent storage once there's real data, so receipts aren't cleared when space runs low
- Project page is split into section tabs: Overview · Costs · Timeline · Mortgage. A dot marks a section with something needing attention
- "Edit details" and "Edit mortgage" open in a slide-up panel over the current page (closes on Cancel, tapping outside, or Escape). Adding a property still uses the Add new pane

**Needs attention**
- Properties pane shows a "Needs attention" card and badges on each property: re-fix within 90 days, over budget (committed vs budget), unpaid invoices, overdue milestones, past target finish, and no backup in 30 days. Tapping one opens that property at the right section

**Backup**
- Properties pane: download a JSON backup of all properties plus their receipt files, or restore one (replaces everything, after confirming). REINZ sales data is never included. Last backup date shows in the banner

**Sales data import and nearby sales map**
- "Import sales CSV" on a potential buy reads a REINZ Statistics Search export (columns matched by header name: Street Number, Street, Suburb, Sale Price, Sale Date, plus optional List Price, Days To Sell, Sale Category, Valuation, Bedrooms, Floor Area, Land Area m2). Stored in localStorage under `nzpt.sales.v1`, separate from properties. Rows without a usable street number, price or date (Lot/null/malformed) are skipped
- REINZ data is licensed: keep it out of git (`*.csv` is in `.gitignore`) and never bundle it into the app
- "Find nearby sales" geocodes the subject and residential sales (Residence, Townhouse, Unit, Apartment, Home and Income, Conversion) with Nominatim at 1 request/second, same suburb first, caching positions in `nzpt.geo.v1`. Photon was tried for this but throttles bulk lookups. For production, use LINZ address data or a paid geocoder
- Results: distance filter (500 m / 1 / 2 / 5 km), optional similar bedrooms (±1), median, Leaflet map (loaded from cdnjs only when shown, OSM tiles), list with beds/floor/land/CV/days to sell and "Add as comp". "≈" marks street-level matches

**Address search**
- Typing 3+ characters in the Address field suggests NZ addresses; picking one fills Address and Suburb / city
- Uses the free Photon API (OpenStreetMap data, no key), so typed text goes to photon.komoot.io. For production, consider an NZ-specific source (LINZ / Addressfinder / NZ Post) and check its usage terms

**Editing**
- "Edit details" and "Edit mortgage" are separate forms, so editing one never touches the other
- The property type can't be changed while editing

## Guidelines

- Use NZ conventions: NZD, en-NZ date formats, and NZ terms (re-fix, Healthy Homes, bright-line, LVR).
- Design for phone width first.
- Don't hard-code tax or legal rules (bright-line, interest deductibility, GST) without flagging that they need checking against current IRD guidance. Rules change.
- Repayment figures are estimates; keep the wording honest about that.

## Ideas not yet built

- Sync data across devices and add user accounts (needs a backend)
- Re-fix reminders
- Converting a finished reno project into a rental
- Current bank rates shown as a reference
