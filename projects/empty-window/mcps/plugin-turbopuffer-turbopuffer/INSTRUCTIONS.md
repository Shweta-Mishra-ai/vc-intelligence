## Turbopuffer Vector Database SDK

A vector database API for storing, searching, and filtering documents with dense/sparse vector embeddings and full-text search.

---

### Top Operations

**1. Upsert documents (row format)**
```ts
const res = await client.namespace('my-ns').write({
  upsert_rows: [
    { id: 1, vector: [0.1, 0.2, 0.3], category: 'news', title: 'Hello' },
  ],
});
// res: { status: 'OK', rows_upserted: number, billing: { billable_logical_bytes_written: number } }
```

**2. Upsert documents (columnar format — preferred for bulk)**
```ts
await client.namespace('my-ns').write({
  upsert_columns: { id: [1, 2], vector: [[0.1,0.2], [0.3,0.4]], tag: ['a','b'] },
});
```

**3. Vector similarity search (ANN)**
```ts
const res = await client.namespace('my-ns').query({
  rank_by: ['vector', 'ANN', [0.1, 0.2, 0.3]],
  top_k: 10,
  include_attributes: true,
});
// res.rows: Array<{ id: string|number, $dist: number, [attr]: any }>
```

**4. Filter + vector search**
```ts
const res = await client.namespace('my-ns').query({
  rank_by: ['vector', 'ANN', [0.1, 0.2, 0.3]],
  filters: ['And', [['category', 'Eq', 'news'], ['score', 'Gte', 0.5]]],
  top_k: 20,
  exclude_attributes: ['large_field'],
});
```

**5. Full-text / BM25 search**
```ts
const res = await client.namespace('my-ns').query({
  rank_by: ['title', 'BM25', 'search terms here'],
  top_k: 10,
  include_attributes: ['title', 'url'],
});
```

**6. Delete documents**
```ts
await client.namespace('my-ns').write({ deletes: [1, 2, 3] });
await client.namespace('my-ns').write({ delete_by_filter: ['tag', 'Eq', 'stale'] });
```

**7. Get namespace metadata**
```ts
const meta = await client.namespace('my-ns').metadata();
// meta: { approx_row_count, approx_logical_bytes, created_at, updated_at, schema, index: { status } }
```

**8. Check namespace exists / delete all**
```ts
const exists = await client.namespace('my-ns').exists(); // boolean
await client.namespace('my-ns').deleteAll();
```

**9. Multi-query (parallel queries in one request)**
```ts
const res = await client.namespace('my-ns').multiQuery({
  queries: [
    { rank_by: ['vec', 'ANN', [0.1, 0.2]], top_k: 5 },
    { filters: ['tag', 'Eq', 'news'], top_k: 5 },
  ],
});
// res: array of NamespaceQueryResponse objects
```

**10. List namespaces**
```ts
const page = await client.namespaces({ prefix: 'prod-', page_size: 50 });
// page.data: Array<{ id: string }>
for await (const ns of client.namespaces({ prefix: 'prod-' })) { /* auto-paginate */ }
```

---

### Filters

```ts
// Operators: Eq NotEq In NotIn Lt Lte Gt Gte Contains Glob Regex
//            ContainsAllTokens ContainsAnyToken AnyLt AnyGte ...
['field', 'Eq', value]
['And', [filter1, filter2]]
['Or',  [filter1, filter2]]
['Not', filter]
```

### Pagination

Cursor-based via `NamespacePage`. Use `for await` for auto-pagination or call `.hasNextPage()` / `.getNextPage()` manually.

### Streaming

Not supported. Use `multiQuery` for batch parallelism.

### Error Shapes

```ts
import Turbopuffer from 'turbopuffer';
try { ... } catch (err) {
  if (err instanceof Turbopuffer.APIError) {
    err.status;   // 400 | 401 | 403 | 404 | 409 | 422 | 429 | 5xx
    err.error;    // parsed JSON body
    err.headers;  // Response headers
  }
  // Subclasses: BadRequestError, AuthenticationError, NotFoundError,
  //             RateLimitError, InternalServerError, APIConnectionError
}
```

### Response Extras

```ts
// Raw Response access:
const { data, response } = await client.namespace('ns').query(...).withResponse();
// data.performance: { query_execution_ms, server_total_ms, cache_hit_ratio, cache_temperature, exhaustive_search_count }
// data.billing:     { billable_logical_bytes_queried, billable_logical_bytes_returned }
```

### Consistency

```ts
// Strong reads (slower, reads from object storage):
await client.namespace('ns').query({ ..., consistency: { level: 'strong' } });
```
Runs JavaScript code to interact with the Turbopuffer API.

Define an async function named "run" that takes a single parameter of an initialized SDK client.

## Listing namespaces

```
async function run(client) {
  for await (const ns of client.namespaces()) {
    console.log(ns.id);
  }
}
```

## Checking a namespace's schema

```
async function run(client) {
  const ns = client.namespace('your-namespace');
  const schema = await ns.schema();
  console.log(JSON.stringify(schema, null, 2));
}
```

## Querying (BM25 full-text search)

```
async function run(client) {
  const ns = client.namespace('your-namespace');
  const response = await ns.query({
    top_k: 10,
    rank_by: ['text', 'BM25', 'your search query'],
    include_attributes: ['summary', 'text']
  });

  if (response.rows) {
    for (const row of response.rows) {
      console.log("ID:", row.id);
      const summary = row.summary as string;
      console.log("Summary:", summary ? summary.substring(0, 800) : "N/A");
    }
  }
}
```

## Writing documents

```
async function run(client) {
  const ns = client.namespace('your-namespace');
  const response = await ns.write({
    distance_metric: 'cosine_distance',
    upsert_rows: [{ id: '1', vector: [0.1, 0.2] }],
  });
  console.log(response.rows_affected);
}
```

## Deleting a namespace

```
async function run(client) {
  const ns = client.namespace('your-namespace');
  await ns.deleteAll();
}
```

## Important

- If you don't know what namespaces exist, list them first with `client.namespaces()`
- Before querying, check the namespace schema with `ns.schema()` to see available attributes
- Only use attributes that exist in the schema for `include_attributes`
- Always use client.namespace('name') to get a namespace object first
- Then call methods on it: .query(), .write(), .deleteAll(), .schema()
- Always truncate output with substring() to avoid token limits
- Cast attributes before using string methods: `row.field as string`
- Do not add try-catch; the tool handles errors
- Variables do not persist between calls