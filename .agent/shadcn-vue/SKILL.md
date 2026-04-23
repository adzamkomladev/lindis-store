---
name: shadcn-vue
description: >-
  Context and patterns for shadcn-vue UI components.
  Load when adding, modifying, or styling UI components.
---

# shadcn-vue

Context skill for working with shadcn-vue components in this Nuxt project.

> **Announce:** "I'm loading shadcn-vue context for UI development."

## Key Facts

- **Library**: `shadcn-nuxt` v2.3.3 with `reka-ui` primitives
- **Location**: `app/components/ui/`
- **Styling**: Tailwind CSS v4 with custom `@theme` tokens
- **Icons**: Nuxt Icon (`<Icon name="lucide:..." />`)
- **Forms**: Integrated with VeeValidate + Zod

## Available Components (46 total)

| Category | Components |
|----------|------------|
| **Layout** | `Card`, `Separator`, `Accordion`, `Collapsible`, `Tabs` |
| **Form** | `Button`, `Input`, `Textarea`, `Checkbox`, `Switch`, `Select`, `RadioGroup`, `Slider`, `NumberField`, `TagsInput`, `Calendar` |
| **Form Wrappers** | `Field`, `FieldLabel`, `FieldDescription`, `FieldError` |
| **Feedback** | `Alert`, `Badge`, `Progress`, `Skeleton`, `Sonner` (toast) |
| **Overlay** | `Sheet`, `Popover`, `DropdownMenu`, `Tooltip` |
| **Data Display** | `Table`, `Avatar`, `Empty` |
| **Navigation** | `Breadcrumb`, `Pagination`, `Sidebar`, `Stepper` |

## Import Pattern

```ts
// Import from ui directory (auto-resolved by shadcn-nuxt)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
```

## Card Pattern (Stats)

```vue
<Card class="shadow-none border py-3 px-4">
  <CardHeader class="flex flex-row items-center justify-between p-0 pb-2">
    <CardTitle class="text-sm font-medium text-muted-foreground">
      Total Revenue
    </CardTitle>
    <Icon name="lucide:wallet" size="1.25em" class="text-emerald-500" />
  </CardHeader>
  <CardContent class="p-0">
    <div class="text-2xl font-bold">{{ formatCurrency(revenue) }}</div>
    <p class="text-xs text-muted-foreground">+12% from last month</p>
  </CardContent>
</Card>
```

## Button Variants

```vue
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon name="lucide:plus" /></Button>
<Button :disabled="isLoading">
  <Icon v-if="isLoading" name="lucide:loader-2" class="animate-spin mr-2" />
  Submit
</Button>
```

## Badge Status Colors

```vue
<!-- Success states (green) -->
<Badge variant="success">Active</Badge>
<Badge variant="success">Confirmed</Badge>
<Badge variant="success">Published</Badge>

<!-- Error states (red) -->
<Badge variant="destructive">Rejected</Badge>
<Badge variant="destructive">Failed</Badge>

<!-- Neutral/default -->
<Badge variant="secondary">Draft</Badge>
<Badge variant="outline">Pending</Badge>
```

## Form Field Pattern

```vue
<template>
  <FormField v-slot="{ componentField }" name="name">
    <FormItem>
      <FormLabel>Product Name</FormLabel>
      <FormControl>
        <Input v-bind="componentField" placeholder="Enter product name" />
      </FormControl>
      <FormDescription>
        This will be displayed on the product page
      </FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>
</template>

<script setup lang="ts">
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
</script>
```

## Select Component

```vue
<Select v-model="status">
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="draft">Draft</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
  </SelectContent>
</Select>
```

## Toast Notifications

```ts
import { toast } from "vue-sonner";

// Success
toast.success("Product created successfully!");

// Error
toast.error("Failed to save changes");

// With description
toast({
  title: "Success",
  description: "Your product has been published",
  variant: "default", // or "destructive" for errors
})
toast.promise(saveProduct(), {
  loading: "Saving...",
  success: "Product saved!",
  error: "Failed to save",
});
```

## Empty State

```vue
<Empty
  icon="lucide:package"
  title="No products yet"
  description="Create your first product to get started"
>
  <Button @click="createProduct">
    <Icon name="lucide:plus" class="mr-2" />
    Create Product
  </Button>
</Empty>
```

## Table Pattern

```vue
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead class="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow v-for="item in items" :key="item.id">
      <TableCell class="font-medium">{{ item.name }}</TableCell>
      <TableCell>
        <Badge :variant="item.status === 'active' ? 'success' : 'secondary'">
          {{ item.status }}
        </Badge>
      </TableCell>
      <TableCell class="text-right font-bold">
        {{ formatCurrency(item.amount) }}
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Calendar Component

Built on [Reka UI Calendar](https://reka-ui.com/docs/components/calendar) with [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/) for date handling.

```vue
<script setup lang="ts">
import { getLocalTimeZone, today } from "@internationalized/date";
import { Calendar } from "@/components/ui/calendar";

const date = ref(today(getLocalTimeZone()));
</script>

<template>
  <Calendar v-model="date" />
</template>
```

**Key Props:**
- `v-model` - DateValue from @internationalized/date
- `layout` - `"month-and-year"` for month/year dropdown selector
- `initial-focus` - Focus calendar on open

## Date Picker Pattern

Compose Popover + Calendar for a date picker field:

```vue
<script setup lang="ts">
import { getLocalTimeZone, today } from "@internationalized/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const date = ref<Date>();
const defaultPlaceholder = today(getLocalTimeZone());
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="['w-[280px] justify-start text-left font-normal', !date && 'text-muted-foreground']"
      >
        <Icon name="lucide:calendar" class="mr-2 size-4" />
        {{ date ? date.toDateString() : "Pick a date" }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        v-model="date"
        :initial-focus="true"
        :default-placeholder="defaultPlaceholder"
        layout="month-and-year"
      />
    </PopoverContent>
  </Popover>
</template>
```

## Date + Time Picker Pattern

For datetime fields, use Calendar alongside a native time input:

```vue
<script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";

const date = ref(today(getLocalTimeZone())) as Ref<DateValue>;
const time = ref("10:30");
const open = ref(false);
</script>

<template>
  <div class="flex gap-4">
    <!-- Date picker -->
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="outline" class="w-32 justify-between font-normal">
          {{ date ? date.toDate(getLocalTimeZone()).toLocaleDateString() : "Select date" }}
          <Icon name="lucide:chevron-down" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto overflow-hidden p-0" align="start">
        <Calendar
          :model-value="date"
          @update:model-value="(val) => { if (val) { date = val; open = false } }"
        />
      </PopoverContent>
    </Popover>

    <!-- Time input -->
    <Input
      v-model="time"
      type="time"
      class="w-24 appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
    />
  </div>
</template>
```

**Alternative: Use reka-ui DatePicker with `granularity` for native date-time segments:**

```vue
<script setup lang="ts">
import { DatePickerRoot, DatePickerField, DatePickerInput, ... } from "reka-ui";
</script>

<template>
  <!-- granularity: 'day' | 'hour' | 'minute' | 'second' -->
  <DatePickerRoot v-model="value" granularity="minute">
    <DatePickerField>
      <DatePickerInput /> <!-- Renders date + time segments -->
      <DatePickerTrigger />
    </DatePickerField>
    <DatePickerContent>
      <DatePickerCalendar>...</DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>
```

## Date Conversion Utilities

Located in `app/utils/calendar.ts`:

```typescript
import { CalendarDate, CalendarDateTime, getLocalTimeZone } from "@internationalized/date";

// JS Date → CalendarDate (date only)
export const toCalendarDate = (date: Date | undefined) => {
  if (!date) return undefined;
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

// JS Date → CalendarDateTime (date + time)
export const toCalendarDateTime = (date: Date | undefined) => {
  if (!date) return undefined;
  return new CalendarDateTime(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
};

// CalendarDate/CalendarDateTime → JS Date
export const toJsDate = (calendarDate: any) => {
  if (!calendarDate) return undefined;
  return calendarDate.toDate(getLocalTimeZone());
};
```

## Icon Guidelines

```vue
<!-- Use Nuxt Icon with lucide icons -->
<Icon name="lucide:wallet" size="1.25em" class="text-emerald-500" />

<!-- Common sizes -->
size="1em"      <!-- Default -->
size="1.25em"   <!-- Slightly larger -->
size="1.5em"    <!-- Medium -->
size="2em"      <!-- Large -->

<!-- Flat icons - NO backgrounds -->
<Icon name="lucide:users" class="text-blue-500" />

<!-- Colors: text-{color}-500 -->
text-blue-500, text-emerald-500, text-purple-500, text-amber-500,
text-rose-500, text-cyan-500, text-teal-500, text-indigo-500
```

## UI Styling Rules

```vue
<!-- Minimal shadows -->
<Card class="shadow-none border">  <!-- Preferred -->
<Card class="shadow-sm">           <!-- Only if needed -->

<!-- Bold monetary/numeric values -->
<span class="text-2xl font-bold">{{ formatCurrency(amount) }}</span>
<span class="font-semibold">{{ count }}</span>

<!-- Muted text for labels -->
<span class="text-sm text-muted-foreground">Label</span>
```

## Adding New Components

```bash
# Add via shadcn CLI
npx shadcn-vue@latest add [component]

# Example
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add combobox
```

## Do NOT

- Import from `@radix-vue` directly - use reka-ui via shadcn-vue
- Create custom styles when a variant exists
- Use hard-coded colors - use semantic CSS variables
- Add background containers around icons - keep them flat
- Use `text-primary` for monetary amounts - keep them neutral black

## Reference Files

- UI components: `app/components/ui/`
- Tailwind config: `app/assets/css/tailwind.css`
- shadcn config: `components.json`
