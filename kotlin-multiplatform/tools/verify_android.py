"""Android acceptance smoke test using only Python's standard library and adb.

Clears data of it.eventcheckin.app. Run on a disposable demo installation.
The APK must be installed and the emulator/device unlocked, with a portrait display.
"""
import argparse
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--adb", default=str(Path(os.environ.get("ANDROID_HOME", "")) / "platform-tools" / ("adb.exe" if os.name == "nt" else "adb")))
parser.add_argument("--serial", required=True)
parser.add_argument("--output", default="verification/local")
args = parser.parse_args()
package = "it.eventcheckin.app"
output = Path(args.output)
output.mkdir(parents=True, exist_ok=True)


def adb(*command):
    return subprocess.check_output([args.adb, "-s", args.serial, *command], text=True, encoding="utf-8", errors="replace", timeout=35)


def shell(*command):
    return adb("shell", *command)


def snapshot():
    shell("uiautomator", "dump", "/sdcard/eventcheckin-window.xml")
    return ET.fromstring(shell("cat", "/sdcard/eventcheckin-window.xml"))


def wait_node(predicate, timeout=18):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root = snapshot()
        for node in root.iter("node"):
            if predicate(node):
                return node
        time.sleep(0.3)
    raise AssertionError("Element not found. Visible texts: " + repr([n.get("text") for n in root.iter("node") if n.get("text")]))


def text_node(text):
    return wait_node(lambda n: n.get("text") == text or n.get("content-desc") == text)


def tap(node):
    left, top, right, bottom = map(int, re.findall(r"\d+", node.get("bounds")))
    shell("input", "tap", str((left + right) // 2), str((top + bottom) // 2))


def screen_size():
    numbers = re.findall(r"(\d+)x(\d+)", shell("wm", "size"))[-1]
    return tuple(map(int, numbers))


width, height = screen_size()


def scroll(down=True):
    y1, y2 = (int(height * .78), int(height * .28)) if down else (int(height * .28), int(height * .78))
    shell("input", "swipe", str(width // 2), str(y1), str(width // 2), str(y2), "350")


def top():
    for _ in range(4):
        scroll(False)


def enter_code(code):
    top()
    field = wait_node(lambda n: n.get("class") == "android.widget.EditText")
    tap(field)
    shell("input", "keycombination", "113", "29")  # Ctrl+A
    shell("input", "keyevent", "67")
    shell("input", "text", code)
    shell("input", "keyevent", "4")  # dismiss keyboard
    tap(text_node("Registra check-in"))


def assert_counter(count):
    top()
    text_node(f"{count} / 6 presenti")


def find_scrolling(text):
    for _ in range(8):
        root = snapshot()
        for node in root.iter("node"):
            if node.get("text") == text:
                return node
        scroll()
    raise AssertionError(f"Cannot scroll to {text}")


def screenshot(name):
    with (output / name).open("wb") as target:
        subprocess.run([args.adb, "-s", args.serial, "exec-out", "screencap", "-p"], stdout=target, check=True, timeout=20)


def launch():
    shell("am", "start", "-W", "-n", f"{package}/.MainActivity")


shell("pm", "clear", package)
launch()
assert_counter(0)
screenshot("01-first-open.png")
print("PASS 1: first open 0 / 6", flush=True)
enter_code("EVT-001")
find_scrolling("Check-in effettuato: Giulia Rossi")
find_scrolling("Giulia Rossi")
text_node("Presente")
assert_counter(1)
screenshot("02-check-in.png")
print("PASS 2: EVT-001 -> 1 / 6, Giulia Presente", flush=True)
enter_code("EVT-001")
find_scrolling("Check-in già effettuato")
assert_counter(1)
print("PASS 3: duplicate remains 1 / 6", flush=True)
enter_code("ERR-999")
find_scrolling("QR non valido")
assert_counter(1)
print("PASS 4: invalid remains 1 / 6", flush=True)
shell("am", "force-stop", package)
launch()
assert_counter(1)
print("PASS 5: process restart retains 1 / 6", flush=True)
tap(find_scrolling("Reimposta demo"))
text_node("Reimpostare la demo?")
tap(text_node("Annulla"))
assert_counter(1)
tap(find_scrolling("Reimposta demo"))
tap(text_node("Reimposta"))
assert_counter(0)
shell("am", "force-stop", package)
launch()
assert_counter(0)
print("PASS 6: reset confirmation and durable 0 / 6", flush=True)
tap(text_node("Scansiona QR"))
tap(wait_node(lambda n: n.get("resource-id", "").endswith("permission_deny_button")))
find_scrolling("Permesso fotocamera negato. Abilitalo nelle impostazioni dell’app. Puoi inserire il codice manualmente.")
enter_code("EVT-002")
assert_counter(1)
print("PASS: manual check-in works after camera denial", flush=True)
shell("am", "force-stop", package)
shell("pm", "grant", package, "android.permission.CAMERA")
launch()
tap(text_node("Scansiona QR"))
text_node("Annulla scansione")
screenshot("03-scanner.png")
tap(text_node("Annulla scansione"))
assert_counter(1)
print("PASS: native scanner opens and cancels on emulator (real QR scan NOT VERIFIED)", flush=True)
tap(find_scrolling("Reimposta demo"))
tap(text_node("Reimposta"))
assert_counter(0)
screenshot("04-reset.png")
print("PASS: demo left at 0 / 6", flush=True)
