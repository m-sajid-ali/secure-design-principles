# Module 3 — Broken Object Level Authorization (BOLA / IDOR)

**Format:** live demo → **hands-on lab** · **Time:** ~22–25 min · **OWASP API1:2023 – Broken Object Level Authorization** (the #1 API risk)

> Message of the module: **Authentication asks "who are you?" Authorization asks "may you touch *this* object?" BOLA is forgetting the second question.**

Auth is done correctly here (verified JWT from Module 2), so the identity is trustworthy. The only bug is that the vulnerable endpoints fetch an object by its ID **without checking who owns it**.

---

## Run it

```bash
cd module-3-bola-idor
docker compose up -d          # app + MariaDB, this demo only
# open http://localhost:3000
docker compose down -v
```

Accounts: `alice / S3cret-Alice!`, `bob / Bob-Pass-123`. Orders: 1001,1003 = alice · 1002,1004 = bob · 1005 = admin.

---

## Run of show

1. **Frame.** "You're correctly logged in as alice. Watch me read and cancel Bob's orders without ever being Bob." Open the vulnerable page.
2. **Baseline .** Log in → your own orders list (1001, 1003). Fetch **1001** → your order. All normal.
3. **The read breach .** ⭐ Fetch **1002** (Bob's) → it returns Bob's item, **shipping address, and card last-4**. Change one number in the URL and you've read another customer's data. Click **1004, 1005** to show you can enumerate the whole table.
4. **The write breach.** **POST cancel** on **1002** → you just cancelled Bob's order. BOLA isn't only reads — it's every verb.
5. **The fix.** Switch to the secure page. Same IDs: **1002 → 404**, cancel **1002 → 404**, but your own **1001** still works. "The ownership check is in the query, so it can't be skipped — and 404 (not 403) means we don't even confirm the object exists for someone else."
6. **Hands-on lab.** Attendees add `AND owner_id = ?` to a provided vulnerable handler and re-test. *Stretch (seniors):* move the check into shared middleware / a policy helper so no future handler can forget it.
7. **Land it.** Takeaway + review heuristic.

---

## Bad vs good — the whole difference

```sql
-- ❌ routes/bad.js  — fetch by ID only; anyone's object
SELECT * FROM orders WHERE id = ?;

-- ✅ routes/good.js — scope every access to the authenticated owner
SELECT * FROM orders WHERE id = ? AND owner_id = ?;
```

The owner comes from the **verified token** (`req.user.id`), never from the request body or URL. Same pattern on writes: `UPDATE ... WHERE id = ? AND owner_id = ?` → `affectedRows = 0` means "not yours."

---

## For the seniors (root cause + nuance)

- **BOLA is #1 for a reason:** it's per-endpoint, per-object, and easy to forget on the 200th handler. The durable fix is **centralized authorization** (middleware / policy layer / query scoping by tenant), not a check copy-pasted into each route.
- **Object IDs are not secrets.** Switching sequential IDs to UUIDs is *obscurity*, not authorization — a leaked/enumerated UUID still works. Always check ownership.
- **404 vs 403:** returning 404 for objects the user can't access avoids confirming they exist (prevents enumeration).
- **Don't trust client-supplied identity.** Owner/tenant must come from the verified session/token, never from a body field like `owner_id` or `?userId=` (that's the same class as the Module 2 `sub`-tamper).
- **Check every verb** — GET, PATCH, DELETE, and nested routes (`/orders/:id/items/:itemId` needs both checks).
- **Related:** BFLA (API5) is *function*-level ("can this role call this endpoint at all"); BOLA is *object*-level ("can this user touch this row"). You need both.

## Catch it in code review (everyone)
> For any handler that takes an `:id` (or `id` in the body): is the object load scoped to the current user/tenant (`AND owner_id = ?` / an ownership check) **before** it's read, updated, or deleted? If ownership comes from the URL/body instead of the verified token, or isn't checked at all → block the PR.

## Takeaway (slide)
**Every object access must be scoped to the authenticated owner/tenant, taken from the verified token — enforced centrally so no handler can forget it. IDs are not authorization.**

---
