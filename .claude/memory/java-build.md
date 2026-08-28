---
name: java-build
description: "Exact command to rebuild the Java backend JAR, the PowerShell fallback if the script fails, where the deployed JAR actually lives, and the -Dmaven.test.skip vs -DskipTests gotcha."
metadata:
  type: reference
---

# Java backend build (verified 2026-08-28)

## Preferred: the official build script

```powershell
& "F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\1. App\1. Master\2. PS1\build_backend.ps1"
```

Compiles the JAR **and** copies it to the runtime location. Always use this — a bare Maven build
leaves the JAR in `target\` only, and the app never picks it up from there.

## Runtime JAR location (what Electron actually loads)

```
F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\1. App\1. Master\3. Jar\backend.jar
```

Confirmed present 2026-08-28. The app does not read from `target\`. **Always restart the app after
deploying a new JAR** — the backend subprocess is spawned once per app launch.

## Manual build (fallback if the script fails)

```powershell
$env:JAVA_HOME = "F:\VSCode-Data\jdk\jdk-25.0.3+9"
$mvn = "F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\1. App\3. Backend\2. Apache Maven\apache-maven-3.9.16\bin\mvn.cmd"
$pom = "F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\1. App\3. Backend\1. Source\3. XML\pom.xml"
& $mvn -f $pom clean package "-Dmaven.test.skip=true" -q
# Then manually copy target\backend-1.0.2-jar-with-dependencies.jar → 1. Master\3. Jar\backend.jar
```

Both the portable Temurin JDK 25 path and the local Maven 3.9.16 path confirmed present 2026-08-28.
The Maven wrapper (`mvnw.cmd`) fails (tries to download) — use the local Maven copy;
`build_backend.ps1` auto-downloads/manages it.

## Key gotchas

- Must quote `-Dmaven.test.skip=true` in PowerShell.
- Tests must be skipped with `-Dmaven.test.skip=true`, **not** `-DskipTests` — the latter only skips
  execution, not compilation, and test compilation fails on a missing bytedeco dependency.
- pom `<version>` is `1.0.2`; if a build script ever hardcodes a different version in the produced
  jar-with-dependencies filename, that's the mismatch to check first.
- See [[jdk25-migration-fixes]] for the JDK/Lombok/aparapi-specific build fixes, and
  [[java-dual-source-tree]] for which files under `1. Java/` actually get compiled.
