# Design Notes

## Search vs. category filter

DummyJSON can't search and filter by category in the same request — `/products/search?q=` and
`/products/category/{name}` are separate endpoints. I chose to let the category filter take
priority: when a category is selected, the search text is kept visible in the input (so the user
doesn't lose what they typed) but is not sent to the API. A note appears in the UI explaining this.

Reasoning: selecting a category is a more deliberate, structural choice than typing a search term,
and the API genuinely can't combine both, so pretending they work together would be misleading.
Being explicit about the limitation in the UI felt better than silently picking one and leaving the
user confused about why their search seems to do nothing.

## Add, edit, and delete aren't really persisted by the API

DummyJSON accepts `POST /products/add`, `PUT /products/{id}`, and `DELETE /products/{id}` and
returns success responses, but doesn't actually change its underlying data — a refresh reverts
everything. My app still makes these real API calls (so the network requests genuinely happen and
succeed), but layers the "would-be" result on top using `sessionStorage`:

- New products are stored under a `pendingAdds` key and prepended to the list.
- Edits are stored under a `pendingEdits` key, keyed by product id, and merged onto whatever the
  API returns for that product.
- Deletes are stored under a `pendingDeletes` key (a list of ids) and filtered out of every list
  fetch.

I used `sessionStorage` rather than `localStorage` since this is fake persistence for demo
purposes — it's reasonable for it to reset when the tab closes rather than persisting forever.

## A problem I faced and how I fixed it

After building the details page, clicking into a product I'd just added locally showed
"Product not found." The details page only knew how to fetch real products from the API by id —
it had no way to look up a product that only existed in `sessionStorage`. I fixed it by giving
locally-added products an id prefixed with `local-`, and checking for that prefix first in both
the details page and the edit page, routing to `sessionStorage` instead of the API when it's
present.

## Where AI helped

I used Claude to help scaffold each part of this project (Axios interceptor setup, the debounced
search with race-condition handling, URL state management, and the local-persistence pattern for
add/edit/delete), and to debug a few issues along the way (a stale-cache 404, a mismatched file
path for the dynamic route, and the local-product lookup bug described above). I read and
understood every part of the resulting code before including it — I can walk through and explain
any line, and I'm prepared to make live changes during the review.