# Module 2 — Broken Authentication & JWT

**Format:** live demo (you drive) · **Time:** ~20–22 min · **OWASP API2:2023 – Broken Authentication**

> Message of the module: **A JWT proves *integrity*, not *possession*. Verify it properly — and remember a bearer token is only safe until someone else holds it.**

The demo is a **five-level progression**. One attacker goal throughout — read another user's data / become admin — fired at five endpoints with escalating defenses. The room watches exactly where each attack dies.

---

## Run it

```bash
cd module-2-broken-auth-jwt
docker compose up -d          # app + MariaDB, this demo only
# open http://localhost:3000
docker compose down -v        # stop and wipe when done
```

Front page → **Vulnerable (L1–L3)** and **Hardened (L4–L5)**. Each level is a self-contained card: log in, tamper/forge the token with the buttons (all base64/crypto done in-browser), then call that level's endpoint. Accounts: `alice / S3cret-Alice!`, `bob / Bob-Pass-123`, `admin / SuperSecretAdminPw#2024`.

---

## The five levels

| Level | Server does | Attack that WINS | Why it stops at the next level |
|-------|-------------|------------------|--------------------------------|
| **L1** | `jwt.decode()` — no check | tamper `role→admin`; tamper `sub→2` (become Bob) | signature is never checked |
| **L2** | `jwt.verify()` with weak hardcoded secret `"secret"`, no expiry | forge a **validly-signed** admin token with the cracked secret | signature is checked, but the secret is guessable |
| **L3** | naive/legacy verifier that trusts the `alg` header | forge **`alg:none`** (unsigned) admin token | it honours `alg:none`; a real pinned verifier won't |
| **L4** | `jwt.verify(secret, { algorithms:["HS256"] })`, strong env secret, 15-min expiry | — (all forgeries + expired token rejected) | integrity is now solid |
| **L5** | L4 **+ sender-constrained** (DPoP-style proof-of-possession) | — (even a *stolen valid token* fails elsewhere) | possession is now required, not just the token |

Key contrast to voice out loud: **L1→L2** "verifying helped — tampering now fails — but a weak secret undoes it." **L4→L5** "integrity was perfect, yet I stole the token and got in; L5 fixes *that*."

---

## Run of show (~20 min)

1. **Frame (2m).** "A JWT is just base64 you can read *and rewrite*. The only thing between an attacker and `role:admin` is how well you check it — and even a perfect check doesn't stop a stolen token."
2. **L1 decode (3m).** Log in as alice → `GET /l1/account` shows `signature verified: false`. Click **Tamper → role: admin** → **the admin panel leaks every user**. Then **Tamper → sub: 2** → **Bob's private record**. One button each.
3. **L2 weak secret (4m).** Log in → **Tamper → role: admin** now **fails** (bad signature — "see, verifying helps"). Then **Forge signed with 'secret'** → **admin panel again**. "The secret is the word `secret`; jwt_tool cracks it in milliseconds, and then I mint whatever I want." Note: no expiry either.
4. **L3 alg:none (3m).** **Forge alg:none** → **works** on the naive verifier. Say clearly: modern `jsonwebtoken` rejects this by default (we tested it) — this level mimics old libraries / hand-rolled checks, and it's *why* you pin `algorithms`.
5. **L4 hardened (3m).** Same buttons — forge-`secret`, `alg:none`, tamper — **all 401**. **Mint expired token** → `TokenExpiredError`. Normal login still works.
6. **L5 sender-constrained (4m).** ⭐ Log in (generates an EC keypair in the browser, binds the token to it). **Legit request** → authenticated. Now **Simulate stolen token (no proof)** → **401 NoProof**: "I copied a valid, unexpired token to another client and it's useless — the private key never left the original browser."
7. **Land it (2m).** Takeaway + review heuristic.

---

## Bad → good, in code

```js
// L1  ❌ jwt.decode(token)                                   // no checks at all
// L2  ⚠  jwt.verify(token, "secret", {algorithms:["HS256"]}) // checks, but weak secret + no exp
// L3  ❌ naiveVerify(token)                                   // trusts alg header (accepts alg:none)
// L4  ✅ jwt.verify(token, process.env.JWT_SECRET, {algorithms:["HS256"]})  // + expiresIn:"15m"
// L5  ✅ L4 + require a DPoP proof whose key thumbprint === token.cnf.jkt
```

---

## For the seniors (root cause + nuance)

- **`decode` ≠ `verify`.** Treat the payload as attacker-controlled until `verify` succeeds. The common real-world version is an internal service that "trusts the gateway" and just reads `req.token.sub`.
- **Secret strength is not optional.** `HS*` secrets are crackable if weak; use 32+ random bytes from a secret manager, never a literal, never shipped in a mobile binary.
- **Pin `algorithms`.** Historically this stopped `alg:none` and RS256→HS256 confusion. Modern `jsonwebtoken` v9 blocks both by default — but pin anyway (defense-in-depth, and not every library/language is as safe).
- **Bearer tokens = possession is authentication.** Verification proves the token is authentic and untampered; it says nothing about *who holds it*. Theft (XSS, logs, proxies) → replay. Mitigate with **short exp + refresh**, **sender-constraint (DPoP RFC 9449 / mTLS RFC 8705)**, **`aud`/`iss` checks** (a token for API A is refused by API B), TLS everywhere, and **revocation/rotation** for logout and compromise.
- **Don't put secrets in the payload** — it's signed, not encrypted; anyone can read it.

## Catch it in code review (everyone)
> Flag: `jwt.decode(` used as auth; any token claim (`role`, `sub`, `isAdmin`) used without a preceding `jwt.verify(..., { algorithms })`; a signing secret written as a string literal; and `verify` calls with no `algorithms` option. Any of these → block the PR.

## Takeaway (slide)
**Verify every token (signature + pinned algorithm + expiry) with a strong secret from the environment — and for high-value APIs, sender-constrain the token so a stolen copy is useless.**

---

## Verified
Tested against MariaDB 11 and driven through headless Chromium. On the vulnerable levels: L1 tamper exposes the admin panel and returns other users' records; L2 rejects plain tampering but accepts a token forged with `"secret"`; L3 accepts an `alg:none` token. On the hardened levels: L4 rejects every forgery and expired tokens; L5 authenticates a legitimate proof but rejects the same valid token when it is copied away from its key (`NoProof`) or presented with a different key (`KeyMismatch`).
