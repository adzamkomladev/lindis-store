---
name: vee-validate-zod
description: >-
  Context and patterns for form validation with VeeValidate + Zod.
  Load when creating, modifying, or debugging forms and validation.
---

# VeeValidate + Zod

Context skill for form validation in this Nuxt project.

> **Announce:** "I'm loading vee-validate-zod context for form development."

## Key Facts

- **Validation**: VeeValidate v4 + `@vee-validate/zod`
- **Schemas**: Zod v4 - define in `schemas/<domain>/*.ts`
- **UI Wrappers**: `app/components/ui/field/`
- **Pattern**: `useForm` + `defineField` (NOT FormField components)

## Schema Definition

```ts
// schemas/admin/products.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  slug: z.string().min(2).max(100),
  price: z.number().min(0, "Price cannot be negative"),
  inventoryCount: z.number().int().min(0),
});

export type CreateProductPayload = z.infer<typeof createProductSchema>;
```

## Basic Form Setup

```ts
<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { createProductSchema, type CreateProductPayload } from "~~/schemas/admin/products";

const { isSubmitting, handleSubmit, defineField, errors, meta } = useForm<CreateProductPayload>({
  validationSchema: toTypedSchema(createProductSchema),
  initialValues: {
    name: "",
    slug: "",
    price: 0,
    inventoryCount: 0,
  },
});

// Define each field
const [name, nameAttrs] = defineField("name");
const [slug, slugAttrs] = defineField("slug");
const [price, priceAttrs] = defineField("price");
const [inventoryCount, inventoryCountAttrs] = defineField("inventoryCount");

const onSubmit = handleSubmit(async (values) => {
  try {
    await $fetch("/api/admin/products", {
      method: "POST",
      body: values,
    });
    toast.success("Product created successfully");
    navigateTo("/admin/products");
  } catch (error: any) {
    toast.error("Failed to create product");
  }
});
</script>
```

## Template Structure

```vue
<template>
  <form @submit="onSubmit">
    <Field>
      <FieldLabel class="font-semibold">Product Name</FieldLabel>
      <Input
        v-model="name"
        v-bind="nameAttrs"
        placeholder="Enter product name"
      />
      <FieldDescription>This will be displayed on the product page</FieldDescription>
      <FieldError v-if="errors.name">{{ errors.name }}</FieldError>
    </Field>

    <Field>
      <FieldLabel class="font-semibold">URL Slug</FieldLabel>
      <InputGroup>
        <InputGroupAddon>myshop.com/products/</InputGroupAddon>
        <Input v-model="slug" v-bind="slugAttrs" placeholder="my-product" />
      </InputGroup>
      <FieldError v-if="errors.slug">{{ errors.slug }}</FieldError>
    </Field>

    <Field>
      <FieldLabel class="font-semibold">Price</FieldLabel>
      <Input
        v-model.number="price"
        v-bind="priceAttrs"
        type="number"
        placeholder="0.00"
      />
      <FieldError v-if="errors.price">{{ errors.price }}</FieldError>
    </Field>

    <Field>
      <FieldLabel class="font-semibold">Inventory Count</FieldLabel>
      <Input
        v-model.number="inventoryCount"
        v-bind="inventoryCountAttrs"
        type="number"
        placeholder="0"
      />
      <FieldError v-if="errors.inventoryCount">{{ errors.inventoryCount }}</FieldError>
    </Field>

    <Button type="submit" :disabled="isSubmitting">
      <Icon v-if="isSubmitting" name="lucide:loader-2" class="animate-spin mr-2" />
      Create Product
    </Button>
  </form>
</template>
```

## Reusable Form Component Pattern

```ts
// EventBasicsForm.vue
<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { eventBasicsSchema, type EventBasicsPayload } from "~~/schemas/affiliate/events";

const model = defineModel<EventBasicsPayload>({
  default: () => ({
    title: "",
    slug: "",
    description: "",
  }),
});

const { defineField, errors, values, validate, meta } = useForm<EventBasicsPayload>({
  validationSchema: toTypedSchema(eventBasicsSchema),
  initialValues: model.value,
});

const [title, titleAttrs] = defineField("title");
const [slug, slugAttrs] = defineField("slug");

// Sync form values back to model
watch(values, (v) => {
  model.value = { ...v };
}, { deep: true });

// Expose validation to parent
defineExpose({
  validate,
  meta,
});
</script>
```

## Parent Component Usage

```ts
<script setup lang="ts">
const formData = ref<EventBasicsPayload>({
  title: "",
  slug: "",
});

const formRef = ref<{
  validate: () => Promise<{ valid: boolean }>;
  meta: { valid: boolean };
} | null>(null);

const handleSubmit = async () => {
  const { valid } = await formRef.value!.validate();
  if (!valid) return;

  // Use formData.value (synced from child)
  await createEvent(formData.value);
};
</script>

<template>
  <EventBasicsForm ref="formRef" v-model="formData" :disabled="isSubmitting" />
  <Button @click="handleSubmit" :disabled="isSubmitting">Submit</Button>
</template>
```

## Common Zod Patterns

```ts
// Required string with min length
name: z.string().min(1, "Name is required").min(3, "Min 3 characters"),

// Email
email: z.string().email("Invalid email address"),

// Phone (with libphonenumber-js)
phone: z.string().refine((val) => isValidPhoneNumber(val, 'GH'), "Invalid phone number"),

// Slug
slug: z.string().regex(/^[a-z0-9-]+$/, "Only lowercase, numbers, hyphens"),

// Optional with default
enabled: z.boolean().default(false),

// Optional nullable
description: z.string().optional().nullable(),

// Coerce date from string
startDate: z.coerce.date(),

// Enum
status: z.enum(["draft", "active", "completed"]),

// Array
tags: z.array(z.string()).default([]),

// Nested object
gallery: z.array(z.object({
  assetId: z.string(),
  caption: z.string().optional(),
  order: z.number(),
})).default([]),

// Refinement
.refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})
```

## Server-Side Validation

```ts
// In API handler
import { createProductSchema } from "~~/schemas/admin/products";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createProductSchema.parse);
  // body is now typed and validated
  body.name; // string
  body.price; // number
});
```

## Field UI Imports

```ts
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
```

## Do NOT

- Define Zod schemas inline in components - put in `schemas/`
- Use `<FormField>` component pattern - use `defineField` instead
- Use manual `setFieldValue` for simple fields
- Forget to export the inferred type from schema files
- Skip server-side validation - always validate on server too

## Reference Files

- Schemas: `schemas/affiliate/*.ts`, `schemas/admin/*.ts`
- Field components: `app/components/ui/field/`
- Example forms: `app/pages/admin/products/create.vue`
- Schema definitions: `schemas/admin/products.ts`
