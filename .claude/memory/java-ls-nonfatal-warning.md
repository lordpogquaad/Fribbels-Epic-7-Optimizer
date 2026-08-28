---
name: java-ls-nonfatal-warning
description: "JDT Language Server severity-4 \"non-project file\" warning on backend .java files is the expected steady state (pom.xml source/output dirs sit outside its own basedir); don't chase it unless severity-8 errors also appear."
metadata:
  type: feedback
---

# Java LS "non-project file" warning is expected (root cause verified 2026-08-28)

The JDT Language Server shows a severity-4 warning ("HeroDb.java is a non-project file, only syntax
errors are reported" and similar) on backend `.java` files. This is the expected steady state, not a
problem to fix.

**Root cause (still true 2026-08-28):** `1. App/3. Backend/1. Source/3. XML/pom.xml` sets
`<sourceDirectory>../1. Java</sourceDirectory>` and `<directory>../target</directory>` — both
outside the pom's own directory (`3. XML/`). m2e can't create Eclipse linked resources for
out-of-basedir paths (they resolve to workspace-root-level paths Eclipse rejects), so the m2e Maven
import always fails and the invisible-project fallback (`jdt.ls-java-project`) takes over instead —
it reads pom.xml directly and resolves deps from the Maven local repo, which is why compile/type
errors still surface correctly despite the warning.

**How to apply:** when this warning appears, do **not** suggest "Java: Clean Java Language Server
Workspace" or "Java: Reload Projects" unless severity-8 errors (real import/type errors) are also
present — the severity-4 warning alone is permanent and harmless. Do not attempt to fix it by
changing `<sourceDirectory>`/`<directory>` in pom.xml — that only relocates the error. The real fix
(moving pom.xml to `1. Java/` level) is out of scope for ordinary bug-fixing sessions; this is a
structural byproduct of [[java-dual-source-tree]].
