import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, FolderPlus, Search, XCircle, CheckCircle2 } from 'lucide-react';

export default function InventoryIndex({ sectors, folders: initialFolders }) {
    const [folders, setFolders] = useState(initialFolders ?? []);

    const [createData, setCreateData] = useState({
        sector_id: sectors?.[0]?.id ?? '',
        parent_id: '',
        name: '',
        name_en: '',
        description: '',
        icon: '',
        color: '',
    });
    const [creating, setCreating] = useState(false);
    const [createdFolder, setCreatedFolder] = useState(null);
    const [createError, setCreateError] = useState(null);

    const parentOptions = useMemo(() => {
        const sectorId = String(createData.sector_id || '');
        return folders
            .filter(f => String(f.sector_id) === sectorId)
            .map(f => ({ id: f.id, name: f.name }));
    }, [folders, createData.sector_id]);

    const [code, setCode] = useState('');
    const [lookup, setLookup] = useState({ loading: false, result: null, error: null });

    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const controlsRef = useRef(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    const doLookup = async (nextCode) => {
        const finalCode = (nextCode ?? code ?? '').trim();
        if (!finalCode) return;

        setLookup({ loading: true, result: null, error: null });
        try {
            const res = await axios.get('/archive/api/inventory/lookup', { params: { code: finalCode } });
            setLookup({ loading: false, result: res.data, error: null });
        } catch (e) {
            setLookup({ loading: false, result: null, error: e?.response?.data?.message ?? 'فشل البحث' });
        }
    };

    const stopCamera = () => {
        try {
            controlsRef.current?.stop?.();
        } catch {}
        controlsRef.current = null;
        setCameraOpen(false);
    };

    const startCamera = async () => {
        setCameraError(null);
        setLookup({ loading: false, result: null, error: null });

        if (!readerRef.current) readerRef.current = new BrowserQRCodeReader();

        try {
            setCameraOpen(true);
            controlsRef.current = await readerRef.current.decodeFromVideoDevice(
                undefined,
                videoRef.current,
                (result, err) => {
                    if (result?.getText) {
                        const text = result.getText();
                        if (!text) return;
                        setCode(text);
                        stopCamera();
                        doLookup(text);
                    }
                    // ignore decode errors (no QR in frame)
                }
            );
        } catch (e) {
            stopCamera();
            setCameraError('تعذر فتح الكاميرا. تأكد من السماح للمتصفح باستخدام الكاميرا.');
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const createFolder = async (e) => {
        e.preventDefault();
        setCreateError(null);
        setCreatedFolder(null);
        setCreating(true);
        try {
            const res = await axios.post('/archive/inventory/folders', createData);
            setCreatedFolder(res.data.folder);
            setFolders(prev => [{ ...res.data.folder, sector_id: createData.sector_id, parent_id: createData.parent_id || null }, ...prev]);
            setCreateData(prev => ({ ...prev, name: '', name_en: '', description: '' }));
        } catch (err) {
            setCreateError(err?.response?.data?.message ?? 'فشل إنشاء المجلد');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <Head title="الجرد" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Create Folder + QR */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-amber-500 rounded-xl text-white">
                            <FolderPlus size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">إنشاء مجلد + QR</h2>
                            <p className="text-xs text-gray-500">أنشئ مجلد جديد واطبع/الصق QR على المجلد داخل الأرشيف</p>
                        </div>
                    </div>

                    <form onSubmit={createFolder} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">القطاع</label>
                                <select
                                    value={createData.sector_id}
                                    onChange={(e) => setCreateData(d => ({ ...d, sector_id: e.target.value, parent_id: '' }))}
                                    className="w-full rounded-lg border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                >
                                    {sectors?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">داخل مجلد (اختياري)</label>
                                <select
                                    value={createData.parent_id}
                                    onChange={(e) => setCreateData(d => ({ ...d, parent_id: e.target.value }))}
                                    className="w-full rounded-lg border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                >
                                    <option value="">بدون</option>
                                    {parentOptions.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم المجلد</label>
                            <input
                                value={createData.name}
                                onChange={(e) => setCreateData(d => ({ ...d, name: e.target.value }))}
                                className="w-full rounded-lg border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                placeholder="مثال: عقود 2026"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">وصف (اختياري)</label>
                            <textarea
                                value={createData.description}
                                onChange={(e) => setCreateData(d => ({ ...d, description: e.target.value }))}
                                className="w-full rounded-lg border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                rows={2}
                                placeholder="ماذا يحتوي هذا المجلد؟"
                            />
                        </div>

                        {createError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                                {createError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 transition-colors"
                        >
                            <FolderPlus size={16} />
                            {creating ? 'جاري الإنشاء...' : 'إنشاء'}
                        </button>
                    </form>

                    {createdFolder?.qr_code && (
                        <div className="mt-5 border-t border-gray-100 pt-5">
                            <div className="flex items-start gap-4">
                                <div className="bg-white border border-gray-200 rounded-xl p-3">
                                    <QRCodeSVG value={createdFolder.qr_code} size={140} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{createdFolder.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">الصق هذا الـ QR على المجلد داخل الأرشيف</p>
                                    <p className="text-xs text-gray-400 mt-2 font-mono" dir="ltr">{createdFolder.qr_code}</p>
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="mt-3 inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                    >
                                        طباعة
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scan + Verify */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                            <Camera size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">مسح QR للتحقق</h2>
                            <p className="text-xs text-gray-500">اسكان QR الموجود على المجلد لمعرفة هل هو موجود بالنظام أم لا</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">الكود</label>
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono"
                                placeholder="الصق الكود هنا أو امسح بالكاميرا"
                                dir="ltr"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={() => doLookup()}
                                disabled={lookup.loading}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 transition-colors"
                            >
                                <Search size={16} />
                                {lookup.loading ? '...' : 'تحقق'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (cameraOpen) stopCamera();
                                    else startCamera();
                                }}
                                className={`inline-flex items-center justify-center gap-2 font-bold rounded-lg py-2.5 px-3 border transition-colors ${
                                    cameraOpen ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                                title={cameraOpen ? 'إيقاف الكاميرا' : 'فتح الكاميرا'}
                            >
                                {cameraOpen ? <XCircle size={18} /> : <Camera size={18} />}
                            </button>
                        </div>
                    </div>

                    {cameraError && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                            {cameraError}
                        </div>
                    )}

                    {cameraOpen && (
                        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black mb-4">
                            <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
                        </div>
                    )}

                    {lookup.error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                            {lookup.error}
                        </div>
                    )}

                    {lookup.result?.found === false && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                            <div className="p-2 bg-red-500 rounded-xl text-white">
                                <XCircle size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-red-700">غير موجود</p>
                                <p className="text-xs text-red-600 mt-1">لم يتم العثور على هذا الكود ضمن مجلدات النظام</p>
                            </div>
                        </div>
                    )}

                    {lookup.result?.found === true && (
                        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                            <div className="p-2 bg-emerald-600 rounded-xl text-white">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-emerald-800">موجود</p>
                                <p className="text-sm text-gray-800 mt-1">{lookup.result.folder?.path ?? lookup.result.folder?.name}</p>
                                {lookup.result.folder?.sector?.name && (
                                    <p className="text-xs text-gray-500 mt-1">القطاع: {lookup.result.folder.sector.name}</p>
                                )}
                                {lookup.result.folder?.is_active === false && (
                                    <p className="text-xs text-amber-700 mt-2">تنبيه: هذا المجلد غير نشط</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

InventoryIndex.layout = page => <ArchiveLayout title="الجرد" children={page} />;

