# Testing Standards & Quality Assurance Protocol

This document establishes the mandatory test execution and reporting protocol for Meridian. Every implemented feature must be verified against these standards before it is considered complete.

---

## 1. Test Architecture & Layers

Every feature in Meridian must have automated test coverage across three distinct layers:

1. **Backend & Action Tests (`tests/unit/`)**:
   - Multi-tenant workspace isolation (scoping by `workspaceId`).
   - Role-Based Access Control (RBAC) hierarchy and permissions.
   - Server Actions error handling (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`).
   - Sole-owner demotion / lockout prevention.

2. **Validation Tests (`tests/unit/`)**:
   - Zod schema validation on client and server payloads.
   - Form field constraints (email regex, password length, slug sanitization).

3. **Frontend Component & DOM Tests (`tests/components/`)**:
   - React Hook Form client-side validation triggers.
   - UI component rendering in `jsdom` with `@testing-library/react`.
   - Role-scoped UI controls (e.g. hiding admin actions from viewers).

---

## 2. Root Test Reports Directory (`/test-reports/`)

To ensure complete visibility and traceability across development cycles:

- **Location**: `test-reports/` located in the **project root directory**.
- **Master Index**: `test-reports/INDEX.md` tracks all test suites, total test counts, pass/fail ratios, TypeScript strict status, and links to all feature reports.
- **Per-Feature Reports**: After implementing and verifying each feature, the AI assistant MUST generate a dedicated report file:
  ```
  test-reports/FEAT-xxx-[feature-name]-report.md
  ```

---

## 3. Structure of a Feature Test Report

Each feature test report markdown file in `/test-reports/` must include:

1. **Header & Metadata**: Feature IDs, execution date, overall verdict (PASSED/FAILED), TypeScript status, ESLint status, and database state.
2. **Test Suites Summary Table**: Table listing all executed test files, layer, test count, duration, and status.
3. **Granular Test Cases Matrix**: Detailed table for every test suite with columns:
   - `Test ID` (e.g., `TC-WS-01`, `TC-RBAC-01`)
   - `Test Case Description`
   - `Expected Result`
   - `Status` (✅ PASS / ❌ FAIL)
4. **Acceptance Criteria Checklist**: Verification against live runtime requirements.
5. **Reproduction Commands**: Terminal commands to run the test suite locally.

---

## 4. Quality Gates (Definition of Done)

No feature can be marked `Completed` in `context/progress-tracker.md` or `context/feature-specs/INDEX.md` until:

- [x] All automated tests pass 100% (`npm test` / `vitest run`).
- [x] Strict TypeScript check passes with zero errors (`npx tsc --noEmit`).
- [x] ESLint passes with zero errors and zero warnings (`npm run lint`).
- [x] Feature test report is written to `test-reports/FEAT-xxx-[name]-report.md`.
- [x] `test-reports/INDEX.md` is updated with the latest test counts and statuses.
