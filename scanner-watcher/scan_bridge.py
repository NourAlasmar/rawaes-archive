"""
Local HTTP Bridge that lets the browser trigger the scanner.
Runs alongside watcher.py — exposes localhost:9999/scan
"""

import logging
import os
import sys
import tempfile
import time
import threading
from pathlib import Path
from typing import Optional

log = logging.getLogger('bridge')


def scan_via_wia(output_dir: Path, color: str = 'color', dpi: int = 200, preferred_scanner: str = '') -> Optional[Path]:
    """
    Trigger a scan using Windows Image Acquisition (WIA).
    Returns the path of the saved scan, or None on failure.

    Args:
        preferred_scanner: substring of scanner name to match (case-insensitive)

    Requires: pywin32 (pip install pywin32)
    """
    try:
        import pythoncom
        from win32com.client import Dispatch
    except ImportError:
        log.error('pywin32 not installed. Run: pip install pywin32')
        return None

    pythoncom.CoInitialize()

    try:
        manager = Dispatch('WIA.DeviceManager')
        devices = manager.DeviceInfos
        if devices.Count == 0:
            log.error('No WIA scanner found. Add the scanner in Windows Settings > Printers & scanners')
            return None

        # Find scanner — match by name if specified
        device_info = None
        all_names = []
        for i in range(1, devices.Count + 1):
            d = devices(i)
            name = d.Properties('Name').Value
            all_names.append(name)
            if preferred_scanner and preferred_scanner.lower() in name.lower():
                device_info = d
                break

        if not device_info:
            if preferred_scanner:
                log.warning(f'⚠️ Scanner matching "{preferred_scanner}" not found. Available: {all_names}')
                log.warning('Falling back to first scanner')
            device_info = devices(1)

        log.info(f'🖨️ Using scanner: {device_info.Properties("Name").Value}')
        device = device_info.Connect()

        item = device.Items(1)

        # Configure scan properties
        properties_map = {
            6146: 1 if color == 'gray' else 2 if color == 'bw' else 0,  # CurrentIntent: 0=color, 1=gray, 2=bw
            6147: dpi,   # Horizontal Resolution
            6148: dpi,   # Vertical Resolution
        }

        for prop_id, value in properties_map.items():
            try:
                for prop in item.Properties:
                    if prop.PropertyID == prop_id:
                        prop.Value = value
                        break
            except Exception:
                pass

        # Transfer the image
        WIA_FORMAT_JPEG = '{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}'
        image = item.Transfer(WIA_FORMAT_JPEG)

        # Save to file
        output_dir.mkdir(parents=True, exist_ok=True)
        filename = f'scan-{int(time.time() * 1000)}.jpg'
        filepath = output_dir / filename
        image.SaveFile(str(filepath))

        log.info(f'✅ Scan saved: {filepath}')
        return filepath

    except Exception as e:
        log.error(f'❌ WIA scan error: {e}')
        return None
    finally:
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass


def list_scanners() -> list:
    """List all WIA scanners installed in Windows."""
    try:
        import pythoncom
        from win32com.client import Dispatch
    except ImportError:
        return []

    pythoncom.CoInitialize()
    try:
        manager = Dispatch('WIA.DeviceManager')
        devices = manager.DeviceInfos
        result = []
        for i in range(1, devices.Count + 1):
            d = devices(i)
            result.append({
                'id': d.DeviceID,
                'name': d.Properties('Name').Value,
            })
        return result
    except Exception as e:
        log.error(f'List scanners error: {e}')
        return []
    finally:
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass


def create_app(scan_token: str, scans_folder: Path, preferred_scanner: str = ''):
    """Create the Flask bridge application."""
    try:
        from flask import Flask, request, jsonify, send_file
        from flask_cors import CORS
    except ImportError:
        log.error('Flask not installed. Run: pip install flask flask-cors')
        return None

    app = Flask(__name__)
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        allow_headers=["Content-Type", "X-Scan-Token", "Authorization", "Access-Control-Request-Private-Network"],
        methods=["GET", "POST", "OPTIONS"],
    )

    # Add Private Network Access header for Chrome PNA policy
    @app.after_request
    def add_pna_headers(response):
        response.headers['Access-Control-Allow-Private-Network'] = 'true'
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Scan-Token, Authorization, Access-Control-Request-Private-Network'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        return response

    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'service': 'Rawaes Scan Bridge',
            'status': 'ok',
            'endpoints': ['/health', '/scanners', '/scan'],
        })

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'service': 'rawaes-scan-bridge'})

    @app.route('/scanners', methods=['GET'])
    def scanners_list():
        if request.headers.get('X-Scan-Token') != scan_token:
            return jsonify({'error': 'unauthorized'}), 401
        return jsonify({'scanners': list_scanners()})

    @app.route('/scan', methods=['POST', 'OPTIONS'])
    def scan():
        if request.method == 'OPTIONS':
            return '', 204

        if request.headers.get('X-Scan-Token') != scan_token:
            return jsonify({'error': 'unauthorized'}), 401

        body = request.get_json(silent=True) or {}
        color = body.get('color', 'color')  # color | gray | bw
        dpi = int(body.get('dpi', 200))

        log.info(f'📥 Scan request: color={color}, dpi={dpi}')

        # Use a unique temp file (not directory) to avoid cleanup issues on Windows
        import io, uuid
        tmp_dir = Path(tempfile.gettempdir()) / 'rawaes_scans'
        tmp_dir.mkdir(parents=True, exist_ok=True)

        filepath = scan_via_wia(tmp_dir, color=color, dpi=dpi, preferred_scanner=preferred_scanner)
        if not filepath or not filepath.exists():
            return jsonify({'error': 'scan_failed', 'message': 'Could not scan. Make sure scanner is on and ready.'}), 500

        try:
            # Read file into memory then delete immediately
            with open(filepath, 'rb') as f:
                data = f.read()
            try:
                filepath.unlink()
            except Exception as e:
                log.warning(f'Could not delete temp file: {e}')

            from flask import Response
            return Response(
                data,
                mimetype='image/jpeg',
                headers={
                    'Content-Disposition': f'inline; filename="{filepath.name}"',
                    'Content-Length': str(len(data)),
                },
            )
        except Exception as e:
            log.error(f'Error reading scan: {e}')
            return jsonify({'error': 'read_failed', 'message': str(e)}), 500

    return app


def run_bridge(scan_token: str, scans_folder: Path, port: int = 9999, preferred_scanner: str = ''):
    """Start the bridge in a background thread."""
    app = create_app(scan_token, scans_folder, preferred_scanner=preferred_scanner)
    if not app:
        log.warning('⚠️  Bridge disabled (Flask not installed)')
        return

    def serve():
        log.info(f'🌉 Scan Bridge running on http://localhost:{port}')
        try:
            from werkzeug.serving import make_server
            server = make_server('127.0.0.1', port, app, threaded=True)
            server.serve_forever()
        except Exception as e:
            log.error(f'Bridge crashed: {e}')

    t = threading.Thread(target=serve, daemon=True)
    t.start()
    return t
