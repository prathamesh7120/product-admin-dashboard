# Product Admin Dashboard

A small admin dashboard built with Next.js, React, Tailwind CSS, and Axios, using the [DummyJSON](https://dummyjson.com) API.

## Setup

1. Clone the repo: `git clone https://github.com/prathamesh7120/product-admin-dashboard.git`
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`
4. Open `http://localhost:3000`
5. Log in with username `emilys` and password `emilyspass`

## What's finished

- Login with error handling for wrong credentials; route protection on all `/products` pages; logout
- Product list with table (desktop) and cards (mobile)
- Pagination: page numbers, Previous/Next, page size (10/20/50), "Showing X–Y of Z" text
- Debounced search with race-condition-safe fetching (stale responses never overwrite newer ones)
- Category filter and sort (price, rating, title)
- Product details page (`/products/[id]`) with images, description, reviews, and a "not found" state
- Add, edit, and delete with form validation and a delete confirmation popup
- Page, search, filter, and sort state all live in the URL, so refreshing or sharing a link preserves the view
- Loading, empty, and error states with a Retry button throughout
- Bad URL values (`?page=abc`, `?page=999`) are handled gracefully instead of crashing
- Double-clicking Login or Save cannot fire duplicate requests
- One shared Axios instance (`src/lib/axios.js`) attaches the auth token to every request and handles 401 errors centrally

## Notes

See `NOTES.md` for design decisions, a problem I ran into, and where AI tools helped.
