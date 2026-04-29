# Rawaes Scan Watcher + Bridge

برنامج Windows يقوم بـ:
1. **مراقبة مجلد** السكانر — أي ملف ممسوح يُرفع تلقائياً للنظام
2. **جسر محلي** — السماح للمتصفح بطلب مسح ضوئي مباشرة من الجهاز

---

## ✅ المتطلبات

- Windows 10/11
- Python 3.8+
- HP ScanJet 8270 (أو أي سكانر يدعم WIA) مُضاف في **Windows Settings → Printers & scanners**

## 🛠️ التثبيت

```cmd
pip install requests watchdog flask flask-cors pywin32 pillow
```

ثم:

```cmd
copy config.ini.example config.ini
notepad config.ini
```

عدّل القيم:
- `watch_folder` = مجلد السكانر (مثل `C:\Scans`)
- `api_url` = رابط النظام
- `api_token` = توكن API
- `device_name` = اسم الكمبيوتر
- `bridge_enabled = true` — لتفعيل المسح المباشر من المتصفح

---

## 🚀 التشغيل

```cmd
python watcher.py
```

أو دبل كلك على `start-watcher.bat`.

سيظهر في اللوغ:
```
🚀 Rawaes Scan Watcher Starting
🌐 API:      http://...
🌉 Scan Bridge running on http://localhost:9999
```

---

## 🌉 كيف يعمل الجسر؟

1. المستخدم يفتح صفحة "رفع مستند" في النظام
2. يضغط زر **"مسح ضوئي"**
3. المتصفح يرسل طلب لـ `http://localhost:9999/scan`
4. الجسر على PC يأمر السكانر بالمسح عبر WIA
5. الصورة تعود للمتصفح وتُضاف لقائمة الملفات

---

## 🔧 استكشاف الأخطاء

### "لا يمكن الاتصال بجهاز الكمبيوتر"
- تأكد من تشغيل `watcher.py`
- تأكد من `bridge_enabled = true` في config.ini
- جرّب فتح [http://localhost:9999/health](http://localhost:9999/health) في المتصفح

### "Could not scan"
- تأكد أن السكانر متصل بالكهرباء وموصول للكمبيوتر
- في **Windows Settings → Printers & scanners** يجب أن يكون السكانر ظاهراً
- شغّل تطبيق **Windows Fax and Scan** يدوياً مرة لتأكيد عمل السكانر

### "pywin32 not installed"
```cmd
pip install pywin32
python -m pywin32_postinstall -install
```

---

## 📂 الملفات المهمة

| الملف | الوصف |
|-------|--------|
| `watcher.py` | الملف الرئيسي |
| `scan_bridge.py` | الجسر بين المتصفح والسكانر |
| `config.ini` | الإعدادات |
| `start-watcher.bat` | تشغيل سريع |
| `start-watcher-hidden.vbs` | تشغيل في الخلفية بدون نافذة |
