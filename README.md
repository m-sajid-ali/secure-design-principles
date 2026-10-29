# Secure Design Principles — Hands-On Labs

Hands-on demos of secure design principles and common web/API vulnerabilities. Each lab shows a **bad practice** (vulnerable) next to a **good practice** (secure) version of the same feature, so you can attack the first and see the fix in the second.

Everything runs locally with **Docker**. No cloud account is needed.

---

## Learning path

| # | Folder | Topic |
|---|--------|-------|
| 01 | [`01_least-privilege/`](./01_least-privilege) | Least privilege: file access, write permissions, RBAC, CORS |
| 02 | [`02_complete-mediation_non-bypassability/`](./02_complete-mediation_non-bypassability) | Complete mediation: why client-side validation can be bypassed |
| 03 | [`03_least-privilege_non-bypassability/`](./03_least-privilege_non-bypassability/01_db-access) | Least privilege for database access |
| 04 | [`04_sql-injection/`](./04_sql-injection) | SQL injection (OWASP A03) |
| 05 | [`05_cxsrf/`](./05_cxsrf) | Cross-site request forgery (CSRF) |
| 06 | [`06_broken-auth_and_jwt-pitfalls/`](./06_broken-auth_and_jwt-pitfalls) | Broken authentication and JWT pitfalls (OWASP API2) |
| 07 | [`07_broken-object-level-authorization_BOLA_IDOR/`](./07_broken-object-level-authorization_BOLA_IDOR) | Broken object level authorization, BOLA / IDOR (OWASP API1) |
| 08 | [Google Gruyere](https://google-gruyere.appspot.com/) (external) | Cross-site scripting (XSS) and other web vulnerabilities, using Google's intentionally vulnerable web app |

---

## Prerequisites

- **Docker** and **Docker Compose** (v2, `docker compose ...`)
- **Git**
- A web browser

---

## How to run any lab

Every lab folder has its own `docker-compose.yaml`. Go into the folder and run:

```bash
docker compose up -d      # start
docker compose down -v    # stop and clean up when done
```

> Most labs use port **80**, so stop one lab before starting the next.

---

## 01. Least privilege

Give every user, process and component only the access it needs, and nothing more.

| Lab | What it shows | Open |
|-----|---------------|------|
| `1_restrict-access-to-server-side-files` | **Bad:** config files (`.env`, `config.json`, `config.php`) sit inside the web root and can be downloaded. **Good:** config is kept outside the web root. | http://localhost |
| `2_prevent-write-access-to-system-configuration-files` | **Bad:** the app writes to a system directory (`/etc`). **Good:** the app writes only to its own directory. | http://localhost |
| `3_restrict-write-permissions-in-apis` | **Bad:** an unauthenticated GET endpoint lets anyone change any user's email. **Good:** a session-based POST endpoint lets users change only their own email. Log in as Alice or Bob. | http://localhost |
| `4_web-application-role-based-access-control` | **Bad:** admin data is reachable by any logged-in user. **Good:** pages check the user's role before showing data. Log in as a *User* and try the admin pages. | http://localhost |
| `5_cors_example/1_using-nodejs` | An API with a restricted CORS policy. The legitimate frontend can read the data; the attacker site cannot. Toggle `app.use(cors())` in `api-server/index.js` to see the bad case. | App: http://localhost:3000 · Attacker: http://localhost:4000 · API: http://localhost:5000 |
| `5_cors_example/2_using_php` | Same idea in PHP. Run `bad-practice/` and `good-practice/` separately and compare what the attacker site can read. | App: http://localhost · Attacker: http://localhost:81 · API: http://localhost:8000 |

For lab 2, if you need to reset the container, run `docker compose down` and `docker compose up -d`.

## 02. Complete mediation (non-bypassability)

Every request must be checked on the server. Checks done only in the browser can be bypassed (e.g. with browser dev tools, curl or a proxy).

| Lab | What it shows | Open |
|-----|---------------|------|
| `example1-insecure-design_client-side-html-input-validation` | **Bad:** input is validated only with HTML attributes. **Good:** input is validated again on the server. | http://localhost |
| `example2-insecure-design_client-side-javaScript_WASM-input-validation` | **Bad:** input is validated only with JavaScript/WASM. **Good:** the server API validates the input. | http://localhost |

**Try it:** remove the validation in the browser's dev tools (or send the request with curl), submit invalid input, and compare how the bad and good versions respond.

## 03. Least privilege and non-bypassability for database access

Three steps, from an exposed database to locked-down users and an access-controlled DB client:

1. `1_insecure`
2. `2_secure-no-access-to-db-except-application`
3. `3_secure-access-of-db-clients`

Instructions, users and ports: [`03_least-privilege_non-bypassability/01_db-access/readme.md`](./03_least-privilege_non-bypassability/01_db-access/readme.md)

## 04. SQL injection

Instructions: [`04_sql-injection/Readme.md`](./04_sql-injection/Readme.md)

The folder also contains a PHP version in `php-example/` (`bad-practice/` and `good-practice/`), which runs at http://localhost.

## 05. Cross-site request forgery (CSRF)

A logged-in user visits an attacker's page, which silently submits a money transfer to the bank site using the user's session.

```bash
cd 05_cxsrf
docker compose up -d
```

| Service | Open |
|---------|------|
| Vulnerable bank (no CSRF protection) | http://localhost:8081 |
| Secure bank (CSRF token) | http://localhost:8080 |
| Attacker page | http://localhost:8082 |

**Try it:**
1. Log in to the vulnerable bank at :8081.
2. In the same browser, open the attacker page at :8082 and click **Claim Gift** for the vulnerable site. The transfer goes through.
3. Repeat with the secure bank at :8080. The request is rejected because it has no valid CSRF token.

## 06. Broken authentication and JWT pitfalls

Instructions: [`06_broken-auth_and_jwt-pitfalls/README.md`](./06_broken-auth_and_jwt-pitfalls/README.md)

## 07. Broken object level authorization (BOLA / IDOR)

Instructions: [`07_broken-object-level-authorization_BOLA_IDOR/README.md`](./07_broken-object-level-authorization_BOLA_IDOR/README.md)

---

## Configuration notes

Some labs have the instructor's machine IP address hard-coded (`10.1.134.219` or `192.168.18.73`). Before running on your own machine, replace it with your machine's IP address in:

- `01_least-privilege/5_cors_example/` — the `docker-compose.yaml` files, `1_using-nodejs/api-server/index.js` and `2_using_php/good-practice/backend/index.php`
- `05_cxsrf/` — `attacker/src/index.html` and `good-practice/src/index.php`
- `03_least-privilege_non-bypassability/01_db-access/3_secure-access-of-db-clients/db-client/nginx/ip-allow.conf` — the IPs allowed to reach the DB client

Find your IP with `hostname -I` (Linux) or `ipconfig` (Windows).

---

## Disclaimer

These labs contain **intentionally vulnerable code** for teaching. Run them only on your own machine or an isolated lab network, and never deploy them to a public server.

---
