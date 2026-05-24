# Icons

**Always use the project's configured `iconLibrary` for imports.** Check the `iconLibrary` field from project context: `lucide` → `lucide-react`.

---

## No sizing classes on icons inside components

Components handle icon sizing via CSS. Don't add `size-4`, `w-4 h-4`, or other sizing classes to icons inside `DropdownMenuItem`, `Alert`, `Sidebar*`, or other shadcn components. Unless the user explicitly asks for custom icon sizes.

**Incorrect:**

```tsx
<DropdownMenuItem>
  <SettingsIcon className='mr-2 size-4' />
  Settings
</DropdownMenuItem>
```

**Correct:**

```tsx
<DropdownMenuItem>
  <SettingsIcon />
  Settings
</DropdownMenuItem>
```

---

## Pass icons as component objects, not string keys

Use `icon={CheckIcon}`, not a string key to a lookup map.

**Incorrect:**

```tsx
const iconMap = { check: CheckIcon, alert: AlertIcon };

function StatusBadge({ icon }: { icon: string }) {
  const Icon = iconMap[icon];
  return <Icon />;
}

<StatusBadge icon='check' />;
```

**Correct:**

```tsx
// Import from the project's configured iconLibrary (e.g. lucide-react, @tabler/icons-react).
import { CheckIcon } from 'lucide-react';

function StatusBadge({ icon: Icon }: { icon: React.ComponentType }) {
  return <Icon />;
}

<StatusBadge icon={CheckIcon} />;
```
