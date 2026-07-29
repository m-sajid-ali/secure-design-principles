# Module 1 — SQL Injection

**Format:** live demo (you drive) · **Time:** ~18 min · **OWASP A03:2021 – Injection**

> Message of the module: **"If user input can change the *shape* of your query, input becomes code."**

---

## Run it

```bash
cd nodejs-example
docker compose up -d          # spins up ONLY this demo: app + MariaDB
# open http://localhost:3000
docker compose logs -f app    # optional: watch the app
docker compose down -v        # stop and wipe the DB when done
```

- Front page links to the **❌ Vulnerable** and **✅ Secure** versions of the same login.
- Each page has pre-filled **attack buttons** so nothing gets fumbled live.
- MariaDB auto-loads `db/init.sql` on first boot; credentials come from `.env`.

Seeded accounts: `alice / S3cret-Alice!` and `admin / SuperSecretAdminPw#2024`.

### Folder layout
```
nodejs-example/
├── docker-compose.yml     # app + db, this demo only
├── .env                   # DB credentials
├── db/init.sql            # seeds the users table (auto-run by MariaDB)
└── app/
    ├── Dockerfile         # node:22-alpine
    ├── server.js          # serves pages + mounts routes
    ├── db.js              # mysql2 pool (creds from env)
    ├── routes/bad.js      # ❌ vulnerable login
    ├── routes/good.js     # ✅ secure login
    └── views/             # index / bad / good pages
```

---

## Bad vs good — the whole difference

```js
// ❌ routes/bad.js — value spliced into query text; it can add SQL
const sql = `SELECT ... WHERE username = '${username}' AND password = '${password}'`;
await pool.query(sql);

// ✅ routes/good.js — value bound separately; it can only ever be data
await pool.execute("SELECT ... WHERE username = ?", [username]);
```

Placeholders (`?` / `$1` / named params) send the query and the data on separate channels. The database treats bound values as literals — full stop. (The secure path also verifies a **bcrypt hash** instead of a plaintext password — a second good practice baked in.)

---

## For the seniors (root cause + nuance)

- **Root cause: control and data share one channel.** Fix the *channel* (parameterize); don't try to sanitize the *data*. Parameterization is a design fix.
    ```js
    const clean = input.replace(/'/g, "''");        // "sanitized"
    const sql = `SELECT * FROM orders WHERE id = ${clean}`;
    ```
    ```
    Now the attacker just sends a value with no quotes at all:
    0 OR 1=1
    ```
    ```sql
    SELECT * FROM orders WHERE id = 0 OR 1=1     -- returns every order
    ```

- **Comment syntax is engine-specific** — a nice "know your DB" point. In MariaDB/MySQL, `--` only starts a comment when followed by whitespace, which is why this demo uses `#` (comments to end of line with no space). Postgres/SQLite treat `--` as a comment regardless. Attackers know all of these.
- **Escaping/blocklisting is not the fix.** Encodings, second-order injection (stored then reused), and numeric contexts with no quotes all defeat it.
- **ORMs are not automatically safe.** `raw()`, string interpolation in `whereRaw`, and dynamic `ORDER BY`/column names reopen the hole. Bind values, allow-list identifiers.
    ```js
    knex.raw('SELECT * FROM users WHERE email = ?', [email]);
    ```
    ```js
    const SORTABLE = { name: 'name', newest: 'created_at', price: 'price' };
    const col = SORTABLE[req.query.sort] ?? 'created_at';   // unknown input → safe default
    const dir = req.query.dir === 'desc' ? 'DESC' : 'ASC';  // never trust it raw
    knex.raw(`SELECT * FROM products ORDER BY ${col} ${dir}`);
    ```

- **Defense in depth:** least-privilege DB account (the API user shouldn't be able to `DROP`), plus input validation as a *secondary* control.

## Catch it in code review (everyone)
> In the diff, look for a **quote or backtick next to a SQL keyword** (`SELECT`, `WHERE`, `VALUES`) with a `${...}` or string concatenation inside. User data reaching a query as text instead of a bound parameter → block the PR.

## Takeaway (slide)
**Never build queries by string-joining user input. Always use parameterized queries / prepared statements. Escaping is not a substitute.**

---