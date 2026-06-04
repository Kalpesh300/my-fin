# Monthly Finance Features

This document describes the finance features currently covered by the app: Monthly board, Accounts, Recurring Costs, income entries, other costs, summaries, and search.

## Core Concepts

### User-specific data

All finance data belongs to the current user. One user's accounts, recurring cost setup, monthly records, and entries should not appear for another user.

### INR-only amounts

All money values are INR amounts. The app does not support multiple currencies in this version.

### Month-year format

Monthly records use `Month YYYY`, for example `May 2026`.

The app treats this as a month label, not as a date or timestamp. This avoids timezone-related behavior for month selection.

## Monthly Board

The Monthly board is the main dashboard and opens by default from `/`.

### Month selection

Users can select any month and year. There are no past or future restrictions.

When a selected month-year already exists, the board loads that month's finance details.

When a selected month-year does not exist, the board shows an empty state with an `Add New` action.

### Add New flow

`Add New` creates the selected month-year record for the current user.

Only one record can exist per user for the same month-year. If the record already exists, the app shows an error.

When a new month-year is created, matching recurring costs are automatically added to that month as editable monthly cost entries.

### Delete month

Users can delete a month-year record.

Deleting a month removes that month's income entries, recurring cost instances, and other cost entries.

## Dashboard Summaries

The Monthly board shows summary cards for the selected month:

- Total income
- Total recurring costs
- Total other costs
- Net savings

Net savings is calculated as:

`total income - total recurring costs - total other costs`

## Account-wise Totals

The Monthly board also shows account-wise totals.

Each account displays:

- Inflow total
- Outflow total

Income entries count as inflows. Recurring cost instances and other cost entries count as outflows.

## Accounts

Accounts are the user's predefined money accounts. Examples include bank accounts, cash, wallet names, or other labels the user wants to track.

### Account fields

Each account has:

- Name
- Description
- Status

### Account setup

Users can:

- Create accounts
- View accounts
- Edit accounts
- Delete accounts

### Soft delete behavior

Deleting an account is a soft delete.

Soft-deleted accounts are no longer available for new entries, but historical monthly entries still show the account label so old records remain understandable.

## Recurring Costs

Recurring costs are templates for repeated outflows such as rent, subscriptions, EMIs, insurance, or other predictable expenses.

Recurring costs are configured separately from the Monthly board.

### Recurring cost fields

Each recurring cost has:

- Amount
- Outflow type
- Description
- Account
- Recurrence interval
- Recurrence unit: month or year
- Starting month-year
- Status

Examples:

- Every 1 month from May 2026
- Every 3 months from April 2026
- Every 1 year from January 2026

### Auto-add behavior

When a new month-year record is created, the app checks recurring cost setup and adds matching recurring costs to that month.

Recurring costs apply only on or after their starting month-year.

Monthly recurrence applies every configured number of months.

Yearly recurrence applies in the same starting month every configured number of years.

### Payment date

Auto-added recurring cost instances use the 1st day of the selected month.

For example, a recurring cost added to `July 2026` gets payment date `2026-07-01`.

### Editing monthly recurring costs

Auto-added recurring costs become monthly cost instances.

Users can edit or delete these monthly instances from the Monthly board.

Editing a monthly instance does not change the recurring cost setup.

### Updating recurring cost setup

Changes to recurring cost setup affect only future month-year records that are created after the change.

Already-created month-year records do not automatically change.

### Soft delete behavior

Deleting a recurring cost setup is a soft delete.

Existing monthly recurring cost instances keep their origin label so old monthly records remain understandable.

## Income Entries

Income entries capture money coming into an account for a selected month.

### Income fields

Each income entry has:

- Amount
- Source
- Description
- Account

### Income behavior

Users can add, edit, and delete income entries within a month.

Income source is free text. There are no income categories in this version.

Income entries do not require received dates in this version.

Income entries increase total income and account inflow totals.

## Other Cost Entries

Other costs are month-specific adhoc outflows that are not managed as recurring costs.

Examples include food, travel, repairs, shopping, one-time fees, and similar expenses.

### Other cost fields

Each other cost entry has:

- Amount
- Outflow type
- Description
- Account
- Payment date

### Other cost behavior

Users can add, edit, and delete other cost entries within a month.

Other costs increase total other costs and account outflow totals.

## Search

The Monthly board includes a search box for entries in the selected month.

Search checks across:

- Income entries
- Recurring cost instances
- Other cost entries

Search can match descriptions, sources, outflow types, and account names.

When a table has no matches, it shows an empty state for that table.

## Required Fields And Validation

Amounts must be positive numbers and may include decimals.

Required fields:

- Account name
- Income amount
- Income description
- Income account
- Recurring cost amount
- Recurring cost description
- Recurring cost account
- Recurring cost starting month-year
- Monthly recurring cost amount
- Monthly recurring cost description
- Monthly recurring cost payment date
- Other cost amount
- Other cost description
- Other cost account
- Other cost payment date

## User Feedback States

The app provides feedback for:

- Loading data
- Empty month records
- Empty tables
- Successful saves, updates, and deletes
- Backend or validation errors

## Out Of Scope

The current version does not include:

- Charts or graph summaries
- CSV, PDF, or other export flows
- Yearly summaries
- Future cash-flow projections
- Audit history or change versioning
- Duplicate entry detection
- Income received dates
- Active/inactive toggles for recurring costs
- Multiple currencies
- Compliance-specific workflows
