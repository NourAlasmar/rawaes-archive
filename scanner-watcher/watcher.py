"""
Rawaes Scan Watcher
====================
Watches a folder for new scanned files and uploads them to the Rawaes archive.

Setup:
1. Edit config.ini with your settings
2. Install: pip install requests watchdog
3. Run: python watcher.py
4. (Windows) Use task scheduler or NSSM to run as service

Compatible with HP ScanJet 8270 "Scan to Folder" feature.
"""

import os
import time
import sys
import configparser
import logging
import threading
from pathlib import Path
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ────────────── CONFIG ──────────────
config = configparser.ConfigParser()
config_path = Path(__file__).parent / 'config.ini'

if not config_path.exists():
    print('❌ config.ini not found! Copy config.ini.example to config.ini and edit it.')
    sys.exit(1)

config.read(config_path, encoding='utf-8')
WATCH_FOLDER = config.get('main', 'watch_folder')
API_URL = config.get('main', 'api_url').rstrip('/')
API_TOKEN = config.get('main', 'api_token')
DEVICE_NAME = config.get('main', 'device_name', fallback='Scanner-PC')
PROCESSED_FOLDER = config.get('main', 'processed_folder', fallback='processed')
ALLOWED_EXTS = {'.pdf', '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp'}

# ────────────── LOGGING ──────────────
log_file = Path(__file__).parent / 'watcher.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.FileHandler(log_file, encoding='utf-8'), logging.StreamHandler()],
)
log = logging.getLogger('watcher')


# ────────────── UPLOAD ──────────────
def upload_file(filepath: Path, retry: int = 3) -> bool:
    """Upload one scanned file to the Rawaes API."""
    if not filepath.exists() or filepath.stat().st_size == 0:
        return False

    log.info(f'📤 Uploading: {filepath.name} ({filepath.stat().st_size} bytes)')

    for attempt in range(1, retry + 1):
        try:
            with open(filepath, 'rb') as f:
                response = requests.post(
                    f'{API_URL}/api/scans/upload',
                    headers={'X-Scan-Token': API_TOKEN, 'Accept': 'application/json'},
                    files={'file': (filepath.name, f, 'application/octet-stream')},
                    data={'device': DEVICE_NAME, 'original_name': filepath.name},
                    timeout=120,
                )

            if response.status_code == 200:
                log.info(f'✅ Uploaded successfully: {filepath.name}')
                return True
            else:
                log.error(f'❌ Server error {response.status_code}: {response.text[:200]}')

        except requests.RequestException as e:
            log.warning(f'🔄 Attempt {attempt}/{retry} failed: {e}')
            if attempt < retry:
                time.sleep(5 * attempt)

    return False


def move_to_processed(filepath: Path):
    """Move successfully uploaded file to a 'processed' subfolder."""
    processed_dir = filepath.parent / PROCESSED_FOLDER
    processed_dir.mkdir(exist_ok=True)
    new_path = processed_dir / f'{int(time.time())}-{filepath.name}'
    try:
        filepath.rename(new_path)
        log.info(f'📁 Moved to processed: {new_path.name}')
    except Exception as e:
        log.error(f'⚠️  Could not move file: {e}')


def process_file(filepath: Path):
    """Wait for file to stabilize then upload."""
    if filepath.suffix.lower() not in ALLOWED_EXTS:
        log.debug(f'Ignoring non-scan file: {filepath.name}')
        return

    # Wait for file to finish writing (stability check)
    last_size = -1
    for _ in range(30):
        try:
            current_size = filepath.stat().st_size
            if current_size > 0 and current_size == last_size:
                break
            last_size = current_size
        except FileNotFoundError:
            return
        time.sleep(1)

    if upload_file(filepath):
        move_to_processed(filepath)


# ────────────── EVENT HANDLER ──────────────
class ScanHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        threading.Thread(target=process_file, args=(Path(event.src_path),), daemon=True).start()

    def on_moved(self, event):
        if event.is_directory:
            return
        threading.Thread(target=process_file, args=(Path(event.dest_path),), daemon=True).start()


# ────────────── STARTUP CHECKS ──────────────
def health_check():
    """Verify the API is reachable and token is valid."""
    log.info(f'🔍 Connecting to {API_URL}...')
    try:
        r = requests.get(
            f'{API_URL}/api/scans/ping',
            headers={'X-Scan-Token': API_TOKEN},
            timeout=10,
        )
        if r.status_code == 200:
            log.info('✅ API connection OK')
            return True
        elif r.status_code == 401:
            log.error('❌ Invalid API token! Check config.ini')
        else:
            log.error(f'❌ API returned {r.status_code}: {r.text[:200]}')
    except Exception as e:
        log.error(f'❌ Cannot reach API: {e}')
    return False


def process_existing_files(folder: Path):
    """Process any files already in the folder on startup."""
    log.info(f'🔎 Scanning existing files in {folder}...')
    for entry in folder.iterdir():
        if entry.is_file() and entry.suffix.lower() in ALLOWED_EXTS:
            log.info(f'   Found: {entry.name}')
            threading.Thread(target=process_file, args=(entry,), daemon=True).start()


# ────────────── MAIN ──────────────
def main():
    folder = Path(WATCH_FOLDER)
    if not folder.exists():
        log.error(f'❌ Watch folder does not exist: {folder}')
        sys.exit(1)

    log.info('═' * 50)
    log.info('🚀 Rawaes Scan Watcher Starting')
    log.info(f'📁 Watching: {folder}')
    log.info(f'🌐 API:      {API_URL}')
    log.info(f'💻 Device:   {DEVICE_NAME}')
    log.info('═' * 50)

    if not health_check():
        log.warning('⚠️  Will keep retrying in background...')

    process_existing_files(folder)

    observer = Observer()
    observer.schedule(ScanHandler(), str(folder), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        log.info('🛑 Stopping watcher...')
        observer.stop()
    observer.join()


if __name__ == '__main__':
    main()
