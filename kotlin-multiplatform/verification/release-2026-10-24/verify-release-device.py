"""Release verification on the connected Android demo; never clears app data."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('stage', choices=['install', 'checked-in', 'restored', 'record', 'stop-recording'])
parser.add_argument('--serial', default='244f483d')
args = parser.parse_args()
output = Path(__file__).resolve().parent
root = output.parent.parent
adb_path = str(Path(os.environ['ANDROID_HOME']) / 'platform-tools/adb.exe')
package = 'it.demo.eventcheckin.kmp'
video_remote = '/sdcard/event-check-in-kmp-release-20261024.mp4'


def save_json(name, value):
    (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def adb(*command, binary=False, allow_failure=False, timeout=45):
    result = subprocess.run([adb_path, '-s', args.serial, *command], capture_output=True, timeout=timeout)
    if result.returncode and not allow_failure:
        raise RuntimeError(result.stderr.decode('utf-8', 'replace'))
    if binary:
        return result.stdout
    return result.stdout.decode('utf-8', 'replace')


def shell(*command, **kwargs):
    return adb('shell', *command, **kwargs)


def launch(name):
    before = time.perf_counter()
    result = shell('am', 'start', '-W', '-n', package + '/.MainActivity')
    elapsed = time.perf_counter() - before
    (output / f'{name}-launch.txt').write_text(result, encoding='utf-8')
    assert 'Status: ok' in result, result
    return {'command_seconds': round(elapsed, 3), 'android_total_time_ms': int(re.search(r'TotalTime: (\d+)', result).group(1))}


def capture(name):
    dump = shell('uiautomator', 'dump', '/sdcard/event-check-in-kmp-release.xml')
    (output / f'{name}-dump.txt').write_text(dump, encoding='utf-8')
    xml = shell('cat', '/sdcard/event-check-in-kmp-release.xml')
    (output / f'{name}.xml').write_text(xml, encoding='utf-8')
    (output / f'{name}.png').write_bytes(adb('exec-out', 'screencap', '-p', binary=True))
    texts = [n.get('text') for n in ET.fromstring(xml).iter('node') if n.get('text')]
    assert 'Scansiona QR' in texts or 'Tech Meetup 2026' in texts, texts
    state = {'texts': texts, 'pid': shell('pidof', package).strip()}
    save_json(f'{name}-state.json', state)
    print(json.dumps(state, ensure_ascii=False, indent=2))
    return state


if args.stage == 'install':
    apk = root / 'artifacts/android/event-check-in-kmp-release.apk'
    started = time.perf_counter()
    install = adb('install', '-r', str(apk), timeout=120)
    measures = {'install_seconds': round(time.perf_counter() - started, 3)}
    (output / 'install.txt').write_text(install, encoding='utf-8')
    assert 'Success' in install, install
    details = shell('dumpsys', 'package', package)
    (output / 'installed-package.txt').write_text(details, encoding='utf-8')
    flags = re.search(r'^\s*(?:pkgFlags|flags)=\[([^\]]+)\]', details, flags=re.M)
    assert flags and 'DEBUGGABLE' not in flags.group(1), flags
    installed_path = shell('pm', 'path', package).strip().splitlines()[0].removeprefix('package:')
    installed_hash = shell('sha256sum', installed_path)
    (output / 'installed-apk-sha256.txt').write_text(installed_hash, encoding='utf-8')
    assert installed_hash.split()[0].lower() == hashlib.sha256(apk.read_bytes()).hexdigest()
    reverse = adb('reverse', '--list').strip()
    save_json('no-dev-server.json', {'adb_reverse': reverse, 'launch': 'Direct Android Activity, no development server started', 'installed_flags': flags.group(1).strip()})
    assert not reverse, reverse
    shell('am', 'force-stop', package)
    measures['first_cold_launch'] = launch('release-initial')
    save_json('device-measures.json', measures)
    time.sleep(1)
    capture('release-initial')
elif args.stage == 'checked-in':
    state = capture('release-checked-in')
    assert 'Check-in effettuato: Giulia Rossi' in state['texts'] or '2 / 6 presenti' in state['texts'], state
elif args.stage == 'restored':
    before = shell('pidof', package).strip()
    shell('am', 'force-stop', package)
    after_stop = shell('pidof', package, allow_failure=True).strip()
    assert not after_stop, after_stop
    launch_measure = launch('release-restored')
    time.sleep(1)
    state = capture('release-restored')
    assert '2 / 6 presenti' in state['texts'], state
    save_json('process-restart.json', {'before_pid': before, 'pid_after_stop': None, 'after_pid': state['pid'], 'launch': launch_measure})
elif args.stage == 'record':
    existing = shell('pidof', 'screenrecord', allow_failure=True).strip()
    assert not existing, 'Another screenrecord is running'
    (root / 'build/release-recordings').mkdir(parents=True, exist_ok=True)
    with (output / 'screenrecord.txt').open('wb') as log:
        process = subprocess.Popen([adb_path, '-s', args.serial, 'shell', 'screenrecord', '--time-limit', '90', '--size', '720x1600', '--bit-rate', '2500000', video_remote], stdout=log, stderr=log)
        time.sleep(1)
        device_pid = shell('pidof', 'screenrecord').strip()
        assert device_pid.isdigit(), device_pid
        save_json('recording.json', {'device_pid': device_pid, 'remote_path': video_remote, 'started_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
        print('Recording active', flush=True)
        process.wait(timeout=100)
    adb('pull', video_remote, str(root / 'build/release-recordings/original.mp4'), timeout=90)
    print('Recording acquired', flush=True)
elif args.stage == 'stop-recording':
    record = json.loads((output / 'recording.json').read_text(encoding='utf-8'))
    current = shell('pidof', 'screenrecord', allow_failure=True).strip().split()
    if record['device_pid'] in current:
        shell('kill', '-2', record['device_pid'])
        print('Stopped this verification recording')
