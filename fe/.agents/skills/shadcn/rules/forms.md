# Forms & Inputs

## Forms default to wrapper fields

Default to field wrappers from `@/libs/form` for consistency in label, description, validation, and error rendering.

Use `FieldGroup` for form layout and render wrapper fields inside it:

```tsx
<FieldGroup>
  <InputField
    name='email'
    control={control}
    label='Email'
  />
  <InputField
    name='password'
    control={control}
    label='password'
    type='password'
  />
</FieldGroup>
```

Use `Field orientation="horizontal"` for settings pages. Use `FieldLabel className="sr-only"` for visually hidden labels.

Fallback to direct shadcn/base `Field` composition only when wrapper fields cannot be used (layout constraints, unsupported control shape, or custom interaction requirements).

When using fallback field composition, keep wrapper-level behavior consistent:

- Provide label, description/help text, and error text in the same places users expect.
- Preserve `data-invalid`/`aria-invalid` and `data-disabled`/`disabled` behavior.
- Keep accessibility wiring (`id`, `htmlFor`, `aria-describedby`) complete.
- Keep spacing/structure aligned with existing wrapper field UX.

**Choosing fields:**

- Simple text input → `InputField`
- OTP Input -> `OtpInputField`
- Phone number input -> `PhoneInputField`
- For controls without wrappers in `src/libs/form`, use shadcn/base field composition as fallback only after user confirmation, while preserving wrapper-level logic.

---

## InputGroup requires InputGroupInput/InputGroupTextarea

Never use raw `Input` or `Textarea` inside an `InputGroup`.

**Incorrect:**

```tsx
<InputGroup>
  <Input placeholder='Search...' />
</InputGroup>
```

**Correct:**

```tsx
import { InputGroup, InputGroupInput } from '@/libs/ui';

<InputGroup>
  <InputGroupInput placeholder='Search...' />
</InputGroup>;
```

---

## Buttons inside inputs use InputGroup + InputGroupAddon

Never place a `Button` directly inside or adjacent to an `Input` with custom positioning.

**Incorrect:**

```tsx
<div className='relative'>
  <Input
    placeholder='Search...'
    className='pr-10'
  />
  <Button
    className='absolute right-0 top-0'
    size='icon'
  >
    <SearchIcon />
  </Button>
</div>
```

**Correct:**

```tsx
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/libs/ui';

<InputGroup>
  <InputGroupInput placeholder='Search...' />
  <InputGroupAddon>
    <Button size='icon'>
      <SearchIcon data-icon='inline-start' />
    </Button>
  </InputGroupAddon>
</InputGroup>;
```

---

## Option sets (2–7 choices) use ToggleGroup

Don't manually loop `Button` components with active state.

**Incorrect:**

```tsx
const [selected, setSelected] = useState("daily")

<div className="flex gap-2">
  {["daily", "weekly", "monthly"].map((option) => (
    <Button
      key={option}
      variant={selected === option ? "default" : "outline"}
      onClick={() => setSelected(option)}
    >
      {option}
    </Button>
  ))}
</div>
```

**Correct:**

```tsx
// Use this only when there is no local wrapper and user approved raw shadcn usage.
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

<ToggleGroup spacing={2}>
  <ToggleGroupItem value='daily'>Daily</ToggleGroupItem>
  <ToggleGroupItem value='weekly'>Weekly</ToggleGroupItem>
  <ToggleGroupItem value='monthly'>Monthly</ToggleGroupItem>
</ToggleGroup>;
```

Combine with `Field` for labelled toggle groups:

```tsx
<Field orientation='horizontal'>
  <FieldTitle id='theme-label'>Theme</FieldTitle>
  <ToggleGroup
    aria-labelledby='theme-label'
    spacing={2}
  >
    <ToggleGroupItem value='light'>Light</ToggleGroupItem>
    <ToggleGroupItem value='dark'>Dark</ToggleGroupItem>
    <ToggleGroupItem value='system'>System</ToggleGroupItem>
  </ToggleGroup>
</Field>
```

> **Note:** `defaultValue` and `type`/`multiple` props differ between base and radix. See [base-vs-radix.md](./base-vs-radix.md#togglegroup).

---

## FieldSet + FieldLegend for grouping related fields

Use `FieldSet` + `FieldLegend` for related checkboxes, radios, or switches — not `div` with a heading:

```tsx
<FieldSet>
  <FieldLegend variant='label'>Preferences</FieldLegend>
  <FieldDescription>Select all that apply.</FieldDescription>
  <FieldGroup className='gap-3'>
    <Field orientation='horizontal'>
      <Checkbox id='dark' />
      <FieldLabel
        htmlFor='dark'
        className='font-normal'
      >
        Dark mode
      </FieldLabel>
    </Field>
  </FieldGroup>
</FieldSet>
```

---

## Field validation and disabled states

Both attributes are needed — `data-invalid`/`data-disabled` styles the field (label, description), while `aria-invalid`/`disabled` styles the control.

```tsx
// Invalid.
<Field data-invalid>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" aria-invalid />
  <FieldDescription>Invalid email address.</FieldDescription>
</Field>

// Disabled.
<Field data-disabled>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" disabled />
</Field>
```

Works for all controls: `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroupItem`, `Switch`, `Slider`, `NativeSelect`, `InputOTP`.
