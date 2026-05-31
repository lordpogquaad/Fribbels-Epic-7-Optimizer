/* global Notifier, Dialog, Settings, Files, i18next, Scanner */
/* global scannerChild, itemTrackerChild, findCommandSpawn */

const fs = require('fs');
const { spawn } = require('child_process');
const treekill = require('tree-kill');

const electron = require('electron');

const ipc = electron.ipcRenderer;

const { killPortProcess } = require('kill-port-process');
// const { default: i18next } = require('i18next');

let errors = '';
let killed = false;
let initialized = false;
let child = null;
let activePort = 8130;

const defaultJavaError = `Unable to load Java. Please check that you have the <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer#installing-the-app'>64-bit version of Java 8</a> installed and restart your computer. If you already have Java installed, follow this guide to <a href='https://www.geeksforgeeks.org/how-to-set-java-path-in-windows-and-linux/amp/'>set your Java path.</a>`;

function javaversion(callback) {
    const javaSpawn = spawn('java', ['-version']);

    javaSpawn.on('error', (err) => {
        return callback(err, null);
    });

    javaSpawn.stderr.on('data', (data) => {
        const str = data.toString();

        if (str && str.includes('VM') && !str.includes('64-Bit')) {
            callback(null, false, false, true);
            return;
        }

        if (str && str.includes('not recognized')) {
            callback(null, true, false, true);
        }
    });
}

const Subprocess = {
    kill: async () => {
        try {
            await killPortProcess(activePort);
        } catch (e) {
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
        } catch (e) {
            // suppress
        }

        const maxRamGb = parseInt(
            Settings.parseNumberValue('settingMaxRamGb') || 6,
            10,
        );

        // child = spawn('java', ['-jar', '-XX:MaxRAMFraction=1', `"${Files.getDataPath() + '/jar/backend.jar'}"`], {
        child = spawn(
            'java',
            [
                '-jar',
                `-Xmx${maxRamGb}G`,
                `"${`${Files.getDataPath()}/jar/backend.jar`}"`,
            ],
            {
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
            },
        );

        let stdoutBuffer = '';
        child.stdout.on('data', (data) => {
            stdoutBuffer += data.toString();
            if (!initialized) {
                const portMatch = stdoutBuffer.match(/BACKEND_PORT:(\d+)/);
                if (portMatch) {
                    activePort = parseInt(portMatch[1], 10);
                    global.backendPort = activePort;
                    initialized = true;
                    callback();
                }
            }
        });

        setInterval(() => {
            if (child) {
                try {
                    child.stdout.write('');
                } catch (e) {
                    // suppress
                }
            }
        }, 100);

        child.on('close', (code) => {
            if (code === 0 || killed === true) {
                return;
            }

            Notifier.error(`${i18next.t('Java subprocess errors')}: ${errors}`);
            Dialog.htmlError(defaultJavaError);
        });

        child.on('error', (e) => {
            Notifier.error(`Subprocess error: ${e}`);
        });

        child.stderr.on('data', (data) => {
            const str = data.toString();

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
            const isHeroDataPayload = str.includes('lv50FiveStarFullyAwakened') ||
                str.includes('lv60SixStarFullyAwakened') ||
                str.includes('"bonusStats":') ||
                str.includes('"S1":[{') ||
                str.includes('"code":"ef');  // artifact data payload
            // Item/gear data payloads streamed via stderr by the Java backend
            const isItemDataPayload = str.includes('"substats":') ||
                str.includes('"augmentedStats":') ||
                str.includes('"reforgedStats":') ||
                str.includes('"ingameId":') ||
                str.includes('"allowedMods":') ||
                str.includes('"material":');
            const isJavaLoggerNoise = str.includes('com.fribbels') ||
                /^[A-Z][a-z]+ \d/.test(str.trim()) ||
                isHeroDataPayload ||
                isItemDataPayload;
            const isRealError = str.includes('Exception') || str.includes('Error:') || str.includes('\tat ');

            if (str.includes('aparapi')) {
                const msg = `Subprocess error. If you are using GPU acceleration, try disabling it on the settings tab.\n${str}`;
                console.error('[Backend stderr]', msg);
                Notifier.error(msg);
            } else if (isRealError) {
                // Always surface real JVM errors (stack traces, exceptions)
                console.error('[Backend stderr]', str);
                Notifier.error(`Subprocess error - ${str}`);
            } else if (!isJavaLoggerNoise) {
                // Surface unknown stderr that isn't recognized as data/logger noise
                console.warn('[Backend stderr unknown]', str);
            }

            errors += data.toString();
        });

        ipc.on('app-close', () => {
            killed = true;
            treekill(child.pid, 'SIGTERM', () => {
                ipc.send('closed');
            });
            // eslint-disable-next-line no-undef
            if (typeof scannerChild !== 'undefined' && scannerChild) scannerChild.kill();
            // eslint-disable-next-line no-undef
            if (typeof itemTrackerChild !== 'undefined' && itemTrackerChild) itemTrackerChild.kill();
            // eslint-disable-next-line no-undef
            if (typeof findCommandSpawn !== 'undefined' && findCommandSpawn) findCommandSpawn.kill();
        });

        window.onbeforeunload = () => {
            killed = true;
            treekill(child.pid, 'SIGTERM', () => {
                /* terminated */
            });
            // eslint-disable-next-line no-undef
            if (typeof scannerChild !== 'undefined' && scannerChild) scannerChild.kill();
            // eslint-disable-next-line no-undef
            if (typeof itemTrackerChild !== 'undefined' && itemTrackerChild) itemTrackerChild.kill();
            // eslint-disable-next-line no-undef
            if (typeof findCommandSpawn !== 'undefined' && findCommandSpawn) findCommandSpawn.kill();
            Scanner.end();
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
