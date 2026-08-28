/* global Notifier, Dialog, Settings, Files, i18next, Scanner */

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const treekill = require('tree-kill');

const electron = require('electron');

const ipc = electron.ipcRenderer;

const { killPortProcess } = require('kill-port-process');

let errors = '';
let killed = false;
let initialized = false;
let child = null;
let activePort = 8130;

// Use JAVA_HOME if set so the correct JRE version runs the JAR.
// The JAR is compiled with Java 25; system PATH may have an older JRE.
function getJavaBin() {
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const bin = path.join(javaHome, 'bin', 'java');
    if (fs.existsSync(bin) || fs.existsSync(bin + '.exe')) return bin;
  }
  return 'java';
}

const defaultJavaError = `Unable to load Java 25+. Please install the <a href='https://adoptium.net/'>64-bit Java 25 JRE</a>, set JAVA_HOME, and restart your computer.`;

function javaversion(callback) {
  const javaSpawn = spawn(getJavaBin(), ['-version']);

  javaSpawn.on('error', (err) => {
    return callback(err, null);
  });

  javaSpawn.stderr.on('data', (data) => {
    const str = data.toString();

    if (str?.includes('VM') && !str.includes('64-Bit')) {
      callback(null, false, false, true);
      return;
    }

    if (str?.includes('not recognized')) {
      callback(null, true, false, true);
    }
  });
}

const Subprocess = {
  kill: async () => {
    try {
      await killPortProcess(activePort);
    } catch {
      // suppress
    }
  },

  initialize: async (callback) => {
    javaversion((err, notRecognized, notCorrectVersion, not64Bit) => {
      if (err) {
        Notifier.warn('Unable to detect java version');
        return;
      }

      if (notRecognized) {
        Dialog.htmlError(defaultJavaError);
        return;
      }

      if (not64Bit) {
        Dialog.htmlError(defaultJavaError);
      }
    });

    try {
      await Subprocess.kill();
    } catch {
      // suppress
    }

    const maxRamGb = Number.parseInt(
      Settings.parseNumberValue('settingMaxRamGb') || 6,
      10,
    );

    const jvmArgs = [
      `-Xmx${maxRamGb}G`,
      // JDK 24+ restricts "native access"; aparapi's GPU path uses System.load (JNI).
      // Grant it explicitly so the optimizer runs without the native-access warning —
      // that warning's text contains "aparapi", which would otherwise trip the
      // stderr handler below into a false "Subprocess error" popup. No-op on Java 25.
      '--enable-native-access=ALL-UNNAMED',
    ];
    // Backend log verbosity, chosen centrally in 5. Dev Only/LogControl.js
    // (backendJavaLevel -> globalThis.__backendJavaLevel). Default INFO -> no flag.
    // Token is a JUL level name (letters only) so it is shell-safe under shell:true.
    const VALID_JAVA_LEVELS = [
      'OFF', 'SEVERE', 'WARNING', 'INFO', 'FINE', 'FINER', 'FINEST', 'ALL',
    ];
    const javaLevel = String(globalThis.__backendJavaLevel || 'INFO')
      .trim()
      .toUpperCase();
    if (VALID_JAVA_LEVELS.includes(javaLevel) && javaLevel !== 'INFO') {
      jvmArgs.push(`-Dcom.fribbels.level=${javaLevel}`);
    }
    jvmArgs.push('-jar', `"${Files.getJarPath()}/backend.jar"`);

    child = spawn(`"${getJavaBin()}"`, jvmArgs, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    let stdoutBuffer = '';
    let startupTimer = null;
    child.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      if (!initialized) {
        const portMatch = new RegExp(/BACKEND_PORT:(\d+)/).exec(stdoutBuffer);
        if (portMatch) {
          activePort = Number.parseInt(portMatch[1], 10);
          globalThis.backendPort = activePort;
          initialized = true;
          stdoutBuffer = '';
          clearTimeout(startupTimer);
          callback();
        }
      }
    });

    // Startup watchdog: if the backend never prints BACKEND_PORT (e.g. the jar fails
    // to launch and emits no 'close' event), don't hang the app forever — surface an
    // actionable error and unblock the caller after a timeout.
    const STARTUP_TIMEOUT_MS = 30000;
    startupTimer = setTimeout(() => {
      if (initialized) return;
      initialized = true;
      Log.error(
        '[Subprocess] backend did not report BACKEND_PORT within 30s',
      );
      Notifier.error(
        'Backend startup timed out — the optimizer engine did not start. ' +
          'Check that 64-bit Java 25 is installed, then restart the app.',
      );
      callback();
    }, STARTUP_TIMEOUT_MS);

    setInterval(() => {
      if (child) {
        try {
          child.stdin.write('');
        } catch {
          // suppress
        }
      }
    }, 100);

    child.on('close', (code) => {
      clearTimeout(startupTimer);
      if (code === 0 || killed === true) {
        return;
      }

      Notifier.error(`${i18next.t('Java subprocess errors')}: ${errors}`);
      Dialog.htmlError(defaultJavaError);

      // Unblock the caller if the backend crashed before printing its port
      if (!initialized) {
        initialized = true;
        callback();
      }
    });

    child.on('error', (e) => {
      Notifier.error(`Subprocess error: ${e}`);
    });

    child.stderr.on('data', (data) => {
      const str = data.toString();

      // Mirror EVERY backend stderr line to the console (request bodies, GPU mode, Aparapi
      // fallbacks, timings, live-streaming, errors). Toggled centrally via the backendStderr
      // switch in 5. Dev Only/LogControl.js (Log.backendStderr → globalThis.__backendStderrLog).
      if (str.trim()) {
        Log.backendStderr('[Java]', str.replace(/\s+$/, ''));
      }

      if (
        str.includes('aparapi') &&
        str.includes(
          'Ensure that OpenCL is in your PATH (windows) or in LD_LIBRARY_PATH (linux).',
        )
      ) {
        errors += data.toString();
        return;
      }

      if (str.includes('untested')) {
        errors += data.toString();
        return;
      }

      // Suppress benign Java logger output (INFO/WARNING startup messages)
      // Only show errors that look like real JVM failures
      const isHeroDataPayload =
        str.includes('lv50FiveStarFullyAwakened') ||
        str.includes('lv60SixStarFullyAwakened') ||
        str.includes('"bonusStats":') ||
        str.includes('"S1":[{') ||
        str.includes('"code":"ef') || // artifact data payload
        str.includes('"rate":') || // skill multiplier data (mid-stream chunks)
        str.includes('"targets":'); // skill multiplier data (mid-stream chunks)
      // Item/gear data payloads streamed via stderr by the Java backend
      const isItemDataPayload =
        str.includes('"substats":') ||
        str.includes('"augmentedStats":') ||
        str.includes('"reforgedStats":') ||
        str.includes('"ingameId":') ||
        str.includes('"allowedMods":') ||
        str.includes('"material":');
      // JVM diagnostic warnings (e.g. JDK 24+ native-access / sun.misc.Unsafe notices,
      // some of which name "com.aparapi") are benign — never treat them as errors.
      const isJvmWarning = /^WARNING:/.test(str.trimStart());
      const isJavaLoggerNoise =
        str.includes('com.fribbels') ||
        /^[A-Z][a-z]+ \d/.test(str.trim()) ||
        isJvmWarning ||
        isHeroDataPayload ||
        isItemDataPayload;
      const isRealError =
        str.includes('Exception') ||
        str.includes('Error:') ||
        str.includes('\tat ');

      // Only surface a GPU "Subprocess error" for an actual aparapi failure
      // (exception/stack trace or an OpenCL problem) — not for benign warnings.
      if (str.includes('aparapi') && (isRealError || str.includes('OpenCL'))) {
        const msg = `Subprocess error. If you are using GPU acceleration, try disabling it on the settings tab.\n${str}`;
        Log.error('[Backend stderr]', msg);
        Notifier.error(msg);
      } else if (isRealError) {
        // Always surface real JVM errors (stack traces, exceptions)
        Log.error('[Backend stderr]', str);
        Notifier.error(`Subprocess error - ${str}`);
      } else if (!isJavaLoggerNoise) {
        // Surface unknown stderr that isn't recognized as data/logger noise
        Log.warn('[Backend stderr unknown]', str);
      }

      errors += data.toString();
    });

    ipc.on('app-close', () => {
      killed = true;
      Scanner.kill();
      if (child) {
        treekill(child.pid, 'SIGTERM', () => {
          ipc.send('closed');
        });
      } else {
        ipc.send('closed');
      }
    });

    window.onbeforeunload = () => {
      killed = true;
      if (child) {
        treekill(child.pid, 'SIGTERM', () => {
          /* terminated */
        });
      }
      Scanner.kill();
    };

    return child;
  },

  sendString: (str) => {
    fs.writeFile('request.txt', str, (err) => {
      if (err) {
        Notifier.error('Failed to send string to subprocess');
        return;
      }

      child.stdin.setEncoding('utf-8');
      child.stdin.write(`request.txt\n`);
    });
  },
};

export default Subprocess;
