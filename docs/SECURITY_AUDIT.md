# OrderWise — Phase 14 Security Hardening & Audit Report

> **Standard:** OWASP Top 10 (2021/2026) Compliance & Penetration Review  
> **Status:** Passed  
> **Date:** October 2026  

---

## 1. OWASP Top 10 Checklist & Implementations

| OWASP Category | Vulnerability Risk | OrderWise Countermeasures & Implementation | Verification Test |
|---|---|---|---|
| **A01: Broken Access Control** | IDOR, unauthorized privilege escalation, vertical role bypass | • Multi-tier RBAC middleware (`authenticate`, `authorize`) enforces roles (`guest`, `customer`, `inventory_manager`, `admin`).<br>• SQL filters strictly enforce customer isolation (`WHERE o.customer_id = req.user.userId`).<br>• IDOR prevention blocks users from accessing or cancelling other customers' orders. | `tests/securityHardening.test.js` (Authorization Matrix: 72 test cases & IDOR tests) |
| **A02: Cryptographic Failures** | Weak JWT keys, password hash exposure, cleartext tokens | • Passwords hashed with `bcryptjs` (salt rounds: 10).<br>• JWT signed with HS256 and minimum 32-character key (64-character minimum in production).<br>• `validateJwtSecretStrength` runs on startup and terminates if weak/placeholder secrets are used in production. | `tests/securityHardening.test.js` (JWT secret strength suite) |
| **A03: Injection** | SQL Injection, command injection | • 100% Parameterized queries using PostgreSQL node client (`$1, $2, ...`). Zero string-interpolated user input in SQL.<br>• Zod schema validation sanitizes and types all route inputs prior to handler execution. | `tests/securityHardening.test.js` & code grep audit |
| **A04: Insecure Design** | Uncontrolled mass assignment, absence of rate limiting | • Mass assignment protection: registration strictly forces `role = 'customer'`, order creation forces `status = 'pending'` and system-assigned priority.<br>• Dedicated rate limiters on `/api/auth/login`, `/api/auth/register`, and `/api/ai`. | `tests/securityHardening.test.js` (Mass assignment & rate limiter suite) |
| **A05: Security Misconfiguration** | Missing security headers, permissive CORS | • `helmet` configured with `ContentSecurityPolicy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.<br>• Strict CORS whitelist restricts allowed origins and blocks cross-origin script execution. | `tests/securityHardening.test.js` (Headers test) |
| **A06: Vulnerable & Outdated Components** | Known CVEs in dependencies | • Production dependencies audited with `npm audit --omit=dev`.<br>• Non-runtime dev dependencies documented with specific risk assessment below. | `npm audit` & Section 2 below |
| **A07: Identification & Auth Failures** | Credential stuffing, brute-force, session replay | • In-memory failed attempt tracker locks accounts after 5 consecutive bad passwords for 15 minutes.<br>• Refresh token rotation supported via `/api/auth/refresh`. | `tests/securityHardening.test.js` & `tests/Auth.test.jsx` |
| **A08: Software & Data Integrity Failures** | Malformed payloads, untrusted serialization | • Request body limits set to `500KB` (rejects oversized payloads with HTTP 413).<br>• Strict JSON schema parsing prevents prototype pollution and unexpected types. | `tests/securityHardening.test.js` (Oversized payload test) |
| **A09: Security Logging & Monitoring Failures** | Credential leakage in logs, unmonitored security actions | • `logger.js` implements recursive sanitization, redacting `password`, `token`, `secret`, `authorization`, `credit_card`, and JWT patterns.<br>• Structured audit logging captures security events (`LOGIN_FAILED`, `IDOR_ATTEMPT`, etc.). | `tests/securityHardening.test.js` (Log sanitization test) |
| **A10: Server-Side Request Forgery (SSRF)** | Arbitrary outbound network requests | • Backend communicates only with configured database and Groq API endpoints with hardcoded URL endpoints. | Architecture review |

---

## 2. Dependency Audit & Documented Exceptions

### Production Audit Status
`npm audit --omit=dev` confirms core runtime dependencies (`express`, `helmet`, `cors`, `bcryptjs`, `jsonwebtoken`, `zod`, `pg`, `morgan`, `express-rate-limit`) have **zero unaddressed high or critical vulnerabilities**.

### Documented DevDependency Exceptions
The following devDependencies are pinned per hackathon framework constraints (`AGENTS.md`):

1. **`glob` / `node-pg-migrate`**
   - *Advisory:* GHSA-5j98-mcp5-4vw2 (glob CLI argument injection via `-c`).
   - *Risk Assessment:* Low / Non-Exploitable. `node-pg-migrate` uses `glob` strictly as an in-memory library (`glob.sync(...)`), never as a standalone shell CLI command.
2. **`braces` / `chokidar` / `tailwindcss v3`**
   - *Advisory:* GHSA-vfj7-8cjw-p6xm (regex denial of service in build file watcher).
   - *Risk Assessment:* Build-time only. Not exposed to user runtime or public endpoints. Pinned to Tailwind v3 as mandated by `AGENTS.md`.
3. **`esbuild` / `vite v5` / `vitest v2`**
   - *Advisory:* GHSA-67mh-4wv8-2f99 / GHSA-5gmw-xhrv-c9v3 (dev server mock worker).
   - *Risk Assessment:* Test-runner and local dev-server only. Pinned for Vite 5 + React 18 compatibility.

---

## 3. Secrets & Credential Scan

- Verified git tree: Zero private keys, API secrets, or passwords committed to repository.
- `.env` files are strictly excluded via `.gitignore`.
- Production environment requires 64-character high-entropy secret validated at runtime.
