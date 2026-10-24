"""Capture the installed demo without clearing its data or injecting touch input."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import time
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("stage", choices=["initial", "scanned", "duplicate", "restored"])
parser.add_argument("--serial", required=True)
args = parser.parse_args()
output = Path(__file__).resolve().parent
adb_path = str(Path(os.environ["ANDROID_HOME"]) / "platform-tools" / "adb.exe")
package = "it.demo.eventcheckin.kmp"


def adb(*command, binary=False):
    result = subprocess.run([adb_path, "-s", args.serial, *command], capture_output=True, timeout=45)
    if result.returncode:
        raise RuntimeError(result.stderr.decode("utf-8", "replace"))
    return result.stdout if binary else result.stdout.decode("utf-8", "replace")


def shell(*command):
    return adb("shell", *command)


restart = None
if args.stage == "restored":
    before_pid = shell("pidof", package).strip()
    shell("am", "force-stop", package)
    stopped = subprocess.run([adb_path, "-s", args.serial, "shell", "pidof", package], capture_output=True, timeout=20)
    if stopped.stdout.strip():
        raise AssertionError("Process still exists after force-stop")
    launch = shell("am", "start", "-W", "-n", f"{package}/.MainActivity")
    (output / "restart-launch.txt").write_text(launch, encoding="utf-8")
    time.sleep(2)
    restart = {"before_pid": before_pid, "pid_after_stop": None, "after_pid": shell("pidof", package).strip()}
    (output / "process-restart.json").write_text(json.dumps(restart, indent=2), encoding="utf-8")

dump_result = shell("uiautomator", "dump", "/sdcard/eventcheckin-kmp-verification.xml")
(output / f"{args.stage}-dump.txt").write_text(dump_result, encoding="utf-8")
xml = shell("cat", "/sdcard/eventcheckin-kmp-verification.xml")
(output / f"{args.stage}.xml").write_text(xml, encoding="utf-8")
texts = [n.get("text") for n in ET.fromstring(xml).iter("node") if n.get("text")]
(output / f"{args.stage}.png").write_bytes(adb("exec-out", "screencap", "-p", binary=True))
storage = subprocess.run([adb_path, "-s", args.serial, "shell", "run-as", package, "cat", "shared_prefs/event_check_in.xml"], capture_output=True, timeout=20)
ids = []
if storage.returncode == 0:
    raw_storage = storage.stdout.decode("utf-8", "replace")
    (output / f"{args.stage}-preferences.xml").write_text(raw_storage, encoding="utf-8")
    ids = sorted(n.text for n in ET.fromstring(raw_storage).findall("./set[@name='present_ids']/string"))
elif args.stage != "initial":
    raise AssertionError(storage.stderr.decode("utf-8", "replace"))
else:
    (output / "initial-storage.txt").write_text(storage.stderr.decode("utf-8", "replace"), encoding="utf-8")

record = {"stage": args.stage, "texts": texts, "present_ids": ids, "pid": shell("pidof", package).strip(), "restart": restart}
(output / f"{args.stage}-state.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
if args.stage in ("initial", "restored"):
    assert f"{len(ids)} / 6 presenti" in texts, record
elif args.stage == "scanned":
    # LazyColumn omits the header when the user scrolls down to Marco's card.
    assert "Check-in effettuato: Marco Bianchi" in texts or f"{len(ids)} / 6 presenti" in texts, record
if args.stage != "initial":
    assert "EVT-002" in ids, record
if args.stage == "restored":
    previous = json.loads((output / "scanned-state.json").read_text(encoding="utf-8"))
    assert previous["present_ids"] == ids, record
print(json.dumps(record, ensure_ascii=False, indent=2))
