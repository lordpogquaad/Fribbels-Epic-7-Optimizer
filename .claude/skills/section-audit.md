# Section audit — the shared flow

The four `/audit-<section>` skills share this file. Each `SKILL.md` supplies the section's scope, tool
pass, checks and exclusions; this file owns the modes, the flow, the agent contract and the report.
The section agents read "Agent contract" when a brief names an audit.

## Purpose

An audit looks for real problems in the section's code and for anything hiding them, such as a check
that cannot fail, a swallowed error or a rule switched off. It reports and files what it finds. It
changes no source: fixes happen afterwards, on Marcus's go, as ordinary section work.

## Modes

```text
/audit-<section>               tool pass, then one <section>-sonnet per shard
/audit-<section> drift         tool pass only: inline, no agents
/audit-<section> deep [paths]  tool pass, then one <section>-opus per shard; explicit only
```

Paths after `deep` narrow the scope to those files or folders. Typing the command is the go for its
agents, so the lead does not stop for approval.

## Standing rules

- **Read-only.** The only tracked files an audit writes are `.claude/plans/FIX LIST.md` and
  `.claude/plans/LEDGER.md`. Agent memory is the one other write, and each agent lists it.
- **No tracked output.** `yarn scan`, the `*:report` scripts and `build_backend.ps1` rewrite tracked
  reports or `backend.jar`, so an audit never runs them. The tool passes use only commands that write
  ignored output.
- **A tool that did not run is not clean.** Give every tool its real exit status. A tool that exits
  outside the codes its section lists, cannot start, or stops before its summary is a finding, never
  zero findings.

## Flow

1. **Known work.** Read the section's table in `.claude/plans/FIX LIST.md`, plus Repo-wide and Tests,
   so a finding that is already a row is reported by its id rather than filed twice.
2. **Tool pass.** Run each command in the section's tool pass in Bash, from `1. App/` unless it says
   otherwise, and redirect it to the session scratchpad:
   `cmd > <scratchpad>/<name>.txt 2>&1; echo "RC $?"`. Read the files selectively and group hits by
   file and rule. `drift` mode goes from here to step 5's `git status` check, then step 6.
3. **Shard.** List the scope with `git ls-files` from the repo root, apply the section's exclusions,
   drop binary files, and cut shards along the section's folder lines so related files stay together.
   Run at most four agents at once; further shards wait for a free slot. Say how many shards there are
   before dispatching them.
4. **Dispatch.** One `<section>-sonnet` per shard, or `<section>-opus` in `deep` mode. Each brief
   carries:

   ```text
   audit: /audit-<section> <standard|deep>
   files: <the exact file list>
   tool hits: <this shard's hits from step 2, by file and rule>
   known rows: <fix-list ids touching these files>
   checks: <the section's "What the agents check">
   not run: <the section's "Not run in an audit">
   ```

5. **Consolidate.** Each shard's coverage line must read N of N for the list sent; send any file it
   names as unread out again. Verify each high-severity finding against the code yourself before
   presenting it. Run `git status --short` afterwards: anything changed beyond agent memory is a
   contract breach to report.
6. **File.** Add each `verified` finding that has no row to its area's table in `FIX LIST.md`, with
   the next free id and status `later`, and put `inferred` findings in the report and the ledger entry
   for Marcus to rule on. Add one dated entry to `LEDGER.md`: the section, mode, tool results, shards,
   and the ids filed. Raw tool counts go in that entry, not in rows. A clean pass gets an entry too,
   so nobody repeats it.
7. **Report.** Use the format below. Commit only when Marcus says so.

## Agent contract

When your brief names an audit, this replaces steps 3 to 6 of your Process and your Gates section:

- Make no edits to source, config, the fix list or the ledger, and run no build. Your agent memory is
  the only file you write. Scouts stay read-only too. Everything under Limits still holds, and the
  `mvn clean` exception there does not apply, because you run no build.
- Read every assigned file, then follow each tool hit and each check in the brief to the code that
  decides it. Trace a suspect across files where it matters, including outside your list.
- Report every supported finding, tagged with severity and confidence. Do not filter by either: the
  lead filters later. A finding that is already a known row needs only the id and any new evidence.
- An audit changes no scoring behaviour, so report a scoring or damage problem and leave the numbers
  alone. Before calling a gear formula or numeric constant wrong, compare it with in-game values and
  say what you compared, or mark it `inferred`.
- Report cache opportunities: repeated work in the app, such as an optimizer search or a data load, or
  in a repo command, that a cache would speed up. Give each as a `low` finding starting `cache:`, with
  what is repeated, what must invalidate the cache and what a stale entry would show, and keep it out
  of the `verified` count unless you measured the gain. A cache that could return wrong results or
  hide a finding is a risk to state, not a recommendation.
- Nothing is masked in an audit. A tool hit you judge false goes under Findings as
  `false-report? — <file and rule> — <evidence>`, never silently dropped: Marcus judges each one.
- A check you cannot run, including anything in the brief's `not run` field, goes under Verification
  as NOT RUN with what would settle it, never as a confirmed finding.
- Use your Required return as written, with these details:
  - Findings: `<severity> · <confidence> — <file and symbol> — <problem, evidence, observable effect>`.
    Severity: `high` gives wrong results, loses data or breaks a feature; `medium` fails in a real but
    narrower case, or hides a problem; `low` is a maintainability or minor defect. Confidence:
    `verified` (seen in code or a run) or `inferred` (reasoned from code). Add `known: <id>` when a
    row exists.
  - Changed: `None`. A memory note goes under Memory.
  - Verification: one line `Coverage: N of N files read`, naming any file not read and why, then the
    checks you ran.
- Cite a symbol and file rather than a bare line number where you can.

## Report

```text
/audit-<section> <mode> — <one-sentence verdict>

Tools
| tool | RC | findings | note |

Findings, most severe first
| id or new | severity · confidence | file and symbol | problem | verified by |

Coverage: N of N files, in M shards (or: drift mode, no agents)
Filed: <new ids>, ledger entry <date>
Suspected false reports: <each with its evidence, or none>
Not run: <each check skipped, and why>
Next: deep not needed | recommend /audit-<section> deep <paths>, with the evidence
```

`drift` mode ends `Next:` with `recommend a bare /audit-<section>` whenever the tool pass found
something only an agent can judge.
