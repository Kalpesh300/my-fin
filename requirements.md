# Requirement Summary

Implement a Net Worth dashboard where a user can manage assets, liabilities, and their categories. The dashboard should let the user add, list, view details, update, and delete assets and liabilities, link each item to a category, and calculate net worth from total assets minus total liabilities.

## Clarifications Asked

- The previous root `requirements.md` was removed so new requirements can start clean.
- The user asked to check older requirements in the root `docs` directory before drafting; no root `docs` directory was found.
- The user provided screenshots for asset category forms; these are treated as the current source for category-specific fields.

## Final Assumptions

- A user owns their own assets, liabilities, and categories.
- Asset categories represent positive-value holdings or investments, such as Gold, Equity, Bonds, Fixed Deposit, Real Estate, PPF, EPF, Commodities, and Cash in Hand.
- Liability categories represent obligations or debt, such as Loan, Credit Card, Debt, Car Loan, Home Loan, or other borrowings.
- Categories should identify whether they belong to assets or liabilities; asset-linked categories should have positive expected return behavior and liability-linked categories should have negative return or cost behavior.
- Every asset or liability entry should support the common financial fields: investment or principal amount, annual interest rate, start date, maturity date, and compounding frequency.
- Category-specific fields should be shown in addition to common fields when the selected category requires them.
- INR should be the default amount currency.

## APIs To Create Or Update

- Create `GET /net-worth/summary`: Return total assets, total liabilities, net worth, and optional category-level breakdowns.
- Create `GET /asset-categories`: List asset categories with return direction, display name, and required field configuration.
- Create `POST /asset-categories`: Create an asset category; validate that its return behavior is positive.
- Create `GET /asset-categories/{id}`: Return asset category details and field requirements.
- Create `PATCH /asset-categories/{id}`: Update asset category metadata and field requirements.
- Create `DELETE /asset-categories/{id}`: Delete an asset category only when deletion rules are satisfied; clarify whether categories in use can be deleted.
- Create `GET /liability-categories`: List liability categories with return direction, display name, and required field configuration.
- Create `POST /liability-categories`: Create a liability category; validate that its return behavior is negative.
- Create `GET /liability-categories/{id}`: Return liability category details and field requirements.
- Create `PATCH /liability-categories/{id}`: Update liability category metadata and field requirements.
- Create `DELETE /liability-categories/{id}`: Delete a liability category only when deletion rules are satisfied; clarify whether categories in use can be deleted.
- Create `GET /assets`: List assets with category, current value, invested amount, maturity date, and summary metadata.
- Create `POST /assets`: Create an asset linked to an asset category; validate required common and category-specific fields.
- Create `GET /assets/{id}`: Return asset details, category details, values, dates, rates, notes, and calculated fields where available.
- Create `PATCH /assets/{id}`: Update asset details and recalculate affected summary values.
- Create `DELETE /assets/{id}`: Delete an asset and remove it from net worth calculations.
- Create `GET /liabilities`: List liabilities with category, outstanding amount, principal amount, maturity or due date, and summary metadata.
- Create `POST /liabilities`: Create a liability linked to a liability category; validate required common and category-specific fields.
- Create `GET /liabilities/{id}`: Return liability details, category details, rates, dates, notes, and calculated fields where available.
- Create `PATCH /liabilities/{id}`: Update liability details and recalculate affected summary values.
- Create `DELETE /liabilities/{id}`: Delete a liability and remove it from net worth calculations.

## DB Tables To Create Or Update

- `asset_categories`: Create; stores user-owned asset category names, positive return behavior, default field requirements, active status, and ordering.
- `liability_categories`: Create; stores user-owned liability category names, negative return behavior or cost behavior, default field requirements, active status, and ordering.
- `assets`: Create; stores user-owned asset records linked to asset categories, common financial fields, current value, notes, and category-specific data.
- `liabilities`: Create; stores user-owned liability records linked to liability categories, common financial fields, outstanding value, notes, and category-specific data.
- `net_worth_snapshots`: TBD; optional historical snapshots if the dashboard should show net worth changes over time.

## Frontend Updates

- Net Worth Dashboard:
  - Show total assets, total liabilities, and net worth.
  - Show asset and liability category breakdowns.
  - Provide entry points to add assets, add liabilities, manage categories, and open list/detail screens.
  - Include loading, empty, error, and success states.

- Asset List:
  - Show assets with category, name, invested amount, current value, maturity date, and latest known return or interest metadata.
  - Support view details, edit, and delete actions.
  - Include empty, loading, delete confirmation, success, and error states.

- Asset Details:
  - Show common fields, category-specific fields, notes, and calculated value where applicable.
  - Support edit and delete actions.

- Add/Edit Asset:
  - Require an asset category.
  - Show common fields: investment amount, annual interest rate, start date, maturity date, and compounding frequency.
  - Show category-specific fields based on the selected category.
  - Validate INR amounts, dates, required fields, positive return behavior, and category linkage.

- Liability List:
  - Show liabilities with category, name, principal amount, outstanding amount, rate, due or maturity date, and latest known cost metadata.
  - Support view details, edit, and delete actions.
  - Include empty, loading, delete confirmation, success, and error states.

- Liability Details:
  - Show common fields, category-specific fields, notes, and calculated outstanding value where applicable.
  - Support edit and delete actions.

- Add/Edit Liability:
  - Require a liability category.
  - Show common fields: principal or investment amount, annual interest rate, start date, maturity date, and compounding frequency.
  - Validate INR amounts, dates, required fields, negative return or cost behavior, and category linkage.

- Category Management:
  - Provide separate management screens or tabs for asset categories and liability categories.
  - Support add, list, details, update, and delete operations.
  - Let the user define category name, category type, return direction, and field requirements at a high level.

- Screenshot-derived asset category fields:
  - Cash in Hand: name, amount, notes.
  - Bonds: bond name, invested amount, current amount, maturity date, interest rate, credit rating, type, notes.
  - Real Estate: property type, property name, self-occupied flag, current value, purchase price, purchase date, city.
  - Commodities: investment type, name, commodity type, quantity in grams, buy price per gram, notes.
  - PPF: current balance, investment frequency, next investment date, investment amount, first investment date, notes.
  - EPF: current balance, monthly contribution, UAN number, notes.
  - Fixed Deposit: bank, investment amount, annual interest rate, start date, maturity date, compounding frequency.

## Out Of Scope

- Source code implementation for frontend, backend, database schema, or tests.
- Automatic imports from banks, brokers, EPFO, NSDL, CDSL, or statement files.
- Real-time market price integrations for equity, gold, commodities, or bonds.
- Tax calculations, compliance workflows, KYC, PAN, Aadhaar, or regulatory reporting.
- Multi-user household sharing, advisor access, or role-based permissions unless requested later.

## Open Questions

- Should assets and liabilities use one shared category model with a type field, or separate asset and liability category models?
- Which liability categories and category-specific fields should be supported first?
- Should users be allowed to create fully custom fields for categories, or should field configurations be limited to predefined templates?
- For asset values, should users enter current value manually, or should the app calculate current value from amount, rate, dates, and compounding frequency?
- For liabilities, should the app track original principal, outstanding balance, EMI, minimum due, due date, and payment history?
- Should categories that already have linked assets or liabilities be deletable, archived, or blocked from deletion?
- Should the dashboard show historical net worth trends, or only the current snapshot?
- Should investment amount be mandatory for every category, including Cash in Hand and Real Estate, where the screenshots use amount or current value wording?
- Which compounding frequency options should be available?
- Should attachments, documents, account numbers, nominee details, or institution names be captured for any category?
