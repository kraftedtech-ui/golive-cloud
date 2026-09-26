# Help screenshots

Regenerates the pictures in `public/help/` used by the portal's Help area
(`lib/helpGuides.ts`). Run it on your own computer after a screen changes.
It uses sample data only: no real customer data is ever shown or stored.

1. Build and start the portal locally (`npm run build`, then `npx next start -p 3100`).
   `.env.local` must contain a `NEXTAUTH_SECRET`.
2. Create a sign-in token for each role (tokens are signed with your local secret only):
   `for r in admin operations sales support; do S=<your NEXTAUTH_SECRET> node scripts/help-screenshots/mint.mjs $r > scripts/help-screenshots/tok_$r; done`
3. `pip install playwright pillow && playwright install chromium`
4. `python scripts/help-screenshots/capture.py`
5. Delete the `tok_*` files, check the new pictures, commit `public/help/`.

Numbered teal boxes are drawn on the controls named in each `save(...)` call;
keep them in step with the numbers in the guide text.
