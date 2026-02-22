# Cache and React Query Examples

This document is a template showing how to integrate Next.js fetch caching
(ISR + tag revalidation) with React Query hydration. It is intended as a
reference for future public pages.

## Naming conventions

- **Cache tags**
  - Base tag: `public:<module>`
  - Entity tag: `public:<module>:<id>`
  - Examples: `public:example`, `public:example:123`
- **Query keys**
  - Shape: `[baseKey, organizationId?, paramsKey?]`
  - Use a centralized builder to keep server and client keys identical

## Centralized keys and tags (template)

```ts
// lib/cache/example.ts (template)
import { serializeQueryParams } from "@/lib/query-keys";

export const PUBLIC_EXAMPLE_TAG = "public:example";
export const PUBLIC_EXAMPLE_ITEM_TAG = (id: string): string =>
  `public:example:${id}`;

export interface ExampleListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
}

type KeyBase = string | readonly unknown[];

export function buildQueryKey(
  base: KeyBase,
  organizationId?: string,
  params?: ExampleListParams,
): readonly unknown[] {
  const baseKey = Array.isArray(base) ? [...base] : [base];
  const paramsKey = serializeQueryParams(params);
  return paramsKey
    ? [...baseKey, organizationId, paramsKey]
    : [...baseKey, organizationId];
}

export const exampleKeys = {
  list: (params?: ExampleListParams) =>
    buildQueryKey(["public-example"], undefined, params),
  detail: (id: string) => ["public-example", "detail", id] as const,
} as const;
```

## Types used in the examples

```ts
// domains/public/example/types.ts (template)
export interface ExampleItem {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export interface ExampleListResponse {
  rows: ExampleItem[];
  rowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
```

## Server component (prefetch + ISR)

```tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { serverFetch } from "@/lib/server-fetch";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/public-cache";
import {
  PUBLIC_EXAMPLE_TAG,
  exampleKeys,
} from "@/lib/cache/example";
import type { ExampleListResponse } from "@/domains/public/example/types";
import ExampleList from "@/domains/public/example/ExampleList";

export async function ExamplePage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery<ExampleListResponse>({
    queryKey: exampleKeys.list({ page: 1, pageSize: 12 }),
    queryFn: () =>
      serverFetch<ExampleListResponse>("/api/public/example", {
        method: "GET",
        params: { page: 1, pageSize: 12 },
        next: {
          tags: [PUBLIC_EXAMPLE_TAG],
          revalidate: PUBLIC_REVALIDATE_SECONDS,
        },
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExampleList />
    </HydrationBoundary>
  );
}
```

## Client component (React Query)

```tsx
"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { exampleKeys } from "@/lib/cache/example";
import type { ExampleListResponse } from "@/domains/public/example/types";

export default function ExampleList() {
  const { data, isLoading, error } = useApiQuery<ExampleListResponse>({
    key: exampleKeys.list({ page: 1, pageSize: 12 }),
    endpoint: "/api/public/example",
    method: "GET",
    queryParams: { page: 1, pageSize: 12 },
    requireOrganization: false,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Failed to load.</div>;

  const rows = data?.rows ?? [];

  return (
    <div>
      {rows.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>{row.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Detail page (template)

```tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { serverFetch } from "@/lib/server-fetch";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/public-cache";
import {
  PUBLIC_EXAMPLE_ITEM_TAG,
  exampleKeys,
} from "@/lib/cache/example";
import type { ExampleItem } from "@/domains/public/example/types";
import ExampleDetail from "@/domains/public/example/ExampleDetail";

export async function ExampleDetailPage({ params }: { params: { id: string } }) {
  const queryClient = getQueryClient();
  const { id } = params;

  await queryClient.prefetchQuery<ExampleItem>({
    queryKey: exampleKeys.detail(id),
    queryFn: () =>
      serverFetch<ExampleItem>(`/api/public/example/${id}`, {
        method: "GET",
        next: {
          tags: [PUBLIC_EXAMPLE_ITEM_TAG(id)],
          revalidate: PUBLIC_REVALIDATE_SECONDS,
        },
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExampleDetail id={id} />
    </HydrationBoundary>
  );
}
```

```tsx
"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { exampleKeys } from "@/lib/cache/example";
import type { ExampleItem } from "@/domains/public/example/types";

export default function ExampleDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useApiQuery<ExampleItem>({
    key: exampleKeys.detail(id),
    endpoint: `/api/public/example/${id}`,
    method: "GET",
    requireOrganization: false,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Failed to load.</div>;
  if (!data) return <div>Not found.</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>Status: {data.status}</p>
    </div>
  );
}
```

## Invalidation guidelines

- Client cache invalidation (React Query):
  - `queryClient.invalidateQueries({ queryKey: ["public-example"], exact: false })`
- Server cache invalidation (Next tags):
  - `revalidateCache({ tags: ["public:example"] })`
