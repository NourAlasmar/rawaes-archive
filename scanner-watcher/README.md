# Rawaes Scan Watcher

سكريبت يراقب مجلد على PC المكتب ويرفع أي ملف ممسوح ضوئياً تلقائياً إلى نظام روائس.

## المتطلبات

- Python 3.8+
- Windows / Mac / Linux
- اتصال إنترنت بالسيرفر

## التثبيت

```bash
# 1. ثبّت Python من python.org
# 2. ثبّت المكتبات:
pip install requests watchdog

# 3. انسخ ملف الإعدادات:
copy config.ini.example config.ini   # Windows
cp config.ini.example config.ini      # Mac/Linux

# 4. عدّل config.ini بالقيم الصحيحة
```

## التشغيل

```bash
python watcher.py
```

## التشغيل التلقائي على Windows (كخدمة)

استخدم NSSM:
```cmd
nssm install RawaesScanWatcher "C:\Python\python.exe" "C:\rawaes-watcher\watcher.py"
nssm set RawaesScanWatcher AppDirectory "C:\rawaes-watcher"
nssm start RawaesScanWatcher
```

أو عبر Task Scheduler — أنشئ مهمة تشتغل عند تسجيل الدخول.

## إعداد HP ScanJet 8270

1. ادخل واجهة الإدارة عبر المتصفح: `http://[scanner-ip]`
2. **Scan Destinations → Add Folder**
3. اختر **SMB** وأدخل مسار مجلد `C:\Scans` المشترك على PC المكتب
4. اربط زر السكانر السريع بهذه الوجهة

## استكشاف الأخطاء

- راجع ملف `watcher.log`
- تأكد من قيم `api_url` و `api_token` في config.ini
- تأكد أن المجلد `watch_folder` موجود ومشترك
