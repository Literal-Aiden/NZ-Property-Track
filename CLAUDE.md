# NZ Property Tracker

An app for New Zealand property investors and flippers to track their rental properties and current renovation projects. The owner is a real estate agent who is also renovating their first investment property, so their product feedback comes from both sides of the market.

## Current state

A working prototype: plain HTML, CSS and JavaScript with no build step. The only library is Leaflet for the nearby-sales map, loaded from a CDN when needed.

- `index.html` – page shell: the screens, bottom tab bar, + menu and edit panel
- `layout.css` – the app layout (screens, tab bar, Home, Properties list, property page, + menu); loaded after `styles.css`
- `styles.css` – base styling, with light and dark themes via CSS variables. Colour scheme is pōhutukawa red on sand: `--acc` red for buttons, links and selected states; `--good` green for equity, profit, progress bars and ticks; `--warn` amber for over budget and overdue. Keep red for actions, not for "bad" numbers
- Icons: Feather-style line icons in `ICONS` (`util.js`); `ic(name)` gives an inline SVG and `hd(name, title)` a card heading with an icon. The tab bar icons are inline in `index.html`
- `js/` – all logic and rendering, as plain scripts sharing one global scope (no modules, no build). `index.html` loads them in order and `main.js` must stay last:
  - `data.js` sample data, saving, app-wide state · `util.js` helpers and formatting · `receipts.js` receipt files (IndexedDB)
  - `sales.js` REINZ import and nearby sales map · `costs.js` reno costs · `timeline.js` reno timeline · `rental.js` rental money, tenancy, Healthy Homes, project → rental
  - `potential.js` potential buys, holding costs, maximum offer, plan vs actual · `settings.js` backup, restore, install · `address.js` address suggestions
  - `councils.js` which council an address is in, and its rates search link · `tour.js` the welcome tour · `picker.js` the dropdown picker
  - `views.js` property page, headline numbers, alerts, Properties list, cover photos · `home.js` Home screen and the + menu · `forms.js` add/edit forms and validation · `tools.js` calculators · `main.js` navigation, rendering, event wiring, delete/undo
- When adding a file, add it to the `<script>` or stylesheet list in `index.html` and to `FILES` in `sw.js` (and bump `CACHE`)
- `mockup/index.html` – the clickable layout mock-up the current layout was built from (not part of the app)
- `sw.js`, `manifest.webmanifest`, `icons/` – install-as-app and offline support
- Data is saved in the browser's localStorage under the key `nzpt.v1`, so it stays on one device only. First load shows sample properties, and "Start fresh" clears them.

Open `index.html` in a browser to run it.

## Layout (keep this)

A bottom tab bar, like most phone apps: **Home · Properties · + · Tools · Settings**. The owner chose this from a clickable mock-up (`mockup/index.html`). One screen shows at a time; the tab bar hides while typing so it doesn't sit above the keyboard.

- **Home (opens here):** greeting, a red portfolio card (equity, value, lending, LVR, monthly cash flow), quick actions (Log rent, Reno cost, Milestone, Deal check), Needs attention, and Recent activity (latest dated rent, expenses and reno costs). Sample-data note with "Start fresh" when showing sample properties; a welcome card when there are no owned properties
- **Properties:** a search box (matches address and suburb; typing redraws only the cards in `#plist`, via `plist()`), filter chips (All, Reno projects, Rentals, Potential buys) and a card per property with its photo (or a coloured placeholder by type), a type tag and one headline number (equity gain, monthly cash flow, est. profit or yield on cost). An amber dot means it needs attention. Tapping opens the property page
- **Property page (opens full screen on top, with a back button):** a cover (photo with "Add photo"/"Change photo", or a coloured placeholder), the address, a headline card with the key number and "Edit details", then section tabs (projects: Overview · Costs · Timeline · Mortgage; rentals: Overview · Money · Tenancy · Mortgage). Overview figures are a simple list. Potential buys show their deal estimates and maximum offer below the headline (comparable sales are hidden for now)
- **+ menu (slide-up):** Rent or expense, Reno cost, Milestone, Property, and Quick deal check. Rent/cost/milestone ask which property (skipped when there's only one) and open its page with the form ready. Property opens the add page (choose type, then the form)
- **Tools:** the calculators; a calculator opens with a back button to the list
- **Settings:** Backup/restore, Install the app, and Welcome tour. A dot on the Settings tab means a backup is due
- Deleting is in a property's Edit details panel and happens straight away with an Undo message for 7 seconds; its receipt files are only removed once the message goes

## Features built so far

**Both property types**
- Purchase price, purchase date, legal fees, estimated value now (left blank, it uses the purchase price)
- Rentals: purchase price and date are optional (a rental may have been owned for decades); without a price, the estimated value is required instead, and Overview shows the price as "Not entered" and total cost in as "–"
- Rentals: legal fees plus a separate "Healthy Homes / quick reno costs" field. Projects: one "Legal fees and other purchase costs" field (stored in `legal`, with `extra` 0; older projects show legal + extra combined when edited)
- When adding, "Current loan balance (optional)" is in the main form (what's owed now, not the original loan; blank means mortgage-free), because for a long-held property it matters more than the purchase details. The rate, fixed term and other loan details sit in a collapsed "Mortgage details (if there's a loan)" section. Edit mortgage labels the loan "Current loan balance" too
- Overview shows Current loan (or "Mortgage-free or not added" with a "+ Add a loan" button that opens Edit mortgage; the Mortgage tab says the same), Equity (value − loan) and LVR, and "Owned for" in days, months or years
- Required fields: inputs with the `required` attribute, checked by `missing()` on save (also: an interest rate whenever a loan or loan part amount is entered, and a rental's value when it has no purchase price). Missing fields get an amber outline and label, a short note under the field ("Required", or why, e.g. "Needed when there’s a loan amount") and a quick shake; a summary by the Save button names them all ("To save, fill in Address, Purchase price and …") and shrinks as each is filled in (`errSum()`; `unbad()` clears a field). The first is focused and scrolled to, and a collapsed mortgage section opens if needed. Optional fields say "(optional)" in their label
  - Reno project: address, suburb, purchase price, purchase date, reno budget
  - Rental: address, suburb, weekly rent, annual expenses, and the estimated value if there's no purchase price
  - Reno cost: description. Milestone: its name
  - Potential buy: address, suburb, asking price, reno estimate, rates, insurance, months, sale price/value after reno, plus selling costs (reno to sell) or rent and expenses (buy to rent)
- Dropdowns (`<select>`) open a compact picker at the bottom of the screen (`picker.js`) instead of the phone's own full-screen list, so they're easy to use one-handed. It applies to every select automatically: the select stays in the form, gets the chosen value and fires `input`/`change`, so form code reads it as normal. Short options show in two columns, long ones in one; an empty first option (e.g. "Fill in from a property…") becomes the title, otherwise the label just before the select. Keyboard users still get the browser's list
- Number fields are text inputs (no spinner arrows or scroll-wheel changes). Money fields (class `money`) show $ and commas as you type; read them with `num()`/`pnum()`
- Days owned, and total cost in (price + legal + extra + reno spend)

**Renovation projects**
- Renovation budget vs spent so far, shown as a progress bar that turns orange when over budget
- Budget remaining, and equity gain after reno (value minus total cost in)

**Rentals** (section tabs: Overview · Money · Tenancy · Mortgage)
- Weekly rent, annual expenses, net annual income, and gross/net yield
- Money: income and expense entries (`p.money`: kind, category, date, amount, note, receipts), with income, expenses and net for the NZ tax year (from 1 April, up to today), rent received vs expected (weekly rent since the later of 1 April or purchase), and CSV export
- Income can be one payment, or the same amount weekly "for a number of weeks" or "until a date" (each week starting on or before it). Stored as one entry with `wk` (per week), `n` (weeks) and `amt` (the total); `mIn()` counts only the weeks dated within a period, so tax-year totals and rent received only include weeks up to today. The list shows weeks × amount, the date range and the amount to date; the CSV export has one row per week
- Tenancy (`p.ten`): tenant, lease start, fixed term end (blank = periodic), last rent increase, bond and whether it's lodged. Next rent increase is shown as 12 months after the last one, with a note to check current rules at tenancy.govt.nz
- Healthy Homes checklist (`p.hh`, date each standard was ticked): heating, insulation, ventilation, moisture ingress and drainage, draught stopping, with a note to check current requirements and deadlines at tenancy.govt.nz. "Mark all as done" ticks the rest at once. A compliance report (PDFs or photos) can be uploaded below the checklist; files are saved straight away in IndexedDB (`p.hhDocs`), and removing one needs a second tap
- A finished reno project (after "Mark reno finished") can be turned into a rental. Its reno spend stays in `p.spent` (so in total cost in), its costs/timeline data are kept, and `p.fromProject` records the date

**Portfolio** (red card at the top of Home, owned properties only)
- Total value, total lending, equity, LVR, and monthly cash flow: rentals are rent less expenses and mortgage repayments; projects are their holding cost (or repayments if no holding cost is set)

**Mortgage (optional, per property)**
- Split loans: a mortgage can have several parts (`p.parts`), each with its own amount, rate, fixed term, loan type and term. `p.loan` is always the total and `p.rate` the average weighted by amount, so equity, LVR, the portfolio card and the calculators work unchanged. `parts(p)` gives the parts (an older property, or a potential buy, with the loan fields on the property itself counts as one part) and `partPay()` a part's repayment. Edit mortgage has "+ Split the loan into parts" / "+ Add another loan part" and Remove; when adding a property with one part, its amount is the main form's "Current loan balance". The Mortgage section lists each part with its repayment and re-fix date, and each part's re-fix gets its own Needs attention item
- Loan amount and an interest rate the user types in, since some investors use second-tier lenders
- Fixed term chosen from the standard NZ bank options: 6 months, 1 year, 18 months, 2, 3, 4 or 5 years, Floating, or a custom date. The re-fix date is calculated from the term and a "rate fixed from" date.
- The re-fix date is highlighted when it's within 90 days
- P&I vs interest-only: shows the repayment now and on the other loan type. The difference is framed as cash flow, not money saved, because it is mostly principal.
- Remaining loan term, default 30 years

**Potential buys** (third type, listed under "Potential buys" in the Properties pane; no mortgage section)
- Plan: "Reno to sell" or "Buy to rent"
- The add/edit form is compact: sections (Purchase, Holding costs, Selling/Renting) with paired fields side by side, the loan in a collapsed "Loan (optional)" section, and optional fields marked with a small "optional" tag
- Estimates: asking/offer price, legal fees and other purchase costs as one field (builder's report, LIM, valuation; stored in `legal`), reno cost, holding costs per month × months until sold/tenanted
- Holding costs are worked out from council rates per year, insurance per year, optional power per month, an optional loan (amount, interest rate, P&I or interest-only, term default 30 years), and optional other costs per month ("e.g. water" for reno to sell, "e.g. water, lawns" for buy to rent). Shown live as a monthly figure (stored as `rates`, `ins`, `power`, `loan`, `rate`, `ltype`, `term`, `oth`, with the monthly total in `hold`)
- The loan's full repayment is counted, so the monthly figure is as close as possible to what actually goes out each month (the owner's choice). On P&I the note says how much of the repayment pays down the loan rather than being a cost. Older potential buys with only `hold` show it under other costs
- Converting to a reno project carries the estimated loan over as the project's mortgage (same loan type and term, no re-fix date yet)
- Reno to sell: est. sale price and selling costs → total cost, est. profit, return on costs. Profit is labelled before tax with an IRD check note
- Buy to rent: est. value after reno, weekly rent, annual expenses → total cost in, equity after reno, gross/net yield on total cost
- Optional bedrooms and land area, used to filter nearby sales
- Maximum offer: enter a target profit before tax (reno to sell) or a target gross/net yield on total cost (buy to rent), and it works back to the most you could pay, compared with the asking price. Other estimates are held as entered. Saved as `p.tgt` / `p.tgtT`
- Comparable sales nearby (HIDDEN FOR NOW: `SHOW_COMPS = false` in `potential.js`; the code, the sales import and the map below are kept, and saved comps stay in the data): entered by hand (address with search, price, date sold, notes) or added from imported sales data → median, range, estimate vs median, warning if the estimate is above every comp

**Reno costs (projects)**
- Categories (Demolition, Kitchen, Bathroom … Contingency, Other, plus custom) each with an optional budget; tap a category to see its costs
- Each cost: description, supplier/tradie, date, quote for the job, invoiced so far, paid. Amounts are incl. GST
- Once anything is itemised, `p.spent` is kept as the total invoiced, and the "Spent so far" field is hidden from Edit details. The first itemised cost turns any existing spent figure into a "Spent before itemising" cost under Other
- Shows spent, committed (larger of quote or invoiced), unpaid invoices, over quotes, contingency used, and unallocated budget. Export CSV for an accountant

**Receipts**
- Photos or PDFs attached to a reno cost or a rental money entry, stored in IndexedDB (`nzpt` database, `rc` store), not localStorage. Items hold only `{id,name,type}`. Photos are scaled to 1600px JPEG

**Reno timeline (projects)**
- Start, target finish, holding cost per month. The first target set is kept as the baseline (`target0`), so delays show as days behind and extra holding cost
- Milestones (trade booked, consent, inspection, delivery, other) with tick-off and overdue highlighting; "Mark reno finished"

**Potential buy → project**
- "Bought it? Track it as a reno project" converts a potential buy (purchase price, date and reno budget required), keeping the original estimates in `p.plan`. The project then shows Plan vs actual and projected total cost/profit

**Phone app feel**
- Installable: `manifest.webmanifest`, icons in `icons/`, and `sw.js` (network first for the app's own files, cached copy offline; never caches other sites or `.csv`). Only works when served over http(s), not from `file://`. Chrome offers an "Install app" button in Settings; iPhone gets a one-off "Add to Home Screen" hint card on Home
- Asks the browser for persistent storage once there's real data, so receipts aren't cleared when space runs low
- Owned properties are split into section tabs (projects: Overview · Costs · Timeline · Mortgage; rentals: Overview · Money · Tenancy · Mortgage). A dot marks a section with something needing attention
- "Edit details" and "Edit mortgage" open in a slide-up panel over the property page (closes on Cancel, tapping outside, or Escape)
- Navigation (`main.js`): tabs are `home`, `p0` (Properties), `toolbody` (Tools), `setbody` (Settings); pages opened on top are `p1` (property) and `p2` (add a property). `navTab()` switches tab, `openPage()` / `go(1|2)` opens a page, `openProp(i, section)` opens a property
- Phone Back button: pages (`p1`, `p2`) and panels (the + menu, the edit panel, a calculator) add a history entry when opened (`ovOpen`), so Back closes the top one instead of leaving the app. Their own close buttons go through `ovClose`, which steps back through history, so entries don't pile up. `ovSwap` replaces the top entry (e.g. the + menu turning into the property page it opened). Switching tabs steps back past everything open. A new panel needs an `ovOpen` call, an `ovClose` for its close button, and a case in `ovShut`

**Welcome tour** (`tour.js`)
- Shown over Home the first time the app opens (until `nzpt.tour` is set in localStorage), and again from Settings → "Show the tour". Six slides in `TOUR`: welcome, the + button, Home, Properties, Tools, and data staying on this phone (backups). Each slide after the first shows a small copy of the tab bar with its button lit up
- Next/Back buttons, swiping, arrow keys; Skip, Escape or the phone's Back button close it (it's an `ovOpen('tour')` panel). Closing it any way marks it seen
- The last slide offers "Add my first property" when showing sample data (clears the examples, like Start fresh) or when there are no properties; otherwise "Get started"

**Needs attention**
- Home shows a "Needs attention" list (and the Properties list an amber dot on each affected property): re-fix within 90 days, over budget (committed vs budget), unpaid invoices, overdue milestones, past target finish, lease ending within 60 days, bond not lodged, Healthy Homes standards not ticked, and no backup in 30 days. Tapping one opens that property at the right section

**Tools & calculators** (Tools tab, `tools.js`; Quick deal check is also on Home and in the + menu)
- Each calculator is declared in `TOOLS` as fields plus a `calc()` returning the result. Last-used inputs are remembered per calculator in localStorage (`nzpt.tools.v1`). Most can be filled in from a property ("Fill in from a property…")
- Quick deal check: reno to sell (profit, return on costs) or buy to rent (yield on total cost, equity), using the same `deal()` maths as potential buys. "Save as potential buy" opens the Add new form with the figures filled in (loan and other monthly costs go into "Other / month")
- Mortgage repayments: monthly, fortnightly or weekly, P&I or interest-only, with the other loan type, monthly equivalent and total interest
- Rental yield: gross and net yield, rent and net income per year
- Holding costs: rates, insurance, power, other, and an optional loan (full repayment counted, as for potential buys), monthly and over a number of months
- Break-even rent: weekly rent that covers repayments and costs, allowing for a management fee % and vacant weeks, compared with the current rent
- Usable equity: equity available at a max LVR the user enters, and the next purchase price that could support at a deposit % they enter. "Use my portfolio" fills in total value and lending. Notes that LVR rules change and that income servicing isn't checked
- Selling costs: commission as tiered % (e.g. 3.95% on the first $400,000, 2% on the rest), flat %, or a flat $ fee (all defaults are examples, user-editable), plus GST or no GST (GST fixed at 15% in `GST` in `tools.js`, the owner's choice; update it there if the rate changes), one combined "Marketing, legal & other" amount, and what the seller receives

**Backup**
- In the Settings tab (also reached from the "Needs attention" backup item on Home): download a JSON backup of all properties plus their receipt files and cover photos, or restore one (replaces everything, after confirming). REINZ sales data is never included. A dot on the Settings tab shows when a backup is due (none yet, or over 30 days)

**Testing card (TEMPORARY, remove before a real launch)**
- Settings has a "Testing" card (`testCard()` / `testRun()` in `settings.js`): "Load example properties" swaps everything for the sample properties, and "Clear all data" leaves no properties. Both clear receipts and photos, need a second tap within 4 seconds, and go to Home

**Cover photos**
- One photo per property (`p.photo`), added from the property page's cover. Stored in IndexedDB like receipts, scaled to 1600px JPEG, included in backups, and removed with the property

**Sales data import and nearby sales map**
- "Import sales CSV" on a potential buy reads a REINZ Statistics Search export (columns matched by header name: Street Number, Street, Suburb, Sale Price, Sale Date, plus optional List Price, Days To Sell, Sale Category, Valuation, Bedrooms, Floor Area, Land Area m2). Stored in localStorage under `nzpt.sales.v1`, separate from properties. Rows without a usable street number, price or date (Lot/null/malformed) are skipped
- REINZ data is licensed: keep it out of git (`*.csv` is in `.gitignore`) and never bundle it into the app
- "Find nearby sales" geocodes the subject and residential sales (Residence, Townhouse, Unit, Apartment, Home and Income, Conversion) with Nominatim at 1 request/second, same suburb first, caching positions in `nzpt.geo.v1`. Photon was tried for this but throttles bulk lookups. For production, use LINZ address data or a paid geocoder
- Results: distance filter (500 m / 1 / 2 / 5 km), optional similar bedrooms (±1), median, Leaflet map (loaded from cdnjs only when shown, OSM tiles), list with beds/floor/land/CV/days to sell and "Add as comp". "≈" marks street-level matches

**Address search**
- Typing 3+ characters in the Address field suggests NZ addresses; picking one fills Address and Suburb / city. Up to 25 suggestions (Photon asked for 40, before removing non-NZ and duplicates) in a list about five rows tall that scrolls (`.sugl`), so a common street name found in many towns can be picked by scrolling; with more than five, a note says how many and suggests adding the suburb
- Speed: Photon is in Germany, so a new connection takes about 0.9 s and each search about 0.3 s (measured from NZ, Oct 2026). The connection is opened when an address field is tapped (`acWarmUp()`, a preconnect); searches start 150 ms after typing pauses; earlier searches aren't cancelled; results are cached per query (`acCache`), so backspacing is instant; and while a search is on its way, the suggestions on screen are narrowed to what still matches (`acMatch()`: every typed word starts a word of the address) rather than cleared. An NZ-hosted service would answer in under 0.1 s
- Uses the free Photon API (OpenStreetMap data, no key), so typed text goes to photon.komoot.io. For production, consider an NZ-specific source (LINZ / Addressfinder / NZ Post) and check its usage terms

**Rates lookup (council links)**
- Under "Rates per year" (potential buys) and "Annual expenses" (rentals) there's a link to the property's council rates search (`rateLink()` in `forms.js`, `ratesLink()` / `councilOf()` in `councils.js`). The app doesn't fetch rates itself: there's no national rates source, each council runs its own database, and many council sites block automated requests (checked Oct 2026), so a relay server can't cover the country
- `COUNCILS` lists all 67 city and district councils with their website and the words that identify them (council name, main towns). The council comes from the picked address suggestion (Photon's `county`, kept in `data-county` on the suburb field and cleared when the suburb is typed by hand), else from the suburb / city text, last comma part first
- Councils with a known rates search page link straight to it (Gisborne's takes the address, so it opens the results); the rest link to a DuckDuckGo search of the council's own site for "rates search". With no council matched, it searches "<suburb> council rates search". To add a direct link, put the URL as the 4th item of that council's entry, with `{q}` where the address goes if the site supports it
- Gisborne's database (rid.gdc.govt.nz) could be read by a relay server for full auto-fill (total rates, capital value, land area); not built

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
- Re-fix reminders that reach the user outside the app (e.g. add to calendar as an .ics file)
- Current bank rates shown as a reference
