<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Catalog products live in the `products` table and are read through `listProducts` (src/lib/products.functions.ts); never reintroduce a hard-coded product list, because the admin panel edits the database.
- Catalog writes are allowed only by RLS `is_verified_admin()` (admin role + two-step `aal2` session); the /admin page is UI only, so security must stay in the database policies.
- Product photos go to the private `product-images` bucket and are stored as long-lived signed URLs, because public buckets are blocked in this workspace.
