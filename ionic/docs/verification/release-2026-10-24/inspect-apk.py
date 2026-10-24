"""Inspect the signed release APK without starting a development server."""
import hashlib
import json
from pathlib import Path
import zipfile

output = Path(__file__).resolve().parent
root = output.parent.parent.parent
apk = root / 'artifacts/android/event-check-in-ionic-release.apk'
with zipfile.ZipFile(apk) as archive:
    names = archive.namelist()
    config = json.loads(archive.read('assets/capacitor.config.json'))
    assert not config.get('server', {}).get('url'), config
    index = archive.read('assets/public/index.html').decode()
    assert 'id="root"' in index, index
    web_assets = [name for name in names if name.startswith('assets/public/') and not name.endswith('/')]
    assert any(name.endswith('.js') for name in web_assets)
    result = {
        'path': str(apk.relative_to(root)),
        'bytes': apk.stat().st_size,
        'mb_decimal': round(apk.stat().st_size / 1_000_000, 3),
        'mib': round(apk.stat().st_size / 1024**2, 3),
        'sha256': hashlib.sha256(apk.read_bytes()).hexdigest().upper(),
        'capacitor_config': config,
        'development_server_url': config.get('server', {}).get('url'),
        'embedded_web_asset_count': len(web_assets),
        'dex_files': [name for name in names if name.endswith('.dex')],
        'native_abis': sorted({name.split('/')[1] for name in names if name.startswith('lib/') and name.endswith('.so')}),
    }
(output / 'apk.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
(output / 'embedded-index.html').write_text(index, encoding='utf-8')
print(json.dumps(result, indent=2))
