# Base UI

APIs of `base UI`.

## Composition: render (base)

Base uses `render` to replace the default element. Don't wrap triggers in extra elements.

**Incorrect:**

```tsx
<DialogTrigger>
  <div>
    <Button>Open</Button>
  </div>
</DialogTrigger>
```

**Correct (base):**

```tsx
<DialogTrigger render={<Button />}>Open</DialogTrigger>
```

This applies to all trigger and close components: `DialogTrigger`, `SheetTrigger`, `AlertDialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `TooltipTrigger`, `CollapsibleTrigger`, `DialogClose`, `SheetClose`, `NavigationMenuLink`, `BreadcrumbLink`, `SidebarMenuButton`, `Badge`, `Item`.

---

## Button / trigger as non-button element (base only)

Never use `nativeButton={false}`. It is not allowed.

Do not use `render` on `Button`. `Button` must remain a native button element.

For trigger/close components that support `render`, choose the most semantic element for the interaction and preserve native behavior:

- Use `<a>` for navigation (`href`).
- Use `<button>` for actions (submit, open, toggle, command).
- Use `<label>` only when the interaction targets a form control.
- Avoid generic elements like `<div>` or `<span>` for click targets; only use them as a last resort with full keyboard/ARIA semantics.

If the right semantic element is unclear from the code context, stop and ask the user which behavior is intended before implementing.

**Incorrect (base):** `Button` with `render`, and usage of `nativeButton={false}`.

```tsx
<Button render={<a href='/docs' />}>Read the docs</Button>

<Button
  render={<a href='/docs' />}
  nativeButton={false}
>
  Read the docs
</Button>
```

**Correct (base):**

```tsx
<Button type='button'>Read the docs</Button>
```

---

## Select

**items prop (base only).** Base requires an `items` prop on the root.

**Incorrect (base):**

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder='Select a fruit' />
  </SelectTrigger>
</Select>
```

**Correct (base):**

```tsx
const items = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
]

<Select items={items}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

**Placeholder.** Base uses a `{ value: null }` item in the items array.

**Content positioning.** Base uses `alignItemWithTrigger`.

```tsx
// base.
<SelectContent alignItemWithTrigger={false} side="bottom">
```

---

## Select — multiple selection and object values (base only)

Base supports `multiple`, render-function children on `SelectValue`, and object values with `itemToStringValue`.

**Correct (base — multiple selection):**

```tsx
<Select
  items={items}
  multiple
  defaultValue={[]}
>
  <SelectTrigger>
    <SelectValue>{(value: string[]) => (value.length === 0 ? 'Select fruits' : `${value.length} selected`)}</SelectValue>
  </SelectTrigger>
  ...
</Select>
```

**Correct (base — object values):**

```tsx
<Select
  defaultValue={plans[0]}
  itemToStringValue={(plan) => plan.name}
>
  <SelectTrigger>
    <SelectValue>{(value) => value.name}</SelectValue>
  </SelectTrigger>
  ...
</Select>
```

---

## ToggleGroup

Base uses a `multiple` boolean prop.

**Incorrect (base):**

```tsx
<ToggleGroup
  type='single'
  defaultValue='daily'
>
  <ToggleGroupItem value='daily'>Daily</ToggleGroupItem>
</ToggleGroup>
```

**Correct (base):**

```tsx
// Single (no prop needed), defaultValue is always an array.
<ToggleGroup defaultValue={["daily"]} spacing={2}>
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
  <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
</ToggleGroup>

// Multi-selection.
<ToggleGroup multiple>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>
```

**Controlled single value:**

```tsx
// base — wrap/unwrap arrays.
const [value, setValue] = React.useState("normal")
<ToggleGroup value={[value]} onValueChange={(v) => setValue(v[0])}>
```

---

## Slider

Base accepts a plain number for a single thumb.

**Incorrect (base):**

```tsx
<Slider
  defaultValue={[50]}
  max={100}
  step={1}
/>
```

**Correct (base):**

```tsx
<Slider
  defaultValue={50}
  max={100}
  step={1}
/>
```

Controlled `onValueChange` in base may need a cast:

```tsx
// base.
const [value, setValue] = React.useState([0.3, 0.7])
<Slider value={value} onValueChange={(v) => setValue(v as number[])} />
```

---

## Accordion

Base uses no `type` prop, uses `multiple` boolean, and `defaultValue` is always an array.

**Incorrect (base):**

```tsx
<Accordion
  type='single'
  collapsible
  defaultValue='item-1'
>
  <AccordionItem value='item-1'>...</AccordionItem>
</Accordion>
```

**Correct (base):**

```tsx
<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>

// Multi-select.
<Accordion multiple defaultValue={["item-1", "item-2"]}>
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>
```
