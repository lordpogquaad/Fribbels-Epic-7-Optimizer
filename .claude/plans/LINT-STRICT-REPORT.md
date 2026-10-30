# Strict lint — 1. App

Every ESLint problem of the `lint:strict` lane (`eslint.strict.config.mjs`: typescript-eslint and
eslint-plugin-regexp) over the targets of that package.json script in `1. App`, linted 2026-10-30 14:36 UTC by
`tools/tools/lint-strict-report.mjs`. Report only: nothing was fixed. Re-render from the raw JSON
with `--render`.

- Files: 96 linted, 58 with problems.
- Problems: **936** (0 error(s), 936 warning(s)).
- Runtime rules: 1.

## Runtime findings first

Rules whose id or message is about runtime, backtracking or complexity.

### regexp/no-super-linear-move — 6

- [ ] 2. Frontend/1. Source/4. JS/6. Shared/3. Services/subprocess.js L267:50 · warning · Any attack string /\\s+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] 2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L341:26 · warning · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] 2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L351:26 · warning · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] 2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L361:26 · warning · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] 2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L371:26 · warning · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] 2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L381:26 · warning · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.

## Totals by rule

| Rule                                                      | Errors | Warnings | Example message                                                                                                                                                            |
| --------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| no-undef                                                  | 0      | 341      | 'module' is not defined.                                                                                                                                                   |
| @typescript-eslint/no-floating-promises                   | 0      | 222      | Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.        |
| @typescript-eslint/no-unnecessary-condition               | 0      | 161      | Unnecessary optional chain on a non-nullish value.                                                                                                                         |
| @typescript-eslint/no-misused-promises                    | 0      | 73       | Promise returned in function argument where a void return was expected.                                                                                                    |
| @typescript-eslint/require-await                          | 0      | 45       | Async method 'getRows' has no 'await' expression.                                                                                                                          |
| require-atomic-updates                                    | 0      | 20       | Possible race condition: `slotPriorityConfigByIndex['']` might be assigned based on an outdated state of `slotPriorityConfigByIndex`.                                      |
| no-unused-vars                                            | 0      | 16       | 'params' is defined but never used.                                                                                                                                        |
| n/no-unpublished-import                                   | 0      | 12       | "chalk" is not published.                                                                                                                                                  |
| n/no-process-exit                                         | 0      | 8        | Don't use process.exit(); throw an error instead.                                                                                                                          |
| @typescript-eslint/await-thenable                         | 0      | 7        | Unexpected `await` of a non-Promise (non-"Thenable") value.                                                                                                                |
| @typescript-eslint/prefer-promise-reject-errors           | 0      | 7        | Expected the Promise rejection reason to be an Error.                                                                                                                      |
| @typescript-eslint/restrict-plus-operands                 | 0      | 7        | Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`. |
| regexp/no-super-linear-move                               | 0      | 6        | Any attack string /\\s+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.                                                               |
| regexp/no-dupe-characters-character-class                 | 0      | 4        | '\\s' is already included in '\\D'.                                                                                                                                        |
| @typescript-eslint/no-unnecessary-boolean-literal-compare | 0      | 2        | This expression unnecessarily compares a boolean value to a boolean instead of using it directly.                                                                          |
| promise/catch-or-return                                   | 0      | 2        | Expected catch() or return                                                                                                                                                 |
| @typescript-eslint/no-implied-eval                        | 0      | 1        | Implied eval. Consider passing a function.                                                                                                                                 |
| no-unmodified-loop-condition                              | 0      | 1        | 'interrupt' is not modified in this loop.                                                                                                                                  |
| promise/no-callback-in-promise                            | 0      | 1        | Avoid calling back inside of a promise.                                                                                                                                    |

## By file

### 2\. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js — 211

- [ ] L116:26 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L148:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L217:18 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L229:18 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L280:3 · warning · no-undef · 'Log' is not defined.
- [ ] L528:28 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L540:22 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L708:35 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L733:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1051:5 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L1056:5 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L1062:5 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1065:5 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1181:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1184:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1239:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1244:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1250:49 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1289:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1322:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1353:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1359:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1412:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1438:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1440:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1444:11 · warning · require-atomic-updates · Possible race condition: `slotPriorityConfigByIndex['']` might be assigned based on an outdated state of `slotPriorityConfigByIndex`.
- [ ] L1449:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1454:49 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1464:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1469:11 · warning · require-atomic-updates · Possible race condition: `setPriorityConfigByIndex['']` might be assigned based on an outdated state of `setPriorityConfigByIndex`.
- [ ] L1470:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1476:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1478:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L1482:11 · warning · require-atomic-updates · Possible race condition: `slotSubstatFiltersMap['']` might be assigned based on an outdated state of `slotSubstatFiltersMap`.
- [ ] L1484:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1485:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1490:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1492:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L1496:11 · warning · require-atomic-updates · Possible race condition: `slotStatFloorFiltersMap['']` might be assigned based on an outdated state of `slotStatFloorFiltersMap`.
- [ ] L1498:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1499:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1566:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1592:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1596:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1611:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1629:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1637:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1690:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1695:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1700:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1705:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1732:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1737:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1740:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1745:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1776:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1777:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1778:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1779:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1818:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1863:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1866:68 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1869:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1872:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1878:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1878:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L1880:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1884:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1884:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L1886:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1890:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1890:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L1892:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1896:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1896:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L1898:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1902:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1902:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L1904:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1909:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1912:9 · warning · no-undef · 'Log' is not defined.
- [ ] L1916:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1921:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1938:45 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1940:11 · warning · no-undef · 'Log' is not defined.
- [ ] L1942:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1943:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1948:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1961:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1962:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L2148:5 · warning · no-undef · 'Log' is not defined.
- [ ] L2163:7 · warning · no-undef · 'Log' is not defined.
- [ ] L2195:5 · warning · no-undef · 'Log' is not defined.
- [ ] L2288:5 · warning · no-undef · 'Log' is not defined.
- [ ] L2832:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L2920:33 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L3068:7 · warning · no-undef · 'Log' is not defined.
- [ ] L3074:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3078:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3082:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3166:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3167:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3179:5 · warning · no-undef · 'Log' is not defined.
- [ ] L3181:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3183:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3224:34 · warning · @typescript-eslint/no-implied-eval · Implied eval. Consider passing a function.
- [ ] L3338:3 · warning · no-undef · 'Log' is not defined.
- [ ] L3353:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3354:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3355:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3356:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3359:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3365:3 · warning · no-undef · 'Log' is not defined.
- [ ] L3377:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3378:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3379:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3382:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3398:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3399:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3400:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3402:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3484:36 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L3516:1 · warning · @typescript-eslint/require-await · Async function 'getAllItemsCached' has no 'await' expression.
- [ ] L3530:1 · warning · @typescript-eslint/require-await · Async function 'getAllHeroesCached' has no 'await' expression.
- [ ] L3547:3 · warning · require-atomic-updates · Possible race condition: `listEl.innerHTML` might be assigned based on an outdated state of `listEl`.
- [ ] L3568:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3620:5 · warning · no-undef · 'Log' is not defined.
- [ ] L3647:23 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L3647:40 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3648:23 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L3648:40 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3649:22 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L3649:39 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3650:25 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L3650:42 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3651:21 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L3651:38 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3652:21 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L3652:38 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3863:14 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L3885:7 · warning · no-undef · 'Log' is not defined.
- [ ] L3894:5 · warning · no-undef · 'Log' is not defined.
- [ ] L4058:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4080:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4081:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4082:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4098:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4110:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4111:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4112:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4161:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4162:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4163:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4210:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4212:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4213:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4235:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4236:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4248:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4249:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4261:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4262:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4294:7 · warning · no-undef · 'Log' is not defined.
- [ ] L4312:7 · warning · no-undef · 'Log' is not defined.
- [ ] L4331:13 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, comparison is always true, since `null === null` is true.
- [ ] L4344:9 · warning · no-undef · 'Log' is not defined.
- [ ] L4348:9 · warning · no-undef · 'Log' is not defined.
- [ ] L4354:5 · warning · no-undef · 'Log' is not defined.
- [ ] L4372:5 · warning · no-undef · 'Log' is not defined.
- [ ] L4441:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L4443:7 · warning · no-undef · 'Log' is not defined.
- [ ] L4447:12 · warning · no-undef · 'Log' is not defined.
- [ ] L4469:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L4474:12 · warning · no-undef · 'Log' is not defined.
- [ ] L4510:5 · warning · require-atomic-updates · Possible race condition: `_submitInFlight` might be reassigned based on an outdated value of `_submitInFlight`.
- [ ] L4515:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4527:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4558:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4569:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L4573:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L4587:5 · warning · no-undef · 'Log' is not defined.
- [ ] L4594:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4610:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4646:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4656:3 · warning · require-atomic-updates · Possible race condition: `currentExecutionId` might be reassigned based on an outdated value of `currentExecutionId`.
- [ ] L4660:3 · warning · require-atomic-updates · Possible race condition: `progressTimer` might be reassigned based on an outdated value of `progressTimer`.
- [ ] L4660:31 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L4661:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4697:7 · warning · no-undef · 'Log' is not defined.
- [ ] L4707:9 · warning · no-undef · 'Log' is not defined.
- [ ] L4752:7 · warning · no-undef · 'Log' is not defined.
- [ ] L4757:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4765:7 · warning · no-undef · 'Log' is not defined.
- [ ] L4782:3 · warning · no-undef · 'Log' is not defined.
- [ ] L4845:1 · warning · @typescript-eslint/require-await · Async function 'drawPreview' has no 'await' expression.
- [ ] L4848:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4915:56 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L4922:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L5071:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L5095:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L5119:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L5138:39 · warning · no-unused-vars · 'params' is defined but never used.
- [ ] L5138:47 · warning · no-unused-vars · 'heroId' is defined but never used.
- [ ] L5143:41 · warning · no-unused-vars · 'params' is defined but never used.
- [ ] L5143:49 · warning · no-unused-vars · 'heroes' is defined but never used.
- [ ] L5143:57 · warning · no-unused-vars · 'hero' is defined but never used.
- [ ] L5143:63 · warning · no-unused-vars · 'allowedHeroIds' is defined but never used.
- [ ] L5148:45 · warning · no-unused-vars · 'params' is defined but never used.
- [ ] L5148:53 · warning · no-unused-vars · 'hero' is defined but never used.
- [ ] L5173:38 · warning · no-unused-vars · 'params' is defined but never used.
- [ ] L5281:5 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/3. Hero Tab/heroesTab.js — 82

- [ ] L13:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, comparison is always true, since `null == null` is true.
- [ ] L23:5 · warning · no-undef · 'Log' is not defined.
- [ ] L27:5 · warning · no-undef · 'Log' is not defined.
- [ ] L33:5 · warning · no-undef · 'Log' is not defined.
- [ ] L67:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L67:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L68:9 · warning · no-undef · 'Log' is not defined.
- [ ] L71:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L76:35 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L80:9 · warning · no-undef · 'Log' is not defined.
- [ ] L85:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L86:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L98:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L103:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L104:9 · warning · no-undef · 'Log' is not defined.
- [ ] L115:9 · warning · no-undef · 'Log' is not defined.
- [ ] L126:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L127:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L132:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L133:9 · warning · no-undef · 'Log' is not defined.
- [ ] L138:9 · warning · no-undef · 'Log' is not defined.
- [ ] L145:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L146:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L151:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L152:9 · warning · no-undef · 'Log' is not defined.
- [ ] L180:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L185:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L186:9 · warning · no-undef · 'Log' is not defined.
- [ ] L200:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L201:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L202:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L203:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L208:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L211:9 · warning · no-undef · 'Log' is not defined.
- [ ] L225:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L230:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L233:9 · warning · no-undef · 'Log' is not defined.
- [ ] L236:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, left-hand side of `??` operator is always `null` or `undefined`.
- [ ] L243:9 · warning · require-atomic-updates · Possible race condition: `lastRankEntry` might be reassigned based on an outdated value of `lastRankEntry`.
- [ ] L249:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L254:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L257:9 · warning · no-undef · 'Log' is not defined.
- [ ] L260:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L265:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L266:9 · warning · no-undef · 'Log' is not defined.
- [ ] L271:9 · warning · no-undef · 'Log' is not defined.
- [ ] L274:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L275:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L280:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L281:9 · warning · no-undef · 'Log' is not defined.
- [ ] L286:9 · warning · no-undef · 'Log' is not defined.
- [ ] L289:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L290:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L295:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L296:9 · warning · no-undef · 'Log' is not defined.
- [ ] L301:9 · warning · no-undef · 'Log' is not defined.
- [ ] L304:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L305:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L310:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L311:9 · warning · no-undef · 'Log' is not defined.
- [ ] L316:9 · warning · no-undef · 'Log' is not defined.
- [ ] L319:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L320:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L324:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L325:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L328:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L330:9 · warning · no-undef · 'Log' is not defined.
- [ ] L336:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L339:14 · warning · no-undef · 'Log' is not defined.
- [ ] L343:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L429:5 · warning · no-undef · 'Log' is not defined.
- [ ] L438:7 · warning · no-undef · 'Log' is not defined.
- [ ] L443:9 · warning · no-undef · 'Log' is not defined.
- [ ] L455:9 · warning · no-undef · 'Log' is not defined.
- [ ] L456:9 · warning · no-undef · 'Log' is not defined.
- [ ] L457:9 · warning · no-undef · 'Log' is not defined.
- [ ] L475:7 · warning · no-undef · 'Log' is not defined.
- [ ] L480:9 · warning · no-undef · 'Log' is not defined.
- [ ] L559:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L567:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L570:12 · warning · no-undef · 'Log' is not defined.
- [ ] L576:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 2\. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/2. Multi-Hero Optimizer Tab/multiOptimizerTab.js — 78

- [ ] L15:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L246:16 · warning · no-undef · 'createGridCompat' is not defined.
- [ ] L275:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L300:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L300:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L302:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L307:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L308:7 · warning · no-undef · 'Log' is not defined.
- [ ] L358:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L360:16 · warning · no-undef · 'Log' is not defined.
- [ ] L362:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L367:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L412:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L417:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L417:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L423:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L423:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L430:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L432:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L438:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L480:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L480:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L495:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L513:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L547:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L579:7 · warning · no-undef · 'Log' is not defined.
- [ ] L582:12 · warning · no-undef · 'Log' is not defined.
- [ ] L599:5 · warning · no-undef · 'Log' is not defined.
- [ ] L602:8 · warning · @typescript-eslint/require-await · Async function 'initialize' has no 'await' expression.
- [ ] L605:67 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L605:76 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L661:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L661:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L675:12 · warning · no-unmodified-loop-condition · 'interrupt' is not modified in this loop.
- [ ] L679:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L694:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L694:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L703:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L707:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L712:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L712:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L720:32 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L720:41 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L746:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L755:66 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L794:27 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L794:47 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L814:33 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L814:53 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L822:7 · warning · no-undef · 'Log' is not defined.
- [ ] L873:7 · warning · no-undef · 'Log' is not defined.
- [ ] L956:5 · warning · @typescript-eslint/require-await · Async method 'getRows' has no 'await' expression.
- [ ] L970:28 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L970:52 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L970:69 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1001:35 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1001:55 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1027:11 · warning · no-undef · 'Log' is not defined.
- [ ] L1064:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1089:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1091:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L1171:12 · warning · no-undef · 'Log' is not defined.
- [ ] L1208:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1232:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1240:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1252:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1270:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1289:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1351:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1398:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1413:3 · warning · require-atomic-updates · Possible race condition: `multiOptimizerHeroes[index].executionId` might be assigned based on an outdated state of `multiOptimizerHeroes`.
- [ ] L1416:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L1432:14 · warning · no-undef · 'Log' is not defined.
- [ ] L1439:3 · warning · require-atomic-updates · Possible race condition: `progressTimer` might be reassigned based on an outdated value of `progressTimer`.
- [ ] L1455:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L1457:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1496:21 · warning · promise/no-callback-in-promise · Avoid calling back inside of a promise.
- [ ] L1499:12 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js — 56

- [ ] L216:8 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L216:18 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L515:8 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L515:18 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L518:8 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L518:18 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L829:8 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L829:18 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L880:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L890:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L899:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L908:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L917:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L927:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L937:24 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L958:24 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L979:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L990:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1084:7 · warning · @typescript-eslint/no-misused-promises · Promise-returning function provided to property where a void return was expected.
- [ ] L1084:7 · warning · @typescript-eslint/require-await · Async method 'didOpen' has no 'await' expression.
- [ ] L1109:7 · warning · @typescript-eslint/require-await · Async method 'preConfirm' has no 'await' expression.
- [ ] L1204:7 · warning · require-atomic-updates · Possible race condition: `Dialog._rtaData` might be assigned based on an outdated state of `Dialog`.
- [ ] L1208:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1292:9 · warning · require-atomic-updates · Possible race condition: `Dialog._communityBuilds` might be assigned based on an outdated state of `Dialog`.
- [ ] L1293:9 · warning · require-atomic-updates · Possible race condition: `Dialog._communityBuildsHero` might be assigned based on an outdated state of `Dialog`.
- [ ] L1318:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1336:7 · warning · require-atomic-updates · Possible race condition: `Dialog._stoveData` might be assigned based on an outdated state of `Dialog`.
- [ ] L1340:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1440:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1440:15 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1526:9 · warning · no-undef · 'Log' is not defined.
- [ ] L1565:13 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L1567:9 · warning · no-undef · 'Log' is not defined.
- [ ] L2069:7 · warning · @typescript-eslint/no-misused-promises · Promise-returning function provided to property where a void return was expected.
- [ ] L2069:7 · warning · @typescript-eslint/require-await · Async method 'didOpen' has no 'await' expression.
- [ ] L2082:7 · warning · @typescript-eslint/require-await · Async method 'preConfirm' has no 'await' expression.
- [ ] L2914:7 · warning · @typescript-eslint/no-misused-promises · Promise-returning function provided to property where a void return was expected.
- [ ] L2950:18 · warning · no-unused-vars · '\_row' is defined but never used.
- [ ] L3056:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3065:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3077:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3086:38 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L3101:24 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L3560:7 · warning · @typescript-eslint/no-misused-promises · Promise-returning function provided to property where a void return was expected.
- [ ] L4142:43 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L4156:13 · warning · no-undef · 'Log' is not defined.
- [ ] L4816:7 · warning · @typescript-eslint/require-await · Async method 'preConfirm' has no 'await' expression.
- [ ] L4817:9 · warning · no-undef · 'Log' is not defined.
- [ ] L4852:7 · warning · @typescript-eslint/require-await · Async method 'preConfirm' has no 'await' expression.
- [ ] L4880:7 · warning · @typescript-eslint/require-await · Async method 'preConfirm' has no 'await' expression.
- [ ] L5052:7 · warning · @typescript-eslint/no-misused-promises · Promise-returning function provided to property where a void return was expected.
- [ ] L5052:7 · warning · @typescript-eslint/require-await · Async method 'didOpen' has no 'await' expression.
- [ ] L5350:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L5583:29 · warning · no-unused-vars · '\_heroInfo' is defined but never used.
- [ ] L6518:3 · warning · no-unused-vars · 'index' is defined but never used.
- [ ] L6724:3 · warning · no-unused-vars · 'index' is defined but never used.

### 2\. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js — 43

- [ ] L49:7 · warning · no-undef · 'Log' is not defined.
- [ ] L281:41 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L281:49 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L337:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L337:25 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L528:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L686:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L687:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L693:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L694:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L699:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L718:26 · warning · no-unused-vars · '\_arch' is defined but never used.
- [ ] L720:26 · warning · no-unused-vars · '\_arch' is defined but never used.
- [ ] L848:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L870:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L870:19 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L873:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L879:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L882:36 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L882:55 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L895:9 · warning · no-undef · 'Log' is not defined.
- [ ] L911:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L918:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L944:33 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L944:51 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1002:25 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L1002:25 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L1319:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1328:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1330:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1331:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1477:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1478:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1496:15 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1509:15 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1513:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1514:15 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L1576:58 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L1594:13 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L1603:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1684:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1688:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L1739:52 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/itemsTab.js — 32

- [ ] L121:5 · warning · no-undef · 'Log' is not defined.
- [ ] L125:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L128:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L131:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L134:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L137:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L140:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L143:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L146:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L154:11 · warning · no-undef · 'Log' is not defined.
- [ ] L164:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. A rejection handler that is not a function will be ignored.
- [ ] L168:14 · warning · no-undef · 'Log' is not defined.
- [ ] L182:3 · warning · no-undef · 'Log' is not defined.
- [ ] L185:3 · warning · no-undef · 'Log' is not defined.
- [ ] L196:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L220:3 · warning · no-undef · 'Log' is not defined.
- [ ] L228:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L232:3 · warning · no-undef · 'Log' is not defined.
- [ ] L234:3 · warning · no-undef · 'Log' is not defined.
- [ ] L242:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L255:3 · warning · no-undef · 'Log' is not defined.
- [ ] L263:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L268:3 · warning · no-undef · 'Log' is not defined.
- [ ] L277:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L282:3 · warning · no-undef · 'Log' is not defined.
- [ ] L291:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L296:3 · warning · no-undef · 'Log' is not defined.
- [ ] L305:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L310:3 · warning · no-undef · 'Log' is not defined.
- [ ] L316:3 · warning · no-undef · 'Log' is not defined.
- [ ] L322:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L348:5 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/3. Hero Tab/heroesGrid.js — 31

- [ ] L125:3 · warning · no-undef · 'Log' is not defined.
- [ ] L154:5 · warning · no-undef · 'Log' is not defined.
- [ ] L164:5 · warning · no-undef · 'Log' is not defined.
- [ ] L170:32 · warning · no-unused-vars · 'filters' is defined but never used.
- [ ] L213:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L241:11 · warning · no-undef · 'Log' is not defined.
- [ ] L500:16 · warning · no-undef · 'createGridCompat' is not defined.
- [ ] L501:16 · warning · no-undef · 'createGridCompat' is not defined.
- [ ] L610:5 · warning · no-undef · 'Log' is not defined.
- [ ] L647:5 · warning · no-undef · 'Log' is not defined.
- [ ] L676:3 · warning · no-undef · 'Log' is not defined.
- [ ] L692:7 · warning · no-undef · 'Log' is not defined.
- [ ] L725:5 · warning · no-undef · 'Log' is not defined.
- [ ] L727:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L733:3 · warning · no-undef · 'Log' is not defined.
- [ ] L735:28 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L754:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L771:19 · warning · no-undef · 'Log' is not defined.
- [ ] L843:3 · warning · no-undef · 'Log' is not defined.
- [ ] L880:7 · warning · no-undef · 'Log' is not defined.
- [ ] L883:36 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L922:33 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L929:7 · warning · no-undef · 'Log' is not defined.
- [ ] L976:5 · warning · no-undef · 'Log' is not defined.
- [ ] L995:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1034:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1039:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1055:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1096:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1104:3 · warning · no-undef · 'Log' is not defined.
- [ ] L1117:3 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js — 23

- [ ] L38:29 · warning · regexp/no-dupe-characters-character-class · '\\s' is already included in '\\D'.
- [ ] L38:31 · warning · regexp/no-dupe-characters-character-class · '.' (U+002e) is already included in '\\D'.
- [ ] L38:32 · warning · regexp/no-dupe-characters-character-class · '\_' (U+005f) is already included in '\\D'.
- [ ] L38:33 · warning · regexp/no-dupe-characters-character-class · '-' (U+002d) is already included in '\\D'.
- [ ] L81:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L87:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L87:43 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L103:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L123:22 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L136:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L142:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L159:13 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L248:20 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L341:26 · warning · regexp/no-super-linear-move · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] L351:26 · warning · regexp/no-super-linear-move · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] L361:26 · warning · regexp/no-super-linear-move · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] L371:26 · warning · regexp/no-super-linear-move · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] L381:26 · warning · regexp/no-super-linear-move · Any attack string /\\d+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] L413:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L417:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L427:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L430:3 · warning · @typescript-eslint/require-await · Async method 'saveSettings' has no 'await' expression.
- [ ] L528:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 2\. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearScorer.js — 23

- [ ] L120:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L120:25 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L190:9 · warning · no-undef · 'Log' is not defined.
- [ ] L304:5 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L409:12 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L410:12 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L461:12 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L462:12 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L465:12 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L466:12 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L467:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L488:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L544:37 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L549:35 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L557:37 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L561:48 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L565:48 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L574:37 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L579:35 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L588:50 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L591:48 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L965:16 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L966:16 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.

### 2\. Frontend/1. Source/4. JS/4. Importer Tab/2. Importer/importer.js — 22

- [ ] L39:35 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L39:44 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L45:35 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L45:44 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L53:37 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L53:46 · warning · @typescript-eslint/require-await · Async arrow function has no 'await' expression.
- [ ] L54:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L58:50 · warning · @typescript-eslint/require-await · Async arrow function 'handleSaveExportOutputClick' has no 'await' expression.
- [ ] L103:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L105:56 · warning · @typescript-eslint/require-await · Async arrow function 'handleSaveLoadFromGameExportClick' has no 'await' expression.
- [ ] L165:37 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L170:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L206:17 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.
- [ ] L213:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L256:17 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.
- [ ] L263:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L301:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L306:17 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.
- [ ] L313:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L397:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L402:17 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.
- [ ] L409:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.

### 2\. Frontend/1. Source/4. JS/4. Importer Tab/1. Scanner/scanner.js — 21

- [ ] L300:7 · warning · no-undef · 'Log' is not defined.
- [ ] L304:3 · warning · no-undef · 'Log' is not defined.
- [ ] L307:27 · warning · no-undef · 'Log' is not defined.
- [ ] L308:23 · warning · no-undef · 'Log' is not defined.
- [ ] L411:11 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.
- [ ] L451:7 · warning · no-undef · 'Log' is not defined.
- [ ] L454:68 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.
- [ ] L461:7 · warning · no-undef · 'Log' is not defined.
- [ ] L464:7 · warning · no-undef · 'Log' is not defined.
- [ ] L468:7 · warning · no-undef · 'Log' is not defined.
- [ ] L473:7 · warning · no-undef · 'Log' is not defined.
- [ ] L488:9 · warning · no-undef · 'Log' is not defined.
- [ ] L489:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L524:3 · warning · @typescript-eslint/require-await · Async method 'end' has no 'await' expression.
- [ ] L526:7 · warning · no-undef · 'Log' is not defined.
- [ ] L547:9 · warning · no-undef · 'Log' is not defined.
- [ ] L552:7 · warning · no-undef · 'Log' is not defined.
- [ ] L555:11 · warning · no-undef · 'Log' is not defined.
- [ ] L557:11 · warning · no-undef · 'Log' is not defined.
- [ ] L561:7 · warning · no-undef · 'Log' is not defined.
- [ ] L565:13 · warning · @typescript-eslint/restrict-plus-operands · Invalid operand for a '+' operation. Operands must each be a number or string, allowing a string + any of: `any`, `boolean`, `null`, `RegExp`, `undefined`. Got `unknown`.

### 2\. Frontend/1. Source/4. JS/5. Archetype Tab/archetypeTab.js — 21

- [ ] L770:9 · warning · no-undef · 'Log' is not defined.
- [ ] L782:9 · warning · no-undef · 'Log' is not defined.
- [ ] L792:7 · warning · no-undef · 'Log' is not defined.
- [ ] L800:7 · warning · no-undef · 'Log' is not defined.
- [ ] L807:5 · warning · no-undef · 'Log' is not defined.
- [ ] L883:5 · warning · no-undef · 'Log' is not defined.
- [ ] L900:5 · warning · no-undef · 'Log' is not defined.
- [ ] L904:3 · warning · no-undef · 'Log' is not defined.
- [ ] L924:5 · warning · no-undef · 'Log' is not defined.
- [ ] L937:9 · warning · no-undef · 'Log' is not defined.
- [ ] L944:7 · warning · no-undef · 'Log' is not defined.
- [ ] L953:7 · warning · no-undef · 'Log' is not defined.
- [ ] L979:9 · warning · no-undef · 'Log' is not defined.
- [ ] L990:11 · warning · no-undef · 'Log' is not defined.
- [ ] L993:9 · warning · no-undef · 'Log' is not defined.
- [ ] L997:11 · warning · no-undef · 'Log' is not defined.
- [ ] L999:11 · warning · no-undef · 'Log' is not defined.
- [ ] L1014:9 · warning · no-undef · 'Log' is not defined.
- [ ] L1015:9 · warning · promise/catch-or-return · Expected catch() or return
- [ ] L1032:13 · warning · no-undef · 'Log' is not defined.
- [ ] L1040:13 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerGrid.js — 20

- [ ] L277:7 · warning · no-undef · 'Log' is not defined.
- [ ] L282:35 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L282:55 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L284:7 · warning · no-undef · 'Log' is not defined.
- [ ] L287:33 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L287:53 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L289:7 · warning · no-undef · 'Log' is not defined.
- [ ] L315:7 · warning · no-undef · 'Log' is not defined.
- [ ] L426:3 · warning · @typescript-eslint/require-await · Async method 'getRows' has no 'await' expression.
- [ ] L516:11 · warning · no-undef · 'Log' is not defined.
- [ ] L539:11 · warning · no-undef · 'Log' is not defined.
- [ ] L545:7 · warning · no-undef · 'Log' is not defined.
- [ ] L631:3 · warning · no-undef · 'Log' is not defined.
- [ ] L831:19 · warning · no-undef · 'createGridCompat' is not defined.
- [ ] L889:5 · warning · no-undef · 'Log' is not defined.
- [ ] L903:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L922:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L937:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L947:5 · warning · no-undef · 'Log' is not defined.
- [ ] L951:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 5\. Dev Only/main.dev.js — 15

- [ ] L9:14 · warning · no-undef · 'require' is not defined.
- [ ] L11:54 · warning · no-undef · 'require' is not defined.
- [ ] L17:17 · warning · no-undef · 'require' is not defined.
- [ ] L23:20 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L24:20 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L32:20 · warning · no-undef · 'require' is not defined.
- [ ] L117:28 · warning · no-undef · 'require' is not defined.
- [ ] L127:3 · warning · no-undef · 'require' is not defined.
- [ ] L130:31 · warning · @typescript-eslint/require-await · Async arrow function 'createWindow' has no 'await' expression.
- [ ] L165:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L286:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L286:3 · warning · promise/catch-or-return · Expected catch() or return
- [ ] L288:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L293:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L298:28 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/itemsGrid.js — 13

- [ ] L58:5 · warning · no-undef · 'Log' is not defined.
- [ ] L71:7 · warning · require-atomic-updates · Possible race condition: `selectedCell` might be reassigned based on an outdated value of `selectedCell`.
- [ ] L72:7 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L112:7 · warning · no-undef · 'Log' is not defined.
- [ ] L370:17 · warning · no-undef · 'createGridCompat' is not defined.
- [ ] L413:9 · warning · no-undef · 'Log' is not defined.
- [ ] L430:7 · warning · no-undef · 'Log' is not defined.
- [ ] L446:7 · warning · no-undef · 'Log' is not defined.
- [ ] L476:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L568:5 · warning · no-undef · 'Log' is not defined.
- [ ] L588:5 · warning · no-undef · 'Log' is not defined.
- [ ] L657:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L676:1 · warning · @typescript-eslint/require-await · Async function 'drawPreview' has no 'await' expression.

### 2\. Frontend/1. Source/4. JS/4. Importer Tab/3. Saves/saves.js — 13

- [ ] L143:3 · warning · @typescript-eslint/require-await · Async method 'autoSave' has no 'await' expression.
- [ ] L145:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L164:7 · warning · no-undef · 'Log' is not defined.
- [ ] L176:20 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L179:7 · warning · no-undef · 'Log' is not defined.
- [ ] L183:3 · warning · @typescript-eslint/require-await · Async method 'initialize' has no 'await' expression.
- [ ] L188:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L211:34 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L225:24 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L232:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L234:11 · warning · no-undef · 'Log' is not defined.
- [ ] L333:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L334:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 2\. Frontend/1. Source/4. JS/6. Shared/3. Services/heroData.js — 13

- [ ] L112:5 · warning · no-undef · 'Log' is not defined.
- [ ] L192:7 · warning · no-undef · 'Log' is not defined.
- [ ] L204:7 · warning · no-undef · 'Log' is not defined.
- [ ] L232:5 · warning · no-undef · 'Log' is not defined.
- [ ] L240:31 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L245:7 · warning · no-undef · 'Log' is not defined.
- [ ] L249:34 · warning · @typescript-eslint/await-thenable · Unexpected `await` of a non-Promise (non-"Thenable") value.
- [ ] L254:7 · warning · no-undef · 'Log' is not defined.
- [ ] L258:42 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L265:9 · warning · no-undef · 'Log' is not defined.
- [ ] L280:7 · warning · no-undef · 'Log' is not defined.
- [ ] L286:9 · warning · no-undef · 'Log' is not defined.
- [ ] L300:7 · warning · no-undef · 'Log' is not defined.

### 4\. Both/1. Webpack/webpack.config.renderer.prod.js — 13

- [ ] L5:14 · warning · no-undef · 'require' is not defined.
- [ ] L6:17 · warning · no-undef · 'require' is not defined.
- [ ] L7:30 · warning · no-undef · 'require' is not defined.
- [ ] L8:28 · warning · no-undef · 'require' is not defined.
- [ ] L9:34 · warning · no-undef · 'require' is not defined.
- [ ] L10:19 · warning · no-undef · 'require' is not defined.
- [ ] L11:22 · warning · no-undef · 'require' is not defined.
- [ ] L12:20 · warning · no-undef · 'require' is not defined.
- [ ] L13:22 · warning · no-undef · 'require' is not defined.
- [ ] L14:26 · warning · no-undef · 'require' is not defined.
- [ ] L19:1 · warning · no-undef · 'module' is not defined.
- [ ] L33:7 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L40:21 · warning · no-undef · '\_\_dirname' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/3. Services/api.js — 12

- [ ] L22:9 · warning · no-undef · 'Log' is not defined.
- [ ] L38:13 · warning · no-undef · 'Log' is not defined.
- [ ] L41:13 · warning · no-undef · 'Log' is not defined.
- [ ] L61:11 · warning · no-undef · 'Log' is not defined.
- [ ] L70:11 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L72:11 · warning · no-undef · 'Log' is not defined.
- [ ] L81:11 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L450:24 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L450:47 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L450:61 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L461:9 · warning · no-undef · 'Log' is not defined.
- [ ] L471:9 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/2. Enhancing Tab/enhancingTab.js — 11

- [ ] L18:3 · warning · no-undef · 'Log' is not defined.
- [ ] L26:5 · warning · no-undef · 'Log' is not defined.
- [ ] L80:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L207:3 · warning · @typescript-eslint/require-await · Async method 'initialize' has no 'await' expression.
- [ ] L208:5 · warning · no-undef · 'Log' is not defined.
- [ ] L235:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L240:9 · warning · no-undef · 'Log' is not defined.
- [ ] L244:3 · warning · @typescript-eslint/require-await · Async method 'redrawEnhanceGuide' has no 'await' expression.
- [ ] L254:5 · warning · no-undef · 'Log' is not defined.
- [ ] L255:5 · warning · no-undef · 'Log' is not defined.
- [ ] L580:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.

### 2\. Frontend/1. Source/4. JS/5. Archetype Tab/archetypeStore.js — 11

- [ ] L27:1 · warning · no-undef · 'Log' is not defined.
- [ ] L37:3 · warning · no-undef · 'Log' is not defined.
- [ ] L48:5 · warning · no-undef · 'Log' is not defined.
- [ ] L50:5 · warning · no-undef · 'Log' is not defined.
- [ ] L73:7 · warning · no-undef · 'Log' is not defined.
- [ ] L83:11 · warning · no-undef · 'Log' is not defined.
- [ ] L91:9 · warning · no-undef · 'Log' is not defined.
- [ ] L96:7 · warning · no-undef · 'Log' is not defined.
- [ ] L128:7 · warning · no-undef · 'Log' is not defined.
- [ ] L155:9 · warning · no-undef · 'Log' is not defined.
- [ ] L160:9 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/1. Core/inputHandler.js — 11

- [ ] L164:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L168:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L172:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L176:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L182:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L186:47 · warning · @typescript-eslint/no-misused-promises · Promise returned in function argument where a void return was expected.
- [ ] L191:3 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L210:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L214:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L216:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L220:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 4\. Both/1. Webpack/webpack.config.renderer.dev.js — 11

- [ ] L8:14 · warning · no-undef · 'require' is not defined.
- [ ] L9:17 · warning · no-undef · 'require' is not defined.
- [ ] L10:19 · warning · no-undef · 'require' is not defined.
- [ ] L11:19 · warning · no-undef · 'require' is not defined.
- [ ] L12:20 · warning · no-undef · 'require' is not defined.
- [ ] L13:22 · warning · no-undef · 'require' is not defined.
- [ ] L24:1 · warning · no-undef · 'module' is not defined.
- [ ] L34:35 · warning · no-undef · '\_\_filename' is not defined.
- [ ] L42:5 · warning · no-undef · 'require' is not defined.
- [ ] L48:21 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L159:38 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.

### 2\. Frontend/1. Source/4. JS/5. Archetype Tab/archetypeScorer.js — 10

- [ ] L68:17 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L181:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L181:27 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L200:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L200:27 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L219:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L219:16 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L235:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L235:27 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L260:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.

### 4\. Both/1. Webpack/webpack.config.main.prod.js — 10

- [ ] L5:14 · warning · no-undef · 'require' is not defined.
- [ ] L6:17 · warning · no-undef · 'require' is not defined.
- [ ] L7:19 · warning · no-undef · 'require' is not defined.
- [ ] L8:22 · warning · no-undef · 'require' is not defined.
- [ ] L9:34 · warning · no-undef · 'require' is not defined.
- [ ] L10:20 · warning · no-undef · 'require' is not defined.
- [ ] L11:22 · warning · no-undef · 'require' is not defined.
- [ ] L12:26 · warning · no-undef · 'require' is not defined.
- [ ] L17:1 · warning · no-undef · 'module' is not defined.
- [ ] L27:21 · warning · no-undef · '\_\_dirname' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/3. Services/rtaStats.js — 9

- [ ] L167:15 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L194:15 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L200:7 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L243:3 · warning · require-atomic-updates · Possible race condition: `_heroCodeMap` might be reassigned based on an outdated value of `_heroCodeMap`.
- [ ] L305:3 · warning · require-atomic-updates · Possible race condition: `_heroListByCode` might be reassigned based on an outdated value of `_heroListByCode`.
- [ ] L377:7 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L475:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L492:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L517:9 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.

### 2\. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/colorPicker.js — 9

- [ ] L196:11 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L207:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L221:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L235:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L246:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L259:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L271:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L283:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L301:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 2\. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter.js — 8

- [ ] L1125:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1133:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1136:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1138:7 · warning · no-undef · 'Log' is not defined.
- [ ] L1142:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1151:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1160:5 · warning · no-undef · 'Log' is not defined.
- [ ] L1163:5 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/2. Fribbels Hero Library/fribbelsGrid.js — 8

- [ ] L68:5 · warning · no-undef · 'Log' is not defined.
- [ ] L457:17 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.
- [ ] L457:41 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L457:59 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L458:29 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L458:49 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L460:31 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L460:51 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.

### 2\. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/2. Fribbels Hero Library/fribbelsLibrary.js — 8

- [ ] L100:47 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L109:15 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L109:42 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L339:5 · warning · no-undef · 'Log' is not defined.
- [ ] L362:9 · warning · no-undef · 'Log' is not defined.
- [ ] L434:5 · warning · no-undef · 'Log' is not defined.
- [ ] L803:9 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L946:5 · warning · @typescript-eslint/no-floating-promises · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 4\. Both/1. Webpack/webpack.config.base.js — 8

- [ ] L5:14 · warning · no-undef · 'require' is not defined.
- [ ] L6:17 · warning · no-undef · 'require' is not defined.
- [ ] L9:5 · warning · no-undef · 'require' is not defined.
- [ ] L11:1 · warning · no-undef · 'module' is not defined.
- [ ] L12:26 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L15:21 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L28:17 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L29:17 · warning · no-undef · '\_\_dirname' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/3. Services/subprocess.js — 7

- [ ] L222:7 · warning · no-undef · 'Log' is not defined.
- [ ] L242:25 · warning · @typescript-eslint/no-unnecessary-boolean-literal-compare · This expression unnecessarily compares a boolean value to a boolean instead of using it directly.
- [ ] L267:9 · warning · no-undef · 'Log' is not defined.
- [ ] L267:50 · warning · regexp/no-super-linear-move · Any attack string /\\s+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.
- [ ] L329:9 · warning · no-undef · 'Log' is not defined.
- [ ] L333:9 · warning · no-undef · 'Log' is not defined.
- [ ] L337:9 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/3. Services/stoveRta.js — 6

- [ ] L161:7 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L191:13 · warning · @typescript-eslint/prefer-promise-reject-errors · Expected the Promise rejection reason to be an Error.
- [ ] L261:3 · warning · require-atomic-updates · Possible race condition: `_seasonCode` might be reassigned based on an outdated value of `_seasonCode`.
- [ ] L268:5 · warning · no-undef · 'Log' is not defined.
- [ ] L407:28 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.
- [ ] L422:15 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/3. Gear/flatStatCalibration.js — 5

- [ ] L52:5 · warning · no-undef · 'Log' is not defined.
- [ ] L92:7 · warning · no-undef · 'Log' is not defined.
- [ ] L115:7 · warning · no-undef · 'Log' is not defined.
- [ ] L133:7 · warning · no-undef · 'Log' is not defined.
- [ ] L152:7 · warning · no-undef · 'Log' is not defined.

### 4\. Both/2. Build/1. Scripts/DeleteSourceMaps.js — 5

- [ ] L1:14 · warning · no-undef · 'require' is not defined.
- [ ] L2:12 · warning · no-undef · 'require' is not defined.
- [ ] L10:13 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L11:13 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L14:1 · warning · no-undef · 'module' is not defined.

### eslint.config.mjs — 5

- [ ] L5:16 · warning · n/no-unpublished-import · "@eslint/js" is not published.
- [ ] L6:21 · warning · n/no-unpublished-import · "globals" is not published.
- [ ] L7:22 · warning · n/no-unpublished-import · "typescript-eslint" is not published.
- [ ] L8:22 · warning · n/no-unpublished-import · "eslint-config-prettier" is not published.
- [ ] L9:45 · warning · n/no-unpublished-import · "eslint" is not published.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/3. Gear/itemAugmenter.js — 4

- [ ] L60:3 · warning · no-undef · 'Log' is not defined.
- [ ] L77:5 · warning · no-undef · 'Log' is not defined.
- [ ] L248:7 · warning · no-undef · 'Log' is not defined.
- [ ] L250:7 · warning · no-undef · 'Log' is not defined.

### 4\. Both/2. Build/1. Scripts/CheckNativeDep.js — 4

- [ ] L2:19 · warning · n/no-unpublished-import · "chalk" is not published.
- [ ] L6:5 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L14:32 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.
- [ ] L42:7 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.

### 4\. Both/2. Build/1. Scripts/CopyAssets.js — 4

- [ ] L1:14 · warning · no-undef · 'require' is not defined.
- [ ] L2:12 · warning · no-undef · 'require' is not defined.
- [ ] L5:3 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L9:3 · warning · no-undef · '\_\_dirname' is not defined.

### 4\. Both/2. Build/1. Scripts/regen-installed-transitives.js — 4

- [ ] L18:12 · warning · no-undef · 'require' is not defined.
- [ ] L19:14 · warning · no-undef · 'require' is not defined.
- [ ] L21:32 · warning · no-undef · '\_\_dirname' is not defined.
- [ ] L29:3 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.

### 5\. Dev Only/LogControl.js — 4

- [ ] L138:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
- [ ] L197:22 · warning · no-undef · 'require' is not defined.
- [ ] L198:20 · warning · no-undef · 'require' is not defined.
- [ ] L199:17 · warning · no-undef · 'require' is not defined.

### eslint.strict.config.mjs — 4

- [ ] L1:22 · warning · n/no-unpublished-import · "typescript-eslint" is not published.
- [ ] L2:20 · warning · n/no-unpublished-import · "eslint-plugin-regexp" is not published.
- [ ] L3:21 · warning · n/no-unpublished-import · "eslint-plugin-promise" is not published.
- [ ] L4:24 · warning · n/no-unpublished-import · "eslint-plugin-n" is not published.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/heroGearMatcher.js — 3

- [ ] L125:7 · warning · no-undef · 'Log' is not defined.
- [ ] L136:7 · warning · no-undef · 'Log' is not defined.
- [ ] L149:7 · warning · no-undef · 'Log' is not defined.

### 4\. Both/2. Build/1. Scripts/CheckNodeEnv.js — 3

- [ ] L2:15 · warning · no-undef · 'require' is not defined.
- [ ] L4:1 · warning · no-undef · 'module' is not defined.
- [ ] L15:5 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.

### 4\. Both/2. Build/1. Scripts/CheckPortInUse.js — 3

- [ ] L1:19 · warning · n/no-unpublished-import · "chalk" is not published.
- [ ] L2:24 · warning · n/no-unpublished-import · "detect-port" is not published.
- [ ] L14:5 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.

### 5\. Dev Only/FileLog.js — 3

- [ ] L26:12 · warning · no-undef · 'require' is not defined.
- [ ] L27:14 · warning · no-undef · 'require' is not defined.
- [ ] L155:1 · warning · no-undef · 'module' is not defined.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/modificationFilter.js — 2

- [ ] L195:49 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary optional chain on a non-nullish value.
- [ ] L531:7 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/4. UI/3. i18n/i18n.js — 2

- [ ] L4:3 · warning · @typescript-eslint/require-await · Async method 'initialize' has no 'await' expression.
- [ ] L82:7 · warning · no-undef · 'Log' is not defined.

### 4\. Both/2. Build/1. Scripts/TypecheckReport.mjs — 2

- [ ] L38:3 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.
- [ ] L62:3 · warning · n/no-process-exit · Don't use process.exit(); throw an error instead.

### babel.config.cjs — 2

- [ ] L10:1 · warning · no-undef · 'module' is not defined.
- [ ] L11:13 · warning · no-undef · 'require' is not defined.

### .dependency-cruiser.cjs — 1

- [ ] L7:1 · warning · no-undef · 'module' is not defined.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/forceFilter.js — 1

- [ ] L162:46 · warning · @typescript-eslint/no-unnecessary-boolean-literal-compare · This expression unnecessarily compares a boolean value to a boolean instead of using it directly.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/locator.js — 1

- [ ] L80:11 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.

### 2\. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/3. Gear/itemSerializer.js — 1

- [ ] L30:7 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/6. Shared/3. Services/communityBuilds.js — 1

- [ ] L58:3 · warning · require-atomic-updates · Possible race condition: `cache[heroName]` might be assigned based on an outdated state of `cache`.

### 2\. Frontend/1. Source/4. JS/6. Shared/4. UI/2. Display/htmlGenerator.js — 1

- [ ] L95:25 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always falsy.

### 2\. Frontend/1. Source/4. JS/6. Shared/4. UI/4. Renderer/gridRenderer.js — 1

- [ ] L89:7 · warning · no-undef · 'Log' is not defined.

### 2\. Frontend/1. Source/4. JS/7. Gear Analysis Tab/constants/epicSevenGearConstant.js — 1

- [ ] L572:31 · warning · @typescript-eslint/no-unnecessary-condition · Unnecessary conditional, value is always truthy.
