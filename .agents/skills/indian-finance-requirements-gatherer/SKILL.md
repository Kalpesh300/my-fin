---
name: indian-finance-requirements-gatherer
description: Use this skill when the user provides or wants to refine any product requirement, feature idea, user story, workflow change, or business requirement for this project. The skill runs a clarification interview and maintains a high-level requirements.md for the personal finance app, keeping in mind the project's Indian finance domain while avoiding compliance deep-dives unless the user asks for them.
---

# Indian Finance Requirements Gatherer

Use this skill to turn a product requirement into a clear, implementation-ready `requirements.md` without writing code or making implementation changes.

This project is a personal finance app with:

- `fe/` for frontend work
- `be/` for backend work

Stay high-level and conversation-driven. Do not inspect the codebase unless the user explicitly asks for repository-specific analysis. The output should describe what needs to change, not how to code it.

## Core Workflow

1. Understand the initial requirement.
2. Ask clarification questions in an interview loop.
3. Once there is enough information, create or update `requirements.md`.
4. Continue asking follow-up questions when gaps remain.
5. Update `requirements.md` after each meaningful clarification.

The goal is not to finish the interview in one message. The goal is to progressively turn vague product intent into a practical requirements document.

## Interview Style

Ask focused questions that help define the product behavior. Prefer batches of 5-10 questions when the requirement is broad, and smaller follow-up batches when the user has already answered.

Cover these areas as needed:

- User goal and target user type
- Current problem or pain point
- Main user journey
- Inputs, outputs, and validations
- Data that must be stored or changed
- Backend APIs that may be needed
- Frontend screens, components, and states that may be needed
- Edge cases and error states
- Reporting, filtering, sorting, search, export, notification, or audit needs
- Permissions or role differences, if relevant
- Indian finance domain details such as INR amounts, bank accounts, UPI, categories, cash flow, investments, loans, tax-related fields, statement imports, or transaction reconciliation when relevant

Do not lead with RBI, SEBI, GST, PAN, Aadhaar, KYC, retention, or compliance questions unless the user explicitly raises compliance or regulation. Keep the default interview practical and product-focused.

## When to Draft

Create `requirements.md` once there is enough information to produce a useful first draft, even if some questions remain open.

After creating it:

- Keep the document updated as the user answers clarifications.
- Add unresolved gaps to `Open Questions`.
- Convert answered questions into concrete requirements, assumptions, or scope notes.
- Do not show code changes or propose code snippets.

If `requirements.md` already exists, read it first and update it rather than replacing it blindly. Preserve useful existing content and revise sections affected by the latest clarification.

## Output File

Write the document to `requirements.md` at the repository root unless the user specifies another path.

Use this structure:

```markdown
# Requirement Summary

Briefly describe the feature or change in product terms.

## Clarifications Asked

- List the important clarification questions that were asked.
- Include short answers when available.

## Final Assumptions

- List assumptions that are being used to shape the requirements.
- Keep assumptions high-level and product-facing.

## APIs To Create Or Update

- `METHOD /path-or-concept`: High-level purpose, key inputs, key outputs, and notable validation or error behavior.
- Mark each item as Create, Update, or TBD when useful.

## DB Tables To Create Or Update

- `table_or_concept`: Create or update, high-level fields or relationships, and why it is needed.
- Do not include SQL or migration code.

## Frontend Updates

- Screen, page, component, form, table, chart, filter, state, or copy updates needed.
- Include loading, empty, success, and error states when relevant.

## Out Of Scope

- Explicitly list related work that should not be included in the current requirement.

## Open Questions

- List unanswered questions that still affect scope, behavior, or data design.
```

## Requirements Writing Guidance

Keep each section concise but specific enough for an engineer to estimate the work.

For APIs:

- Mention endpoint concepts even if exact routes are undecided.
- Include the intended action, key request data, response shape at a high level, and important validation.
- Avoid controller, service, DTO, or framework implementation details.

For DB changes:

- Mention new tables, updates to existing tables, and important relationships.
- Describe fields conceptually, not as exact SQL.
- Include indexes, uniqueness, or history requirements only when they are product-relevant.

For frontend:

- Mention screens and user-visible behavior.
- Include states such as loading, empty, validation error, backend error, and success when relevant.
- Avoid component code, file names, or UI library instructions unless the user asks.

## Boundaries

Do not implement the feature.
Do not edit source files except `requirements.md` unless the user explicitly asks.
Do not include code blocks containing application code, SQL migrations, API handlers, schemas, React components, or tests.
Do not turn the requirement into a technical design document unless the user asks for deeper design.

If the requirement is too vague, ask questions before writing. If the requirement is clear enough, draft `requirements.md` and keep the remaining uncertainty in `Open Questions`.
