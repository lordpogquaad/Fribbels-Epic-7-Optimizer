# Machine rules for this repo

Where this repo's tools live on Marcus's Windows machine. The global `rules/machine.md` owns the
machine-wide paths (Node, Git, Python, the config dir) and how to update them; this file holds only
what is specific to this repo. Paths as last derived on 2026-10-30: re-run the last column before
relying on one for anything version-sensitive.

| What                | Where                                                                                      | Re-derive with                                  |
| ------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Repo root           | `F:/Epic Seven Screenshots Only/New folder/Gear simulator files/Fribbels-Epic-7-Optimizer` | `git rev-parse --show-toplevel`                 |
| JDK for the backend | `C:/Program Files/Java/latest/jdk-27`, a junction the installer repoints                   | `$env:JAVA_HOME` line in `lint_java.ps1`        |
| Maven               | `1. App/3. Backend/2. Apache Maven/apache-maven-3.10.0/bin/mvn.cmd`                        | `$mvnExe` line in `lint_java.ps1`               |
| Maven repository    | `C:/Users/Marcus/.m2/repository`                                                           | `ls -d` on the path                             |
| Yarn                | Launcher in `F:/VSCode-Data/npm-global`; `packageManager` in `1. App/package.json` pins it | `where.exe yarn`; that key                      |
| Scanner capture     | Npcap at `C:/Windows/System32/Npcap`, plus `scapy` in the global Python                    | `ls -d` on the path; `python -m pip show scapy` |
| Python lint         | `ruff`, in the global Python, config `ruff.toml` at the repo root                          | `python -m ruff --version`                      |
| Runtime log         | `1. App/5. Dev Only/logs/latest.log`, plus rotations                                       | project memory `runtime-log-file`               |

## VS Code profile

This repo opens through `F:/VSCode-Data/Workspace/Poge7optimizer.code-workspace`, in the **Poge7optimizer**
profile, folder `4f1684d1` under `F:/VSCode-Data/data/User/profiles/`. The Claude profile, `52b40dcd`, is a
different profile with its own settings and enabled extensions: never read it as this repo's. Where each
setting and extension list lives, and how apply-to-all settings override a profile, is machine-wide: global
`rules/machine.md` → "VS Code settings and extensions", with `<id>` = `4f1684d1`.

## Traps on this machine

- This machine has no OpenCL, so GPU kernels cannot run here and every search uses the CPU loop. A
  GPU change is never verified by a local run.
- The Java language server shares `target/` with Maven, so with VS Code open `mvn test` can print
  "Nothing to compile" and test the language server's classes. To prove a change compiles under
  javac without `clean`, compile to a scratch folder (project memory `java-build`).
- Run one `mvn` at a time: concurrent runs collide in `target/`.
- `gh` is not installed here. Read public GitHub data with a scratch `.mjs` that calls the REST API.
- `mvn` is not on `PATH`. Use the Maven path above, or the repo scripts, which set it themselves.
- Maven plugins and JaCoCo-style agents must support the JDK above, which is newer than many tools
  test against: run one before relying on it.
