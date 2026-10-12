# Core Queries

This module exports "query factory" objects which can be passed to the `useQuery` and `useMutation` hooks provided by `@tanstack/react-query`.

## Motivation

The most straightforward way to create reusable query/mutation hooks is to call `useQuery`/`useMutation` directly and export the result. However, this method has disadvantages when it comes to creating suspenseful queries:

- To enable a query to run in either standard or suspense modes, both a `useQuery` and `useSuspenseQuery` hook must be exported, duplicating the code needed for each query.
- Suspenseful queries run serially rather than concurrently when rendered inside a suspense boundary. To avoid this, `useSuspenseQueries` must be called with an array of query options.

The solution implemented in this module is to export **query options** which define the cache key and fetch method for a given query. It is then the responsibility of the consuming component to decide whether the query should be suspenseful and which queries need to be grouped together. Mutations don't have these issues around suspense, but we implement their options the same way in order to have a consistent usage pattern.

## Defining Query Options

`@tanstack/react-query` exports a `queryOptions` helper function for defining query options in a type-safe way. Each API (datafiles, apps, jobs, etc.) should define query options for its endpoints using appropriate cache keys and fetcher functions:

```ts
// src/objects/getObject.ts

import { queryOptions } from '@tanstack/react-query';

function fetchData({ id, signal }) {
  // Define a data fetching function
  // signal should be of type AbortSignal
}

export function getObject(id: number) {
  return queryOptions({
    queryKey: ['objects', id],
    queryFn: ({ signal }) => fetchData({ id, signal }),
  });
}
```

The exported options methods should be grouped by queries/mutations and re-exported at the module root. This gives us nice autocomplete behavior in components that consume these options:

```ts
// src/objects/index.ts

import { getObject } from './getObject';
import { postCreateObject } from './postCreateObject';

export const objectsQueries = {
  getObject,
};

export const objectsMutations = {
  postCreateObject,
};
```

```ts
// index.ts

//...
export * from './objects';
```

## Mutations

Mutations need to define a `mutationKey`when the `mutationOptions()` helper is used. We configure our query client to automatically invalidate/refetch queries after a successful mutation based on that mutation's key. The `mutationKey` should match the `queryKey` of the data it updates. For example, a mutation that creates a new `object` should have a key of `['objects']` so that when it succeeds, the UI automatically updates with an updated listing.

## Using Query Options in Componens

The exported query options can be passed directly to `useQuery` or any of its variants:

```ts
// MyComponent.tsx

import { useQuery } from '@tanstack/react-query';
import { objectsQueries } from '@tacc/core-queries';

export function MyComponent({ id }) {
  const { data } = useQuery(objectsQueries.getObject({ id }));

  //...
}
```
