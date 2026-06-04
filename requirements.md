# Requirement Summary

Implement a Net Worth dashboard where a user can manage assets, liabilities, and their categories. The dashboard should let the user add, list, view details, update, and archive assets and liabilities, link each item to a category, calculate net worth from total assets minus total liabilities, and show monthly historical net worth trends over time.

## Clarifications Asked

- The previous root `requirements.md` was removed so new requirements can start clean.
- The user asked to check older requirements in the root `docs` directory before drafting; no root `docs` directory was found.
- The user provided screenshots for asset category forms; these are treated as the current source for category-specific fields.
- Net worth history should be shown over time with month as the data point.
- Asset categories and liability categories should be separate.
- Categories should use predefined templates, not user-defined custom field builders.
- Asset current value should support both manual entry and calculated value options.
- V1 liability categories should include the mentioned loan and debt categories: home loan, personal loan, credit card, car loan, and other debt.
- Liabilities should track EMI, outstanding balance, due date, minimum due, and payment history.
- Delete behavior should be archive-only; no hard deletes.
- V1 asset categories should include Cash in Hand, Bonds, Real Estate, Commodities, PPF, EPF, and Fixed Deposit.
- Equity, Stocks, and Mutual Funds should be handled later.
- Compounding frequency should support monthly, quarterly, half-yearly, yearly, and on maturity.

## Final Assumptions

- A user owns their own assets, liabilities, and categories.
- Asset categories represent positive-value holdings or investments, with V1 predefined templates for Cash in Hand, Bonds, Real Estate, Commodities, PPF, EPF, and Fixed Deposit.
- Liability categories represent obligations or debt, with V1 predefined templates for Home Loan, Personal Loan, Credit Card, Car Loan, and Other Debt.
- Asset categories and liability categories should be managed separately; asset-linked categories should have positive expected return behavior and liability-linked categories should have negative return or cost behavior.
- Every asset or liability entry should support the common financial fields: investment or principal amount, annual interest rate, start date, maturity date, and compounding frequency.
- Compounding frequency options should be monthly, quarterly, half-yearly, yearly, and on maturity.
- Category-specific fields should be shown in addition to common fields when the selected category requires them.
- Asset value should allow both manual current value entry and calculated current value from amount, rate, dates, and compounding frequency.
- Liability records should support original principal, outstanding balance, EMI, minimum due, due date, and payment history.
- Delete operations should archive records instead of permanently deleting them.
- INR should be the default amount currency.

## APIs To Create Or Update

- Create `GET /net-worth/summary`: Return total assets, total liabilities, current net worth, and category-level breakdowns.
- Create `GET /net-worth/history`: Return monthly historical net worth data points, including total assets, total liabilities, and net worth for each month.
- Create `GET /asset-categories`: List asset categories with return direction, display name, and required field configuration.
- Create `POST /asset-categories`: Create or enable a predefined asset category; validate that its return behavior is positive.
- Create `GET /asset-categories/{id}`: Return asset category details and field requirements.
- Create `PATCH /asset-categories/{id}`: Update allowed asset category metadata for a predefined template.
- Create `DELETE /asset-categories/{id}`: Archive an asset category; do not hard delete it.
- Create `GET /liability-categories`: List liability categories with return direction, display name, and required field configuration.
- Create `POST /liability-categories`: Create or enable a predefined liability category; validate that its return behavior is negative.
- Create `GET /liability-categories/{id}`: Return liability category details and field requirements.
- Create `PATCH /liability-categories/{id}`: Update allowed liability category metadata for a predefined template.
- Create `DELETE /liability-categories/{id}`: Archive a liability category; do not hard delete it.
- Create `GET /assets`: List assets with category, current value, invested amount, maturity date, and summary metadata.
- Create `POST /assets`: Create an asset linked to an asset category; validate required common and category-specific fields.
- Create `GET /assets/{id}`: Return asset details, category details, manual current value, calculated current value where available, dates, rates, notes, and value mode.
- Create `PATCH /assets/{id}`: Update asset details and recalculate affected summary values.
- Create `DELETE /assets/{id}`: Archive an asset and remove it from active net worth calculations.
- Create `GET /liabilities`: List liabilities with category, outstanding amount, principal amount, EMI, minimum due, maturity or due date, and summary metadata.
- Create `POST /liabilities`: Create a liability linked to a liability category; validate required common and category-specific fields.
- Create `GET /liabilities/{id}`: Return liability details, category details, principal, outstanding balance, EMI, minimum due, due dates, rates, notes, payment history, and calculated fields where available.
- Create `PATCH /liabilities/{id}`: Update liability details and recalculate affected summary values.
- Create `DELETE /liabilities/{id}`: Archive a liability and remove it from active net worth calculations.
- Create `GET /liabilities/{id}/payments`: List payment history for a liability.
- Create `POST /liabilities/{id}/payments`: Add a payment entry and update outstanding balance when applicable.

## DB Tables To Create Or Update

- `asset_categories`: Create; stores predefined user-enabled asset category templates, positive return behavior, default field requirements, archive status, and ordering.
- `liability_categories`: Create; stores predefined user-enabled liability category templates, negative return behavior or cost behavior, default field requirements, archive status, and ordering.
- `assets`: Create; stores user-owned asset records linked to asset categories, common financial fields, manual current value, calculated current value, selected value mode, notes, category-specific data, and archive status.
- `liabilities`: Create; stores user-owned liability records linked to liability categories, common financial fields, original principal, outstanding balance, EMI, minimum due, due dates, notes, category-specific data, and archive status.
- `liability_payments`: Create; stores user-entered payment history for liabilities, including payment date, amount, notes, and relationship to the liability.
- `net_worth_snapshots`: Create; stores monthly historical snapshots of total assets, total liabilities, and net worth.

## Frontend Updates

- Net Worth Dashboard:
  - Show total assets, total liabilities, and net worth.
  - Show a monthly historical trend chart with one data point per month.
  - Show asset and liability category breakdowns.
  - Provide entry points to add assets, add liabilities, manage categories, and open list/detail screens.
  - Include loading, empty, error, and success states.

- Asset List:
  - Show assets with category, name, invested amount, current value, maturity date, and latest known return or interest metadata.
  - Support view details, edit, and archive actions.
  - Include empty, loading, archive confirmation, success, and error states.

- Asset Details:
  - Show common fields, category-specific fields, notes, manual current value, calculated current value where applicable, and selected value mode.
  - Support edit and archive actions.

- Add/Edit Asset:
  - Require an asset category.
  - Show common fields: investment amount, annual interest rate, start date, maturity date, and compounding frequency.
  - Let the user choose manual current value or calculated current value.
  - Show category-specific fields based on the selected category.
  - Validate INR amounts, dates, required fields, positive return behavior, and category linkage.

- Liability List:
  - Show liabilities with category, name, principal amount, outstanding amount, EMI, minimum due, rate, due or maturity date, and latest known cost metadata.
  - Support view details, edit, and archive actions.
  - Include empty, loading, archive confirmation, success, and error states.

- Liability Details:
  - Show common fields, category-specific fields, notes, original principal, outstanding balance, EMI, minimum due, due date, payment history, and calculated outstanding value where applicable.
  - Support edit and archive actions.

- Add/Edit Liability:
  - Require a liability category.
  - Show common fields: principal or investment amount, annual interest rate, start date, maturity date, and compounding frequency.
  - Show liability fields for outstanding balance, EMI, minimum due, and due date when applicable.
  - Validate INR amounts, dates, required fields, negative return or cost behavior, and category linkage.

- Category Management:
  - Provide separate management screens or tabs for asset categories and liability categories.
  - Support add or enable, list, details, update allowed metadata, and archive operations.
  - Use predefined category templates rather than custom user-defined field builders.

- Screenshot-derived asset category fields:
  - Cash in Hand: name, amount, notes.
  - Bonds: bond name, invested amount, current amount, maturity date, interest rate, credit rating, type, notes.
  - Real Estate: property type, property name, self-occupied flag, current value, purchase price, purchase date, city.
  - Commodities: investment type, name, commodity type, quantity in grams, buy price per gram, notes.
  - PPF: current balance, investment frequency, next investment date, investment amount, first investment date, notes.
  - EPF: current balance, monthly contribution, UAN number, notes.
  - Fixed Deposit: bank, investment amount, annual interest rate, start date, maturity date, compounding frequency.

- V1 liability category fields:
  - Home Loan: lender, principal amount, outstanding balance, annual interest rate, EMI, start date, maturity date, due date, payment history, notes.
  - Personal Loan: lender, principal amount, outstanding balance, annual interest rate, EMI, start date, maturity date, due date, payment history, notes.
  - Credit Card: card issuer, outstanding balance, minimum due, due date, annual interest rate, payment history, notes.
  - Car Loan: lender, vehicle name, principal amount, outstanding balance, annual interest rate, EMI, start date, maturity date, due date, payment history, notes.
  - Other Debt: lender or source, principal amount, outstanding balance, annual interest rate, EMI or minimum due, start date, maturity date, due date, payment history, notes.

## Out Of Scope

- Source code implementation for frontend, backend, database schema, or tests.
- Automatic imports from banks, brokers, EPFO, NSDL, CDSL, or statement files.
- Real-time market price integrations for equity, gold, commodities, or bonds.
- Equity, Stocks, and Mutual Funds categories for V1.
- Tax calculations, compliance workflows, KYC, PAN, Aadhaar, or regulatory reporting.
- Multi-user household sharing, advisor access, or role-based permissions unless requested later.

## Open Questions

- Should investment amount be mandatory for every category, including Cash in Hand and Real Estate, where the screenshots use amount or current value wording?
- Should attachments, documents, account numbers, nominee details, or institution names be captured for any category?
- Should monthly net worth snapshots be generated automatically at month-end, updated whenever records change, or both?
- Should archived records remain visible in a separate archive view?
