# Wrapper-First Usage

## Always prefer local wrappers over raw shadcn imports

Before using any shadcn component directly, check local wrapper libraries first:

- `src/libs/form` (import from `@/libs/form`)
- `src/libs/ui` (import from `@/libs/ui`)

If a wrapper exists, use it. Do not import the raw shadcn component file.

---

## Import preference order

Use this strict order:

1. `@/libs/form`
2. `@/libs/ui`
3. raw shadcn component import (only after user confirmation when wrapper is missing)

---

## Missing wrapper decision flow

If no wrapper exists for the needed component, stop and ask the user with proposed options:

1. Create a new wrapper first in `src/libs/form` or `src/libs/ui`.
2. Use raw shadcn component only for this task.
3. Adjust implementation to use an existing wrapper.

Do not silently choose raw shadcn usage.

---

## Examples

**Preferred (wrapper exists):**

```tsx
import { Button, Input, Field } from '@/libs/ui';
import { InputField } from '@/libs/form';
```

**Not preferred (wrapper exists but bypassed):**

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```
