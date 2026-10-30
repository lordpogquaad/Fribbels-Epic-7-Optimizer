# Sonar scan — Fribbels-Epic-7-Optimizer

Every open SonarJS finding in the JS/TS files of `F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer`, scanned 2026-10-30 14:46 UTC by
`tools/tools/diag-scan-repo.mjs` (the SonarQube for IDE engine, through diag-scan). Scan only:
nothing was fixed. Re-render from the raw JSON with `--render`, adding `--ignore` to drop accepted
findings.

- Files: 95 listed, 94 scanned, 1 unscanned.
- File list: 93 tracked, 2 untracked-added, 0 deleted skipped, 2 declaration files skipped.
- Open findings: **458** in 41 file(s); exit 2.
- Left out: 0 already closed on the server (none); 0 matched the ignore file.
- Rule source: server profile lordpogquaad\_Fribbels-Epic-7-Optimizer.
- TypeScript program: per-file orphan (no tsconfig); type-aware rules can differ from the IDE, which uses the project program (--program project)
- extension 6.2.0 is not the probed 6.1.1; its server protocol matched the expected field numbers
- rule parameters: engine defaults (N profile rule(s) carry parameters, not applied; list them with --params)
- server status: N finding(s) tagged from N issue(s) marked resolved, accepted or false positive in lordpogquaad\_Fribbels-Epic-7-Optimizer on sonarcloud.io (F:\\Epic Seven Screenshots Only\\New folder\\Gear simulator files\\Fribbels-Epic-7-Optimizer)

## Unscanned (never clean)

| File                                                                  | Reason               |
| --------------------------------------------------------------------- | -------------------- |
| 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearScorer.js | not scanned by sonar |

## Runtime findings first

Rules whose message is about runtime, backtracking or complexity (S8786, S5843, S3776, …).

### S3776 — 32

- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerGrid.js L426:9 · Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js L521:32 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js L3575:16 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js L3974:36 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js L4274:16 · Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js L5037:10 · Refactor this function to reduce its Cognitive Complexity from 43 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter.js L330:10 · Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter.js L684:10 · Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter.js L1177:10 · Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter.js L1727:38 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/rollDivisors.js L220:10 · Refactor this function to reduce its Cognitive Complexity from 43 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/rollDivisors.js L312:17 · Refactor this function to reduce its Cognitive Complexity from 33 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/rollDivisors.js L686:30 · Refactor this function to reduce its Cognitive Complexity from 53 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/rtaStats.js L456:30 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L1582:26 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L4733:32 · Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L5154:42 · Refactor this function to reduce its Cognitive Complexity from 71 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L5321:28 · Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L5689:10 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L5890:10 · Refactor this function to reduce its Cognitive Complexity from 51 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L5946:14 · Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L6151:10 · Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js L6308:10 · Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L236:26 · Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/2. Display/htmlGenerator.js L57:10 · Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/2. Display/htmlGenerator.js L670:3 · Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js L440:34 · Refactor this function to reduce its Cognitive Complexity from 37 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js L559:36 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js L681:12 · Refactor this function to reduce its Cognitive Complexity from 62 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js L985:41 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js L1344:12 · Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.
- [ ] 1. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js L1520:12 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

### S8786 — 6

- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/subprocess.js L267:49 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L341:20 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L351:20 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L361:20 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L371:20 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] 1. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js L381:20 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.

## Totals by rule

| Rule  | Count | Runtime | Example message                                                                                                                                                     |
| ----- | ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S9383 | 150   |         | Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. |
| S6582 | 85    |         | Prefer using an optional chain expression instead, as it's more concise and easier to read.                                                                         |
| S7773 | 36    |         | Prefer `Number.parseInt` over `parseInt`.                                                                                                                           |
| S3776 | 32    | yes     | Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.                                                                                |
| S3358 | 30    |         | Extract this nested ternary operation into an independent statement.                                                                                                |
| S4138 | 25    |         | Use a "for...of" loop, since the index is only used to read array elements.                                                                                         |
| S7766 | 11    |         | Prefer `Math.max()` to simplify ternary expressions.                                                                                                                |
| S7781 | 11    |         | Use `replaceAll()` with a string literal instead of this global regex.                                                                                              |
| S6661 | 7     |         | Use an object spread instead of `Object.assign` eg: `{ ...foo }`.                                                                                                   |
| S2871 | 6     |         | Provide a compare function to avoid sorting elements alphabetically.                                                                                                |
| S8786 | 6     | yes     | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.                                                     |
| S1940 | 5     |         | Use the opposite operator (\<=) instead.                                                                                                                            |
| S4036 | 4     |         | Make sure the "PATH" variable only contains fixed, unwriteable directories.                                                                                         |
| S4123 | 4     |         | This "await" does not apply to a "Promise". Remove it or fix the expression.                                                                                        |
| S4624 | 4     |         | Refactor this code to not use nested template literals.                                                                                                             |
| S107  | 3     |         | Method 'applyPriorityFilters' has too many parameters (8). Maximum allowed is 7.                                                                                    |
| S4043 | 3     |         | Move this array "sort" operation to a separate statement or replace it with "toSorted".                                                                             |
| S6397 | 3     |         | Replace this character class by the character itself.                                                                                                               |
| S7721 | 3     |         | Move function 'globalSelectHtml' to the outer scope.                                                                                                                |
| S7776 | 3     |         | `_SLOTS` should be a `Set`, and use `_SLOTS.has()` to check existence or non-existence.                                                                             |
| S1121 | 2     |         | Extract the assignment of "buckets\[g\]" from this expression.                                                                                                      |
| S2004 | 2     |         | Refactor this code to not nest functions more than 5 levels deep.                                                                                                   |
| S3579 | 2     |         | Make it an object if it must have named properties; otherwise, use a numeric index here.                                                                            |
| S7755 | 2     |         | Prefer `.at(…)` over `[….length - index]`.                                                                                                                          |
| S7758 | 2     |         | Prefer `String.fromCodePoint()` over `String.fromCharCode()`.                                                                                                       |
| S7772 | 2     |         | Prefer `node:fs` over `fs`.                                                                                                                                         |
| S1135 | 1     |         | Complete the task associated to this "TODO" comment.                                                                                                                |
| S1481 | 1     |         | Remove unused function '\_td'.                                                                                                                                      |
| S1788 | 1     |         | Move this default parameter last, so callers can omit it instead of passing "undefined".                                                                            |
| S2094 | 1     |         | Unexpected empty class.                                                                                                                                             |
| S2589 | 1     |         | This always evaluates to truthy. Consider refactoring this code.                                                                                                    |
| S4144 | 1     |         | Update this function so that its implementation is not identical to the one on line 219.                                                                            |
| S5869 | 1     |         | Remove duplicates in this character class.                                                                                                                          |
| S6557 | 1     |         | Use the 'String#endsWith' method instead.                                                                                                                           |
| S6644 | 1     |         | Unnecessary use of conditional expression for default assignment.                                                                                                   |
| S6660 | 1     |         | Replace this nested "if" with a more direct "else if".                                                                                                              |
| S7727 | 1     |         | Do not pass function `fn` directly to `.map(…)`.                                                                                                                    |
| S7760 | 1     |         | Prefer default parameters over reassignment.                                                                                                                        |
| S7767 | 1     |         | Use `Math.trunc` instead of `\| 0`.                                                                                                                                 |
| S7785 | 1     |         | Prefer top-level await over using a promise chain.                                                                                                                  |
| S9144 | 1     |         | Use Array.prototype.indexOf() instead of jQuery.inArray() to reduce dependence on jQuery.                                                                           |

## By file

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/dialog.js — 91

- [ ] L216:8 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L220:11 · S1940 · Use the opposite operator (\<=) instead.
- [ ] L231:19 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L312:19 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L382:21 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L384:53 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L428:21 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L515:8 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L518:8 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L519:27 · S4144 · Update this function so that its implementation is not identical to the one on line 219.
- [ ] L520:11 · S1940 · Use the opposite operator (\<=) instead.
- [ ] L528:19 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L553:26 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L628:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L629:19 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L688:24 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L727:21 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L729:53 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L740:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L752:17 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L756:21 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L829:8 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L870:21 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L880:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L890:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L899:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L908:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L917:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L927:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L979:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L990:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1218:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1251:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1385:44 · S4624 · Refactor this code to not use nested template literals.
- [ ] L1391:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1411:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1417:17 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1418:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1438:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1438:30 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1440:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1543:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1565:13 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1582:26 · S3776 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] L1591:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1601:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1609:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1631:42 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L3127:5 · S7721 · Move function 'globalSelectHtml' to the outer scope.
- [ ] L3137:5 · S7721 · Move function 'slotOptionSelectHtml' to the outer scope.
- [ ] L3703:9 · S7721 · Move function 'buildPinTargetOptions' to the outer scope.
- [ ] L4269:21 · S2004 · Refactor this code to not nest functions more than 5 levels deep.
- [ ] L4598:66 · S2004 · Refactor this code to not nest functions more than 5 levels deep.
- [ ] L4733:32 · S3776 · Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [ ] L5094:17 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5104:17 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5128:25 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5137:25 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5154:42 · S3776 · Refactor this function to reduce its Cognitive Complexity from 71 to the 15 allowed.
- [ ] L5252:50 · S1940 · Use the opposite operator (\<=) instead.
- [ ] L5321:28 · S3776 · Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [ ] L5329:20 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5336:13 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5338:13 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5350:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L5373:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L5388:20 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5414:20 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5560:7 · S3579 · Make it an object if it must have named properties; otherwise, use a numeric index here.
- [ ] L5562:7 · S3579 · Make it an object if it must have named properties; otherwise, use a numeric index here.
- [ ] L5572:7 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L5634:11 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L5666:7 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L5689:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] L5697:7 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5833:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5843:13 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5848:13 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5890:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 51 to the 15 allowed.
- [ ] L5946:14 · S3776 · Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.
- [ ] L5971:48 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5974:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6004:15 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6028:15 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6041:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6047:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6071:117 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6071:152 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L6151:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [ ] L6299:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L6308:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab.js — 80

- [ ] L148:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L425:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L512:22 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.
- [ ] L521:32 · S3776 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] L551:18 · S1940 · Use the opposite operator (\<=) instead.
- [ ] L571:23 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.
- [ ] L733:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1184:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1239:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1244:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1359:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1412:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1449:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1470:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1484:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1498:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1566:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1592:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1611:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1629:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1637:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1690:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1695:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1700:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1705:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1732:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1737:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1740:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1745:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1776:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1777:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1778:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1779:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1818:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1863:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1869:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1872:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1880:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1886:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1892:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1898:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1904:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1942:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1962:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L2832:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3074:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3078:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3082:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3166:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3167:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3353:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3377:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3398:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L3507:21 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L3508:42 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L3575:16 · S3776 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] L3974:36 · S3776 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] L4081:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4111:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4162:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4212:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4235:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4248:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4261:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4274:16 · S3776 · Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.
- [ ] L4323:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4325:22 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4438:26 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.
- [ ] L4466:26 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.
- [ ] L4515:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4681:24 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.
- [ ] L4757:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4848:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L4887:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4892:13 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4919:19 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4920:25 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4922:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L4950:37 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L5037:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 43 to the 15 allowed.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter.js — 41

- [ ] L144:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L157:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L168:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L183:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L189:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L204:44 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L219:21 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L220:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L223:17 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L298:5 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L312:5 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L319:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L330:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [ ] L332:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L337:5 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L339:7 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L342:21 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L343:16 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L429:50 · S2871 · Provide a compare function to avoid sorting elements alphabetically.
- [ ] L450:6 · S2871 · Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.
- [ ] L463:6 · S2871 · Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.
- [ ] L466:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L508:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L513:8 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L556:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L612:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L654:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L684:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [ ] L843:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1177:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [ ] L1232:7 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1234:9 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1236:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1570:3 · S107 · Method 'applyPriorityFilters' has too many parameters (8). Maximum allowed is 7.
- [ ] L1605:7 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L1673:11 · S7776 · `_SLOTS` should be a `Set`, and use `_SLOTS.has()` to check existence or non-existence.
- [ ] L1694:9 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L1727:38 · S3776 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] L1803:9 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L1806:23 · S1121 · Extract the assignment of "buckets\[g\]" from this expression.
- [ ] L1808:41 · S2871 · Provide a compare function to avoid sorting elements alphabetically.

### 1\. App/2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/gearAnalysisTab.js — 35

- [ ] L91:8 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L92:8 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L93:8 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L94:8 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L153:11 · S7776 · `ALL_RANKS` should be a `Set`, and use `ALL_RANKS.has()` to check existence or non-existence.
- [ ] L325:19 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L326:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L440:34 · S3776 · Refactor this function to reduce its Cognitive Complexity from 37 to the 15 allowed.
- [ ] L559:36 · S3776 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] L586:24 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L586:62 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L610:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L651:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L676:60 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L681:12 · S3776 · Refactor this function to reduce its Cognitive Complexity from 62 to the 15 allowed.
- [ ] L737:48 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L822:83 · S4624 · Refactor this code to not use nested template literals.
- [ ] L857:12 · S1481 · Remove unused function '\_td'.
- [ ] L950:11 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L985:41 · S3776 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [ ] L986:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1126:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1156:19 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1160:39 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1199:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L1233:15 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L1255:43 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L1344:12 · S3776 · Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.
- [ ] L1383:42 · S1940 · Use the opposite operator (\<=) instead.
- [ ] L1520:12 · S3776 · Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [ ] L1594:13 · S2589 · This always evaluates to truthy. Consider refactoring this code.
- [ ] L1632:11 · S6660 · Replace this nested "if" with a more direct "else if".
- [ ] L1684:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1739:52 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1756:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/3. Hero Tab/heroesTab.js — 30

- [ ] L71:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L85:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L86:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L98:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L126:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L127:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L145:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L146:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L180:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L200:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L201:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L202:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L203:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L225:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L249:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L260:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L274:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L275:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L289:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L290:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L304:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L305:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L319:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L320:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L324:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L325:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L336:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L343:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L567:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L576:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/1. Components/settings.js — 20

- [ ] L32:9 · S9144 · Use Array.prototype.indexOf() instead of jQuery.inArray() to reduce dependence on jQuery.
- [ ] L38:27 · S5869 · Remove duplicates in this character class.
- [ ] L39:19 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L81:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L103:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L231:19 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L233:12 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L236:26 · S3776 · Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.
- [ ] L341:20 · S8786 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] L351:20 · S8786 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] L361:20 · S8786 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] L371:20 · S8786 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] L381:20 · S8786 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.
- [ ] L413:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L417:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L468:26 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L472:31 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L476:24 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L480:26 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L484:28 · S7773 · Prefer `Number.parseInt` over `parseInt`.

### 1\. App/2. Frontend/1. Source/4. JS/3. Hero Tab/heroesGrid.js — 14

- [ ] L213:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L411:7 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L413:13 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L727:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L754:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L824:38 · S7766 · Prefer `Math.max()` to simplify ternary expressions.
- [ ] L825:38 · S7766 · Prefer `Math.min()` to simplify ternary expressions.
- [ ] L861:17 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L874:19 · S6644 · Unnecessary use of conditional expression for default assignment.
- [ ] L917:19 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L958:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L1013:40 · S7766 · Prefer `Math.max()` to simplify ternary expressions.
- [ ] L1014:40 · S7766 · Prefer `Math.min()` to simplify ternary expressions.
- [ ] L1039:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/2. Multi-Hero Optimizer Tab/multiOptimizerTab.js — 13

- [ ] L15:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L275:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L302:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L344:28 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.
- [ ] L362:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L495:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L679:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L809:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L813:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L924:32 · S7766 · Prefer `Math.max()` to simplify ternary expressions.
- [ ] L927:32 · S7766 · Prefer `Math.min()` to simplify ternary expressions.
- [ ] L1240:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L1442:24 · S6661 · Use an object spread instead of `Object.assign` eg: `{ ...foo }`.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/stoveRta.js — 13

- [ ] L137:15 · S7767 · Use `Math.trunc` instead of `| 0`.
- [ ] L220:5 · S4043 · Move this array "sort" operation to a separate statement or replace it with "toSorted".
- [ ] L232:5 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L250:17 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L265:8 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L273:52 · S4624 · Refactor this code to not use nested template literals.
- [ ] L294:6 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L352:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L401:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L402:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L417:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L491:3 · S1788 · Move this default parameter last, so callers can omit it instead of passing "undefined".
- [ ] L501:24 · S7755 · Prefer `.at(…)` over `[….length - index]`.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerGrid.js — 11

- [ ] L102:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L106:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L130:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L131:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L250:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L271:15 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L426:9 · S3776 · Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [ ] L455:13 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L607:38 · S7766 · Prefer `Math.max()` to simplify ternary expressions.
- [ ] L608:38 · S7766 · Prefer `Math.min()` to simplify ternary expressions.
- [ ] L766:11 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/2. Fribbels Hero Library/fribbelsPriorityFilter.js — 11

- [ ] L17:3 · S7760 · Prefer default parameters over reassignment.
- [ ] L175:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L178:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L181:23 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L184:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L187:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L190:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L193:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L196:24 · S7773 · Prefer `Number.parseFloat` over `parseFloat`.
- [ ] L376:27 · S7727 · Do not pass function `fn` directly to `.map(…)`.
- [ ] L392:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/1. Core/inputHandler.js — 10

- [ ] L164:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L168:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L172:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L176:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L182:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L191:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L210:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L214:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L216:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L220:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/itemsTab.js — 8

- [ ] L125:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L128:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L131:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L134:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L137:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L140:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L143:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L146:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/rtaStats.js — 8

- [ ] L71:3 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L104:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L291:27 · S7773 · Prefer `Number.parseInt` over `parseInt`.
- [ ] L339:5 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L348:5 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L363:5 · S4043 · Move this array "sort" operation to a separate statement or replace it with "toSorted".
- [ ] L377:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L456:30 · S3776 · Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/2. Display/htmlGenerator.js — 7

- [ ] L14:6 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L15:6 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L16:6 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.
- [ ] L57:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.
- [ ] L555:67 · S3358 · Extract this nested ternary operation into an independent statement.
- [ ] L555:82 · S4624 · Refactor this code to not use nested template literals.
- [ ] L670:3 · S3776 · Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.

### 1\. App/2. Frontend/1. Source/4. JS/4. Importer Tab/3. Saves/saves.js — 6

- [ ] L145:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L176:20 · S4123 · This "await" does not apply to a "Promise". Remove it or fix the expression.
- [ ] L225:24 · S4123 · This "await" does not apply to a "Promise". Remove it or fix the expression.
- [ ] L232:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L333:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L334:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/5. Dev Only/main.dev.js — 6

- [ ] L165:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L286:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L286:19 · S7785 · Prefer top-level await over using a promise chain.
- [ ] L288:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L293:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L298:28 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### .claude/hooks/guard-package-root.mjs — 5

- [ ] L31:24 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L34:26 · S7758 · Prefer `String.fromCodePoint()` over `String.fromCharCode()`.
- [ ] L45:27 · S6397 · Replace this character class by the character itself.
- [ ] L45:51 · S6397 · Replace this character class by the character itself.
- [ ] L45:55 · S6397 · Replace this character class by the character itself.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/communityBuilds.js — 5

- [ ] L42:5 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L56:20 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L62:5 · S4043 · Move this array "sort" operation to a separate statement or replace it with "toSorted".
- [ ] L111:5 · S4138 · Use a "for...of" loop, since the index is only used to read array elements.
- [ ] L135:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/rollDivisors.js — 4

- [ ] L220:10 · S3776 · Refactor this function to reduce its Cognitive Complexity from 43 to the 15 allowed.
- [ ] L312:17 · S3776 · Refactor this function to reduce its Cognitive Complexity from 33 to the 15 allowed.
- [ ] L414:5 · S107 · Arrow function has too many parameters (8). Maximum allowed is 7.
- [ ] L686:30 · S3776 · Refactor this function to reduce its Cognitive Complexity from 53 to the 15 allowed.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/2. Fribbels Hero Library/fribbelsGrid.js — 4

- [ ] L42:9 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L119:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L124:38 · S7766 · Prefer `Math.max()` to simplify ternary expressions.
- [ ] L125:38 · S7766 · Prefer `Math.min()` to simplify ternary expressions.

### 1\. App/2. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/modificationFilter.js — 4

- [ ] L57:1 · S107 · Function '\_variantCacheKey' has too many parameters (9). Maximum allowed is 7.
- [ ] L143:5 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L366:36 · S1121 · Extract the assignment of "multiVariantCaches\[index\]" from this expression.
- [ ] L374:59 · S2871 · Provide a compare function to avoid sorting elements alphabetically.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/heroData.js — 4

- [ ] L240:31 · S4123 · This "await" does not apply to a "Promise". Remove it or fix the expression.
- [ ] L249:34 · S4123 · This "await" does not apply to a "Promise". Remove it or fix the expression.
- [ ] L319:35 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.
- [ ] L340:22 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/subprocess.js — 4

- [ ] L59:9 · S4036 · Make sure the "PATH" variable only contains fixed, unwriteable directories.
- [ ] L69:15 · S4036 · Make sure the "PATH" variable only contains fixed, unwriteable directories.
- [ ] L84:16 · S4036 · Make sure the "PATH" variable only contains fixed, unwriteable directories.
- [ ] L267:49 · S8786 · Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.

### 1\. App/2. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/itemsGrid.js — 3

- [ ] L72:7 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L476:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L657:3 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/4. Importer Tab/2. Importer/importer.js — 3

- [ ] L54:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L301:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L397:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/1. Optimizer \& Multi-Hero Optimizer Tab/1. Optimizer/2. Fribbels Hero Library/fribbelsLibrary.js — 2

- [ ] L803:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.
- [ ] L946:5 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/4. Both/2. Build/1. Scripts/CheckNativeDep.js — 2

- [ ] L1:16 · S7772 · Prefer `node:fs` over `fs`.
- [ ] L3:26 · S7772 · Prefer `node:child_process` over `child_process`.

### 1\. App/4. Both/2. Build/1. Scripts/regen-installed-transitives.js — 2

- [ ] L52:67 · S2871 · Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.
- [ ] L71:47 · S7781 · Use `replaceAll()` with a string literal instead of this global regex.

### 1\. App/2. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/1. Gear Tab/heroGearMatcher.js — 1

- [ ] L119:49 · S7766 · Prefer `Math.max()` to simplify ternary expressions.

### 1\. App/2. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/2. Enhancing Tab/enhancingTab.js — 1

- [ ] L235:11 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/2. Gear \& Enhancing Tab/3. Gear/itemAugmenter.js — 1

- [ ] L41:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/4. Importer Tab/1. Scanner/scanner.js — 1

- [ ] L489:9 · S9383 · Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/2. Models/optimizationRequest.js — 1

- [ ] L8:7 · S2094 · Unexpected empty class.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/3. Services/api.js — 1

- [ ] L452:7 · S6582 · Prefer using an optional chain expression instead, as it's more concise and easier to read.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/2. Display/statPreview.js — 1

- [ ] L11:7 · S7776 · `fourPieceSets` should be a `Set`, and use `fourPieceSets.has()` to check existence or non-existence.

### 1\. App/2. Frontend/1. Source/4. JS/6. Shared/4. UI/2. Display/updater.js — 1

- [ ] L40:5 · S1135 · Complete the task associated to this "TODO" comment.

### 1\. App/4. Both/1. Webpack/webpack.config.renderer.dev.js — 1

- [ ] L154:33 · S4036 · Make sure the "PATH" variable only contains fixed, unwriteable directories.

### 1\. App/4. Both/2. Build/1. Scripts/CheckYarn.js — 1

- [ ] L1:6 · S6557 · Use the 'String#endsWith' method instead.

### 1\. App/4. Both/2. Build/1. Scripts/TypecheckReport.mjs — 1

- [ ] L55:12 · S7755 · Prefer `.at(…)` over `[….length - index]`.

### 1\. App/5. Dev Only/FileLog.js — 1

- [ ] L32:24 · S7758 · Prefer `String.fromCodePoint()` over `String.fromCharCode()`.
