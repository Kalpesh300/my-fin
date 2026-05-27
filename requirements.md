# Requirement Summary

Create a standalone dashboard named `Monthly` where each user can view and manage finance details for a selected month-year. The dashboard should default to the current month-year, allow selection of any month-year, and support creating month-year records on demand through an `Add New` flow.

Each month-year record is unique per user and contains:

- Income sources with amount, free-text source, description, and account.
- Recurring costs that are configured separately and auto-applied when a matching month-year is created.
- Other month-specific adhoc costs.

All financial data is user-isolated. Amounts are INR-only, and transaction direction is determined by section: income is inflow, recurring costs and other costs are outflows.

## Clarifications Asked

- Should `Monthly` be standalone or part of another dashboard?
  - Standalone.
- How should month/year be represented?
  - Store a month-year value as a non-datetime string to avoid timezone concerns.
- Can users create records for any month-year?
  - Yes, there are no past or future restrictions.
- What should happen when a selected month-year has no data?
  - Show an empty state with an option to create it.
- Is there one month-year record per user?
  - Yes, exactly one per user per month-year.
- Can data be edited after creation?
  - Yes, the month-year record and all entries remain editable.
- Can a month-year record be deleted?
  - Yes.
- Can a month have multiple income sources?
  - Yes.
- Are income source categories required?
  - No, use free-text source.
- Are income dates required?
  - No dates for income entries for now.
- How should accounts be captured?
  - Use a predefined account list managed from an account setup page.
- Are recurring costs configured separately?
  - Yes, users need a setup page for recurring costs.
- Should recurring costs become editable monthly entries?
  - Yes, auto-added recurring costs can be edited on the Monthly dashboard.
- How should variable recurring costs work?
  - Users can enter an approximate amount when configuring the recurring cost and edit the amount on the monthly board.
- How should recurrence be configured?
  - Use a number input and a unit option of month or year, supporting every 1/2/3/etc. months or years.
- Do recurring costs need active/inactive status?
  - No.
- If a recurring cost configuration changes, what should it affect?
  - Future months only.
- What is outflow type?
  - A free-text/static string entered by the user.
- Are payment dates needed for costs?
  - Yes, for both recurring costs and other costs.
- Should recurring and adhoc costs be grouped differently in reporting?
  - Yes.
- What dashboard summaries are needed?
  - Total income, total recurring cost, total other cost, net savings, and account-wise totals.
- Are charts needed?
  - No, tables only.
- Should export be included?
  - No.
- Should search/filter be included?
  - Search filter only.
- Is the app single-user?
  - No, assume multiple users with isolated financial data.
- Is audit/history needed?
  - No, latest state is enough.

## Final Assumptions

- The canonical month-year identifier is a string such as `YYYY-MM`; the exact display format can be user-friendly, but storage and API contracts should avoid datetime semantics.
- A user can select any month-year. If the record exists, the dashboard loads it. If it does not exist, the dashboard shows an empty state and allows creation.
- `Add New` creates a month-year record for the entered month-year and fails with a toast error if the record already exists for the same user.
- Deleting a month-year record deletes its related income, recurring cost instances, and other cost entries for that month-year.
- Income entries are dynamic and normally added per month by the user.
- Other cost entries are dynamic and normally added per month by the user.
- Recurring cost configurations are maintained outside the Monthly dashboard and are applied only when a matching month-year record is first created.
- Auto-applied recurring costs become monthly cost instances. Editing a monthly instance does not change the recurring cost configuration.
- Updating a recurring cost configuration affects only month-year records created after the change, not already-created month-year records.
- No duplicate entry detection is required for income, recurring cost instances, or other costs in the first version.
- Amount and description are mandatory for income, recurring cost configuration, recurring cost monthly instances, and other cost entries.

## APIs To Create Or Update

- Create `Account management API`: Manage the predefined account list per user.
  - Key actions: create, list, update, and delete accounts.
  - Key data: account name such as SBI, HDFC, ICICI, cash, or other user-defined labels.
  - Validation: account name is required. Account data must be isolated by user.

- Create `Recurring cost configuration API`: Manage recurring cost templates per user.
  - Key actions: create, list, update, and delete recurring cost configurations.
  - Key data: amount, outflow type, description, account, recurrence interval number, recurrence unit of month/year, and the starting month-year from which the recurrence should apply.
  - Validation: amount and description are required. Recurrence interval must be a positive number. Recurrence unit must be month or year. Account must refer to one of the user's predefined accounts.
  - Behavior: updates affect only future month-year creation.

- Create `Monthly record API`: Create, fetch, update, and delete a month-year record for a user.
  - Key actions:
    - Fetch selected month-year data.
    - Create selected month-year data through `Add New`.
    - Update editable month-level metadata if needed.
    - Delete a month-year record and related entries.
  - Key data: user, month-year string, income entries, recurring cost instances, other cost entries, and calculated summaries.
  - Validation: each user can have only one record for a month-year. If creation is attempted for an existing month-year, return an error that the frontend can show as a toast.
  - Behavior: on first creation, auto-add recurring cost instances whose recurrence configuration matches the selected month-year.

- Create `Monthly income entries API`: Manage income entries inside a month-year record.
  - Key actions: add, view, update, and delete income entries.
  - Key data: amount, source, description, and account.
  - Validation: amount and description are required. Account must refer to one of the user's predefined accounts.

- Create `Monthly recurring cost instances API`: Manage recurring cost instances inside a month-year record.
  - Key actions: view, update, and delete auto-added recurring cost instances for a selected month-year.
  - Key data: amount, outflow type, description, account, payment date, and reference to the originating recurring cost configuration when applicable.
  - Validation: amount and description are required. Account must refer to one of the user's predefined accounts.

- Create `Monthly other cost entries API`: Manage adhoc costs inside a month-year record.
  - Key actions: add, view, update, and delete other cost entries.
  - Key data: amount, outflow type, description, account, and payment date.
  - Validation: amount and description are required. Account must refer to one of the user's predefined accounts.

## DB Tables To Create Or Update

- `accounts`: Create or update user-specific predefined account records.
  - High-level fields: user relationship, account name, and optional description or display metadata.
  - Product requirement: account values used in income and cost forms should come from this user-managed list.

- `recurring_cost_configurations`: Create user-specific recurring cost templates.
  - High-level fields: user relationship, amount, outflow type, description, account relationship, recurrence interval number, recurrence unit of month/year, and starting month-year.
  - Product requirement: these configurations drive which recurring cost instances are auto-added when a month-year record is created.

- `monthly_records`: Create user-specific month-year records.
  - High-level fields: user relationship and month-year string.
  - Product requirement: enforce uniqueness for user plus month-year.

- `monthly_income_entries`: Create income entries linked to a monthly record.
  - High-level fields: monthly record relationship, amount, source, description, and account relationship.
  - Product requirement: support multiple income entries per month.

- `monthly_recurring_cost_instances`: Create editable monthly copies of matched recurring costs.
  - High-level fields: monthly record relationship, originating recurring cost configuration relationship where applicable, amount, outflow type, description, account relationship, and payment date.
  - Product requirement: preserve the monthly value even if future recurring cost configuration changes.

- `monthly_other_cost_entries`: Create adhoc month-specific cost entries.
  - High-level fields: monthly record relationship, amount, outflow type, description, account relationship, and payment date.
  - Product requirement: support dynamic monthly costs separate from recurring cost instances.

## Frontend Updates

- Add a standalone `Monthly` dashboard.
  - Defaults to the current month-year in the UI.
  - Provides controls to select month and year.
  - Fetches and displays the selected month-year record if it exists.
  - Shows an empty state with an `Add New` action when the selected month-year does not exist.

- Add `Add New` flow for month-year records.
  - User enters/selects month and year.
  - If the month-year already exists, show a toast error.
  - If creation succeeds, load the created monthly board with matching recurring costs auto-added.

- Add dashboard summary section.
  - Show total income.
  - Show total recurring cost.
  - Show total other cost.
  - Show net savings.
  - Show account-wise totals.

- Add monthly income table.
  - Display amount, source, description, and account.
  - Support add, view, update, and delete.
  - Include validation errors for required amount and description.
  - Include loading, empty, save success, and backend error states.

- Add monthly recurring cost table.
  - Display amount, outflow type, description, account, payment date, and recurrence origin where useful.
  - Support view, update, and delete for monthly instances.
  - Include validation errors for required amount and description.
  - Include loading, empty, save success, and backend error states.

- Add monthly other cost table.
  - Display amount, outflow type, description, account, and payment date.
  - Support add, view, update, and delete.
  - Include validation errors for required amount and description.
  - Include loading, empty, save success, and backend error states.

- Add search filter on the Monthly dashboard.
  - Search should help users find entries within the selected month across income, recurring costs, and other costs.

- Add account setup page.
  - User can create, view, update, and delete predefined accounts.
  - Monthly income and cost forms should use these accounts as selectable values.

- Add recurring cost setup page.
  - User can create, view, update, and delete recurring cost configurations.
  - Form fields include amount, outflow type, description, account, recurrence interval number, recurrence unit of month/year, and starting month-year.
  - Explain to the user that configuration changes affect future month creation only.

## Out Of Scope

- Charts or visual graph summaries.
- CSV, PDF, or other export flows.
- Yearly summaries or future cash-flow reporting.
- Audit log or historical versioning of edits.
- Duplicate detection for similar income or cost entries.
- Income payment/received dates.
- Active/inactive state for recurring costs.
- Compliance-specific workflows such as PAN, Aadhaar, KYC, GST, RBI, or SEBI handling.

## Open Questions

- What exact month-year string format should be used in storage and APIs, such as `YYYY-MM`, `MM-YYYY`, or `Month YYYY`?
- Should accounts be deletable if they are already used by monthly entries or recurring cost configurations?
- Should recurring cost matching start from a required starting month-year, or should a recurring cost apply to all matching month-years once configured?
- Should payment date for costs be a full date, a day-of-month number, or free text?
- Should account-wise totals include both inflows and outflows separately, or show a single net amount per account?
