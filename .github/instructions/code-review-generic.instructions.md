---
description: "Generic code review instructions that can be customized for any project using GitHub Copilot"
applyTo: "**"
excludeAgent: ["coding-agent"]
---

# Generic Code Review Instructions

Comprehensive code review guidelines for GitHub Copilot that can be adapted to any project. These instructions follow best practices from prompt engineering and provide a structured approach to code quality, security, testing, and architecture review. To manage cognitive load, apply checks in sequential passes: first security and correctness (🔴 CRITICAL), then testing, performance, and architecture (🟡 IMPORTANT), then code quality and documentation (🟢 SUGGESTION). Drive your review from the **Review Checklist** below; the prose sections (Code Quality Standards, Security Review, etc.) are reference material providing examples and context.

## Review Language

Respond in **English** by default. If a PR description is provided and is written entirely in another language, respond in that language, including translating all template section headers (e.g., "Why this matters:", "Suggested fix:", "Reference:") and any fallback messages (e.g., "No diff available to review…", "The provided diff appears incomplete…"). Severity labels (CRITICAL, IMPORTANT, SUGGESTION) and emoji markers (🔴, 🟡, 🟢) remain in English regardless of response language. If no PR description is available or it is mixed-language, use English.

## Review Priorities

When performing a code review, prioritize issues in the following order:

### 🔴 CRITICAL (Block merge)

- **Security**: Vulnerabilities, exposed secrets, authentication/authorization issues
- **Correctness**: Logic errors, data corruption risks, race conditions
- **Breaking Changes**: API contract changes without versioning
- **Data Loss**: Risk of data loss or corruption

### 🟡 IMPORTANT (Requires discussion)

- **Code Quality**: Severe violations of SOLID principles, excessive duplication (3+ repeated logic blocks)
- **Test Coverage**: Missing tests for critical paths or new functionality
- **Performance**: Obvious performance bottlenecks (N+1 queries, memory leaks)
- **Architecture**: Significant deviations from established patterns

### 🟢 SUGGESTION (Non-blocking improvements)

- **Readability**: Poor naming, complex logic that could be simplified
- **Optimization**: Performance improvements without functional impact
- **Best Practices**: Minor deviations from conventions
- **Documentation**: Missing or incomplete comments/documentation

## General Review Principles

When performing a code review, follow these principles:

1. **Be specific**: Reference exact lines, files, and provide concrete examples
2. **Provide context**: Explain WHY something is an issue and the potential impact
3. **Suggest solutions**: Show corrected code when applicable, not just what's wrong
4. **Be constructive**: Focus on improving the code, not criticizing the author
5. **Recognize good practices**: Acknowledge well-written code and smart solutions
6. **Be pragmatic**: Mark suggestions that can be addressed in a follow-up PR with a [DEFERRABLE] tag rather than omitting them.
7. **Group related comments**: Avoid multiple comments about the same topic

## Code Quality Standards

When performing a code review, check for the following. If the code is in a language not covered by the examples below, apply the General Review Principles and Security Review sections, note in the review that language-specific checks were not performed, and skip the Project-Specific Customizations sections that do not match the file path. For configuration files (JSON, XML, YAML), check for: hardcoded secrets, schema validity, and consistency with documented config in README. For stylesheets (SCSS/CSS), apply only readability and naming checks.

### Clean Code

- Descriptive and meaningful names for variables, functions, and classes
- Single Responsibility Principle: each function/class does one thing well
- DRY (Don't Repeat Yourself): flag repeated logic blocks (3+ occurrences) as 🟡 IMPORTANT; flag minor cosmetic duplication (2 or fewer occurrences, or duplicated blocks under 5 lines that do not encode business logic) as 🟢 SUGGESTION
- Flag functions longer than 30 lines as a 🟢 SUGGESTION; flag functions longer than 60 lines as 🟡 IMPORTANT
- Flag any code nested more than 3 levels deep
- Avoid magic numbers and strings (use constants)
- Code should be self-documenting; comments only when necessary

### Examples

```javascript
// ❌ BAD: Poor naming and magic numbers
function calc(x, y) {
  if (x > 100) return y * 0.15;
  return y * 0.1;
}

// ✅ GOOD: Clear naming and constants
const PREMIUM_THRESHOLD = 100;
const PREMIUM_DISCOUNT_RATE = 0.15;
const STANDARD_DISCOUNT_RATE = 0.1;

function calculateDiscount(orderTotal, itemPrice) {
  const isPremiumOrder = orderTotal > PREMIUM_THRESHOLD;
  const discountRate = isPremiumOrder
    ? PREMIUM_DISCOUNT_RATE
    : STANDARD_DISCOUNT_RATE;
  return itemPrice * discountRate;
}
```

### Error Handling

- Proper error handling at appropriate levels
- Meaningful error messages
- No silent failures or ignored exceptions
- Fail fast: validate inputs early
- Use appropriate error types/exceptions

### Examples

```python
# ❌ BAD: Silent failure and generic error
def process_user(user_id):
    try:
        user = db.get(user_id)
        user.process()
    except:
        pass

# ✅ GOOD: Explicit error handling
def process_user(user_id):
    if not user_id or user_id <= 0:
        raise ValueError(f"Invalid user_id: {user_id}")

    try:
        user = db.get(user_id)
    except UserNotFoundError:
        raise UserNotFoundError(f"User {user_id} not found in database")
    except DatabaseError as e:
        raise ProcessingError(f"Failed to retrieve user {user_id}: {e}")

    return user.process()
```

## Security Review

When performing a code review, check for security issues:

- **Sensitive Data**: No passwords, API keys, tokens, or PII in code or logs
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection**: Use parameterized queries, never string concatenation
- **Authentication**: Proper authentication checks before accessing resources
- **Authorization**: Verify user has permission to perform action
- **Cryptography**: Use established libraries, never roll your own crypto
- **Dependency Security**: Check for known vulnerabilities in dependencies

### Examples

```java
// ❌ BAD: SQL injection vulnerability
String query = "SELECT * FROM users WHERE email = '" + email + "'";

// ✅ GOOD: Parameterized query
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ?"
);
stmt.setString(1, email);
```

```javascript
// ❌ BAD: Exposed secret in code
const API_KEY = "sk_live_abc123xyz789";

// ✅ GOOD: Use environment variables
const API_KEY = process.env.API_KEY;
```

## Testing Standards

When performing a code review, verify test quality:

- **Coverage**: Critical paths and new functionality must have tests. If you cannot determine whether code is on a critical path, default to treating optimizer algorithm changes, gear import/export, scanner integration, and stat calculations as critical paths.
- **Test Names**: Descriptive names that explain what is being tested
- **Test Structure**: Clear Arrange-Act-Assert or Given-When-Then pattern
- **Independence**: Tests should not depend on each other or external state
- **Assertions**: Use specific assertions, avoid generic assertTrue/assertFalse
- **Edge Cases**: Test boundary conditions, null values, empty collections
- **Mock Appropriately**: Mock external dependencies, not domain logic

### Examples

```typescript
// ❌ BAD: Vague name and assertion
test("test1", () => {
  const result = calc(5, 10);
  expect(result).toBeTruthy();
});

// ✅ GOOD: Descriptive name and specific assertion
test("should calculate 10% discount for orders under $100", () => {
  const orderTotal = 50;
  const itemPrice = 20;

  const discount = calculateDiscount(orderTotal, itemPrice);

  expect(discount).toBe(2.0);
});
```

## Performance Considerations

When performing a code review, check for performance issues:

- **Database Queries**: Avoid N+1 queries, use proper indexing
- **Algorithms**: Appropriate time/space complexity for the use case
- **Caching**: Utilize caching for expensive or repeated operations
- **Resource Management**: Proper cleanup of connections, files, streams
- **Pagination**: Large result sets should be paginated
- **Lazy Loading**: Load data only when needed

### Examples

```python
# ❌ BAD: N+1 query problem
users = User.query.all()
for user in users:
    orders = Order.query.filter_by(user_id=user.id).all()  # N+1!

# ✅ GOOD: Use JOIN or eager loading
users = User.query.options(joinedload(User.orders)).all()
for user in users:
    orders = user.orders
```

## Architecture and Design

When performing a code review, verify architectural principles:

- **Separation of Concerns**: Clear boundaries between layers/modules
- **Dependency Direction**: High-level modules don't depend on low-level details
- **Interface Segregation**: Prefer small, focused interfaces
- **Loose Coupling**: Components should be independently testable
- **High Cohesion**: Related functionality grouped together
- **Consistent Patterns**: Follow established patterns in the codebase

## Documentation Standards

When performing a code review, check documentation:

- **API Documentation**: Public APIs must be documented (purpose, parameters, returns)
- **Complex Logic**: Non-obvious logic should have explanatory comments
- **README Updates**: Update README when adding features or changing setup
- **Breaking Changes**: Document any breaking changes clearly
- **Examples**: Provide usage examples for complex features

## Comment Format Template

When performing a code review, structure your overall output as follows: begin with a 1–3 sentence summary of the overall assessment, then list findings grouped by severity (🔴 first, then 🟡, then 🟢), organized per file. Use the comment format below for each individual finding:

```markdown
**[PRIORITY] Category: Brief title**

Detailed description of the issue or suggestion.

**Why this matters:**
Explanation of the impact or reason for the suggestion.

**Suggested fix:**
[code example if applicable]

**Reference:** [link to relevant documentation or standard]
```

### Example Comments

#### Critical Issue

````markdown
**🔴 CRITICAL - Security: SQL Injection Vulnerability**

The query on line 45 concatenates user input directly into the SQL string,
creating a SQL injection vulnerability.

**Why this matters:**
An attacker could manipulate the email parameter to execute arbitrary SQL commands,
potentially exposing or deleting all database data.

**Suggested fix:**

```sql
-- Instead of:
query = "SELECT * FROM users WHERE email = '" + email + "'"

-- Use:
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ?"
);
stmt.setString(1, email);
```

**Reference:** OWASP SQL Injection Prevention Cheat Sheet
````

#### Important Issue

````markdown
**🟡 IMPORTANT - Testing: Missing test coverage for critical path**

The `processPayment()` function handles financial transactions but has no tests
for the refund scenario.

**Why this matters:**
Refunds involve money movement and should be thoroughly tested to prevent
financial errors or data inconsistencies.

**Suggested fix:**
Add test case:

```javascript
test("should process full refund when order is cancelled", () => {
  const order = createOrder({ total: 100, status: "cancelled" });

  const result = processPayment(order, { type: "refund" });

  expect(result.refundAmount).toBe(100);
  expect(result.status).toBe("refunded");
});
```
````

#### Suggestion

````markdown
**🟢 SUGGESTION - Readability: Simplify nested conditionals**

The nested if statements on lines 30-40 make the logic hard to follow.

**Why this matters:**
Simpler code is easier to maintain, debug, and test.

**Suggested fix:**

```javascript
// Instead of nested ifs:
if (user) {
  if (user.isActive) {
    if (user.hasPermission("write")) {
      // do something
    }
  }
}

// Consider guard clauses:
if (!user || !user.isActive || !user.hasPermission("write")) {
  return;
}
// do something
```
````

## Review Checklist

When performing a code review, follow this decision flow in order before running the checklist:

1. **No diff provided** → Respond with: "No diff available to review. Please provide the changed files." and stop.
2. **Diff is provided but unreadable or appears truncated** → Respond with: "The provided diff appears incomplete or malformed. Please provide a complete diff." and stop.
3. **Diff contains only whitespace, comments, or generated artifacts** (files matching `data/jar/**`, `dist/**`, `**/*.lock`, `**/*.min.js`, `**/node_modules/**`) → Respond with a single statement that no substantive review is needed and stop.
4. **Binary files** (images, fonts, compiled assets) appearing in the diff → Note that the file changed and skip content review for those files.
5. **Run mandatory pass first**: Check all Security checklist items and all project-specific 🔴 rules before any other category.
6. **Determine review mode**:
   - **Condensed mode** (diff is ≤ 20 lines affecting a single file): Cover only categories with findings; omit empty categories.
   - **Full mode** (all other diffs): For every category, if no issues are found, explicitly state "No issues found in [category]" rather than omitting the section.
7. **Apply remaining checklist** using the selected mode's formatting rules:

### Code Quality

- [ ] Code follows consistent style and conventions
- [ ] Names are descriptive and follow naming conventions
- [ ] Functions/methods are small and focused
- [ ] No repeated logic blocks (3+ occurrences = 🟡 IMPORTANT; minor cosmetic duplication = 🟢 SUGGESTION)
- [ ] Complex logic is broken into simpler parts
- [ ] Error handling is appropriate
- [ ] No commented-out code or TODO without tickets

### Security

- [ ] No sensitive data in code or logs
- [ ] Input validation on all user inputs
- [ ] No SQL injection vulnerabilities
- [ ] Authentication and authorization properly implemented
- [ ] Dependencies are up-to-date and secure

### Testing

- [ ] New code has appropriate test coverage
- [ ] Tests are well-named and focused
- [ ] Tests cover edge cases and error scenarios
- [ ] Tests are independent and deterministic
- [ ] No tests that always pass or are commented out

### Performance

- [ ] No obvious performance issues (N+1, memory leaks)
- [ ] Appropriate use of caching
- [ ] Efficient algorithms and data structures
- [ ] Proper resource cleanup

### Architecture

- [ ] Follows established patterns and conventions
- [ ] Proper separation of concerns
- [ ] No architectural violations
- [ ] Dependencies flow in correct direction

### Documentation

- [ ] Public APIs are documented
- [ ] Complex logic has explanatory comments
- [ ] README is updated if needed
- [ ] Breaking changes are documented

## Project-Specific Customizations

When a project-specific rule and a general rule address the same issue, use the project-specific rule's wording. Severity labels are never downgraded: if either source labels an issue 🔴, treat it as 🔴. When two rules apply to the same line, report the issue once under the higher severity label and cite both rule sources. When a file matches multiple project-specific sections, apply all matching rule sets; when rules conflict, use the highest severity and cite both sources. If a referenced file is not available in the review context, still emit the finding at its original severity, append [DEFERRABLE] to the title, and state explicitly which referenced file was unavailable. When PR metadata is available and exceeds 500 changed lines or 20 files, restrict the review to files matching these paths: `app/js/lib/**`, `backend/src/**`, `app/main.dev.js`. If none of the changed files match those paths, fall back to reviewing the 10 largest changed files and explicitly state that other files were not reviewed. If PR size is unknown, review the visible diff in full.

### React / Electron Frontend Checks

For files matching `app/**/*.tsx`, `app/**/*.ts`, `app/js/**`, `app/main.dev.js`:

- 🔴 CRITICAL: Electron IPC handlers in `main.dev.js` must validate all renderer-supplied arguments before use
- 🟡 IMPORTANT: React hooks must follow the rules of hooks (no conditional hook calls)
- 🟡 IMPORTANT: Redux state mutations must go through RTK `createSlice` reducers, never directly
- 🟡 IMPORTANT: `useSelector` selectors must be memoized when selecting derived/computed data
- 🟡 IMPORTANT: i18next translation keys must exist in all locale files under `data/locales/` when new strings are added
- 🟡 IMPORTANT: React components in `app/js/` must not directly mutate props or external state

### Java Backend Checks

For files matching `backend/src/**/*.java`:

- 🔴 CRITICAL: All Java optimization logic must use parameterized data structures, never raw string concatenation for query-like operations
- 🔴 CRITICAL: Gson/Jackson deserialization must validate input types and sizes before processing (user-uploaded gear JSON can be adversarial)
- 🟡 IMPORTANT: JUnit 5 tests must exist for any new optimization algorithm changes
- 🟡 IMPORTANT: Java 8 compatibility must be maintained (no Java 9+ APIs like `List.of()`, `Map.copyOf()`, `var` keyword)
- 🟡 IMPORTANT: Guava collections are preferred over raw arrays for gear set combinations and filter logic

### Gear Optimizer Business Logic

For files matching `app/js/lib/**`:

- 🔴 CRITICAL: Filter changes in `forceFilter.js`, `modificationFilter.js`, or `priorityFilter.js` must not silently drop valid gear items
- 🔴 CRITICAL: Gear import/export functions in `importer.js` and `itemSerializer.js` must handle malformed JSON gracefully with user-visible error messages
- 🔴 CRITICAL: Scanner integration in `scanner.js` and `locator.js` must handle OCR failure states without crashing the app
- 🟡 IMPORTANT: Flag any changes to stat calculation functions for human verification against in-game Epic Seven formulas; do not assert correctness yourself unless the change is purely refactoring — meaning no changes to numeric literals, operators, conditionals, or function signatures, only renames, extractions, and formatting (compare against `app/js/lib/damageCalc.js` patterns if available in context)
- 🟡 IMPORTANT: Reforge calculations in `reforge.js` must account for all reforge tiers and must not hard-code tier-specific values as magic numbers

### Build and Packaging

For files matching `configs/**`, `package.json`, `app/package.json`, `backend/pom.xml`:

- 🔴 CRITICAL: Backend Java JAR in `data/jar/` must be rebuilt and committed when `1. App/3. Backend/` source changes
- � CRITICAL: When `backend/src/**` changes are present in the diff but no corresponding `data/jar/*.jar` change is included, raise a 🔴 finding requesting the JAR be rebuilt and committed — even though `data/jar/**` files are otherwise skipped from content review
- �🟡 IMPORTANT: Webpack config changes in `configs/` must not break the production build (`webpack.config.renderer.prod.babel.js`)
- 🟡 IMPORTANT: New npm dependencies must not be duplicated between root `package.json` and `app/package.json`
- 🟡 IMPORTANT: Electron builder config (`app/package.json`) must be updated if new native modules are added
- 🟢 SUGGESTION: Skip entirely files matching `data/jar/**`, `dist/**`, `**/*.lock`, `**/*.min.js`, and `**/node_modules/**` — do not review these. For other generated artifacts (`data/jar/*.jar`, `package-lock.json`, `dist/`), only verify they were regenerated consistently with their sources.

## Additional Resources

For more information on effective code reviews and GitHub Copilot customization:

- [GitHub Copilot Prompt Engineering](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering)
- [GitHub Copilot Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Awesome GitHub Copilot Repository](https://github.com/github/awesome-copilot)
- [GitHub Code Review Guidelines](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests)
- [Google Engineering Practices - Code Review](https://google.github.io/eng-practices/review/)
- [OWASP Security Guidelines](https://owasp.org/)

## Prompt Engineering Tips

When performing a code review, apply these prompt engineering principles from the [GitHub Copilot documentation](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering). The severity-based ordering (🔴 → 🟡 → 🟢) defined in the introduction is authoritative; the tips below are supplementary guidance only:

1. **Start General, Then Get Specific**: Begin with high-level architecture review, then drill into implementation details
2. **Give Examples**: Reference similar patterns in the codebase when suggesting changes
3. **Break Complex Tasks**: Review large PRs in logical chunks, grouping findings by severity (🔴 → 🟡 → 🟢)
4. **Avoid Ambiguity**: Be specific about which file, line, and issue you're addressing
5. **Indicate Relevant Code**: Reference related code that might be affected by changes
6. **Experiment and Iterate**: If initial review misses something, review again with focused questions

## Project Context

- **Project**: Fribbels Epic Seven Gear Optimizer — desktop Electron app that optimizes gear builds for the mobile game Epic Seven
- **Frontend**: React 19, Redux Toolkit 2.x, React Router DOM 7, TypeScript 6, Webpack 5, Electron 42, i18next, SASS
- **Backend**: Java 8 (Maven), Gson, Jackson Jr, Guava, Apache Commons, JUnit Jupiter 5
- **Build Tools**: Webpack (renderer), Babel, Maven (Java JAR), `electron-builder` for packaging
- **Testing**: Jest 30 (frontend unit tests), JUnit 5 (backend), TestCafe (E2E)
- **Linting**: ESLint with Airbnb config + TypeScript rules, Prettier, Stylelint
- **Key subsystems**: Gear scanner (OCR via Tesseract/Leptonica), gear optimizer algorithm (Java), damage calculator, reforge calculator, stat filters, localization (8 languages)
