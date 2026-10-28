# NZ Property Tracker

An app for New Zealand property investors and flippers to track their rental properties and current renovation projects. The owner is a real estate agent who is also renovating their first investment property, so their product feedback comes from both sides of the market.

## Current state

A working prototype: plain HTML, CSS and JavaScript with no build step or dependencies.

- `index.html` – page shell and tab bar
- `styles.css` – all styling, with light and dark themes via CSS variables
- `app.js` – all logic and rendering
- Data is saved in the browser's localStorage under the key `nzpt.v1`, so it stays on one device only. First load shows sample properties, and "Start fresh" clears them.

Open `index.html` in a browser to run it.

## Layout (keep this)

Three panes the user swipes between, with matching tabs at the top:

- **Left – Properties:** every property added, each with a Delete button that needs a second tap to confirm.
- **Centre – Current (opens here):** the selected property.
- **Right – Add new:** form for adding a rental or a renovation project.

## Features built so far

**Both property types**
- Purchase price, purchase date, legal fees, estimated value now
- An extra purchase-cost field: "Healthy Homes / quick reno costs" for rentals, "Other purchase costs" for projects
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
- Expense and receipt tracking for reno spend
- Current bank rates shown as a reference
