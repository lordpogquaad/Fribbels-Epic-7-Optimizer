---
name: java-dual-source-tree
description: "Backend Java source exposes each file under two paths: the numbered folders are the REAL directories, com/fribbels/* subpackages are directory symlinks to them; Main.java lives ONLY in 0. Main and is compiled from there (the old com/fribbels hardlink was removed 2026-08-28 after it silently shipped a stale Main) — search the numbered folders, not com/."
metadata: 
  node_type: memory
  type: reference
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T11:13:48.529Z
---

# Java backend dual source tree (structure verified 2026-08-28; Main.java hardlink retired the same day)

`1. App\3. Backend\1. Source\1. Java\` exposes source files under two paths simultaneously, but it
is **not symmetric** — confirmed via `ls -la`/`stat`:

- The **numbered folders are the real directories**: `0. Main`, `1. Core`, `2. Model`, `3. DB`,
  `4. Handler`, `5. Request`, `6. Response`, `7. Enums`, `8. GPU`, `10. Tests`.
- `com/fribbels/` contains **8 directory symlinks** re-exposing the numbered folders under package
  names — confirmed present 2026-08-28: `core→1. Core`, `db→3. DB`, `model→2. Model`,
  `handler→4. Handler`, `request→5. Request`, `response→6. Response`, `enums→7. Enums`,
  `gpu→8. GPU`.
- `com/fribbels/` holds **no real files** any more. `Main.java` exists only at `0. Main/Main.java`
  (package `com.fribbels`; javac accepts an explicitly listed source regardless of directory name).

`3. XML/pom.xml` sets `sourceDirectory=../1. Java` and its `maven-compiler-plugin` `<excludes>`
excludes every numbered folder **except `0. Main`** — so each subpackage is compiled once through
its `com/fribbels/*` symlink, and Main is compiled from `0. Main` (`mainClass` = `com.fribbels.Main`).

## History — why there is no com/fribbels/Main.java (2026-08-28)

It used to be a hardlink to `0. Main/Main.java`. An editor broke the link (two inodes), the
`com/fribbels/` copy went stale — missing the whole `-Dcom.fribbels.level` log-level block — and
because the pom compiled that copy, the shipped `backend.jar` silently lacked backend log-level
control ([[log-control]]). Verified by reading `Main.class` out of the jar. Fixed by removing the
`0. Main/**` exclude and deleting the stale copy; the rebuilt jar contains `com.fribbels.level` and
all tests pass. **Do not recreate a second Main.java under `com/fribbels/`** — the pom would compile
both and fail on the duplicate class, which is the intended tripwire.

## Editing implications

A file in any subpackage (`db`, `core`, `model`, ...) is **one real file** reached through a
directory symlink — editing `3. DB/Foo.java` and `com/fribbels/db/Foo.java` is editing the same
file. Nothing to break, no relinking needed. Main.java has one copy; edit `0. Main/Main.java`.

## Searching the backend

ripgrep/`grep -r`/`find` skip symlinked directories by default, so pointing a search at
`com/fribbels` misses everything in the junctioned subpackages — not data corruption, just symlink
traversal. Either search the **numbered folders** directly (real dirs), e.g.
`find "…/1. Java" -name '*.java' -not -path '*/com/*' -print0 | xargs -0 grep -Hn 'pattern'` for a
whole-tree search hitting each logical file exactly once — or follow symlinks explicitly
(`find -L`, `grep -R --follow` / ripgrep `--follow`). Never point a search at `com/fribbels` without
`-L`/`--follow`.

**IDE auto-formats Java on external change:** when a `3. Backend` `.java` file is open, the IDE's
Java formatter may re-format it shortly after an external write (reflowing long comments, wrapping
one-line `if`s). Consequences: re-Read before editing again ("file modified since read"); match
edits by content, not line number (line-range deletes are unsafe); cosmetic only, semantics
unchanged.

After any Java edit, rebuild via [[java-build]] and restart the app to load the new jar. See also
[[java-ls-nonfatal-warning]] (pom dirs outside basedir — the reason m2e import fails, separate from
this symlink structure).
