import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, FolderPlus, Search, XCircle, CheckCircle2, ClipboardList, Hand, Handshake, RefreshCcw } from 'lucide-react';

function formatDate(value) {
    if (!value) return '';
    try {
        return new Date(value).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return String(value);
    }
}

function Modal({ open, title, children, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 text-gray-500">
                        <XCircle size={18} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

export default function InventoryIndex({ sectors, folders: initialFolders, canManage }) {
    const [folders, setFolders] = useState(initialFolders ?? []);
    const [loadingList, setLoadingList] = useState(false);

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
    const [createdFolder, setCreatedFolder] = useState(null); // for print preview
    const [createError, setCreateError] = useState(null);

    const parentOptions = useMemo(() => {
        const sectorId = String(createData.sector_id || '');
        return folders
            .filter(f => String(f.sector_id) === sectorId)
            .map(f => ({ id: f.id, name: f.name }));
    }, [folders, createData.sector_id]);

    const [sectorFilter, setSectorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all | available | checkedout
    const [search, setSearch] = useState('');

    const filteredFolders = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (folders ?? []).filter(f => {
            if (sectorFilter && String(f.sector_id) !== String(sectorFilter)) return false;
            if (statusFilter === 'available' && f.is_checked_out) return false;
            if (statusFilter === 'checkedout' && !f.is_checked_out) return false;
            if (!q) return true;
            const hay = [
                f.name,
                f.path,
                f.inventory_code,
                f.qr_code,
                f.checked_out_to,
                f.sector?.name,
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    }, [folders, sectorFilter, statusFilter, search]);

    const [code, setCode] = useState('');
    const [lookup, setLookup] = useState({ loading: false, result: null, error: null });

    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const controlsRef = useRef(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    const [checkoutModal, setCheckoutModal] = useState({ open: false, folder: null });
    const [checkinModal, setCheckinModal] = useState({ open: false, folder: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [checkoutForm, setCheckoutForm] = useState({ to_person: '', notes: '' });
    const [checkinForm, setCheckinForm] = useState({ notes: '' });

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const res = await axios.get('/archive/api/inventory/folders');
            setFolders(res.data.folders ?? []);
        } finally {
            setLoadingList(false);
        }
    };

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
            await refreshList();
            setCreateData(prev => ({ ...prev, name: '', name_en: '', description: '' }));
        } catch (err) {
            setCreateError(err?.response?.data?.message ?? 'فشل إنشاء المجلد');
        } finally {
            setCreating(false);
        }
    };

    const openCheckout = (folder) => {
        setActionError(null);
        setCheckoutForm({ to_person: '', notes: '' });
        setCheckoutModal({ open: true, folder });
    };

    const openCheckin = (folder) => {
        setActionError(null);
        setCheckinForm({ notes: '' });
        setCheckinModal({ open: true, folder });
    };

    const submitCheckout = async () => {
        if (!checkoutModal.folder) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await axios.post(`/archive/api/inventory/folders/${checkoutModal.folder.id}/checkout`, checkoutForm);
            setCheckoutModal({ open: false, folder: null });
            await refreshList();
        } catch (e) {
            setActionError(e?.response?.data?.message ?? 'فشل التسليم');
        } finally {
            setActionLoading(false);
        }
    };

    const submitCheckin = async () => {
        if (!checkinModal.folder) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await axios.post(`/archive/api/inventory/folders/${checkinModal.folder.id}/checkin`, checkinForm);
            setCheckinModal({ open: false, folder: null });
            await refreshList();
        } catch (e) {
            setActionError(e?.response?.data?.message ?? 'فشل الاستلام');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <Head title="الجرد" />

            <div className="bg-gradient-to-l from-blue-50 via-amber-50 to-blue-50 border border-amber-200 rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl">
                        <ClipboardList size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-gray-800 text-lg">الجرد</h2>
                        <p className="text-sm text-gray-600">عرض كل المجلدات + QR والكود القصير + تسليم/استلام</p>
                    </div>
                    <button
                        onClick={refreshList}
                        disabled={loadingList}
                        className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 disabled:opacity-50"
                    >
                        <RefreshCcw size={14} />
                        تحديث
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Left: Create folder */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 xl:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-amber-500 rounded-xl text-white">
                            <FolderPlus size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">إنشاء مجلد</h3>
                            <p className="text-xs text-gray-500">سيتم توليد كود قصير + QR للمجلد</p>
                        </div>
                    </div>

                    {!canManage && (
                        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                            لا تملك صلاحية إنشاء/تسليم/استلام (تحتاج: <span className="font-mono">inventory.manage</span>)
                        </div>
                    )}

                    <form onSubmit={createFolder} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">القطاع</label>
                                <select
                                    value={createData.sector_id}
                                    onChange={(e) => setCreateData(d => ({ ...d, sector_id: e.target.value, parent_id: '' }))}
                                    className="w-full rounded-lg border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                    disabled={!canManage}
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
                                    disabled={!canManage}
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
                                disabled={!canManage}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">ملاحظات/وصف (اختياري)</label>
                            <textarea
                                value={createData.description}
                                onChange={(e) => setCreateData(d => ({ ...d, description: e.target.value }))}
                                className="w-full rounded-lg border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                                rows={2}
                                placeholder="ماذا يحتوي هذا المجلد؟"
                                disabled={!canManage}
                            />
                        </div>

                        {createError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                                {createError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={creating || !canManage}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 transition-colors"
                        >
                            <FolderPlus size={16} />
                            {creating ? 'جاري الإنشاء...' : 'إنشاء'}
                        </button>
                    </form>

                    {createdFolder?.inventory_code && (
                        <div className="mt-5 border-t border-gray-100 pt-5">
                            <div className="flex items-start gap-4">
                                <div className="bg-white border border-gray-200 rounded-xl p-3">
                                    <QRCodeSVG value={createdFolder.inventory_code} size={140} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{createdFolder.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">الكود القصير (للصق/طباعة)</p>
                                    <p className="text-xs text-gray-400 mt-2 font-mono" dir="ltr">{createdFolder.inventory_code}</p>
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

                {/* Right: Table + Scan */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 xl:col-span-2">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">بحث</label>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="اسم/مسار/كود/مستلم..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">القطاع</label>
                                <select
                                    value={sectorFilter}
                                    onChange={(e) => setSectorFilter(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">الكل</option>
                                    {sectors?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">الحالة</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="all">الكل</option>
                                    <option value="available">متاح</option>
                                    <option value="checkedout">مُسلّم</option>
                                </select>
                            </div>
                        </div>

                        {/* Scan quick verify */}
                        <div className="lg:w-[420px]">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">تحقق سريع (QR/كود)</label>
                            <div className="flex gap-2">
                                <input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="flex-1 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono"
                                    placeholder="امسح بالكاميرا أو الصق الكود"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => doLookup()}
                                    disabled={lookup.loading}
                                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg px-3"
                                >
                                    <Search size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => (cameraOpen ? stopCamera() : startCamera())}
                                    className={`inline-flex items-center justify-center font-bold rounded-lg px-3 border transition-colors ${
                                        cameraOpen ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    title={cameraOpen ? 'إيقاف الكاميرا' : 'فتح الكاميرا'}
                                >
                                    {cameraOpen ? <XCircle size={18} /> : <Camera size={18} />}
                                </button>
                            </div>

                            {cameraError && (
                                <div className="text-xs text-red-600 mt-2">{cameraError}</div>
                            )}

                            {cameraOpen && (
                                <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-black">
                                    <video ref={videoRef} className="w-full h-44 object-cover" muted playsInline />
                                </div>
                            )}

                            {lookup.result?.found === false && (
                                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                                    غير موجود
                                </div>
                            )}
                            {lookup.result?.found === true && (
                                <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                    موجود: {lookup.result.folder?.path ?? lookup.result.folder?.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="text-right p-3 font-bold">المجلد</th>
                                    <th className="text-right p-3 font-bold">القطاع</th>
                                    <th className="text-right p-3 font-bold">الكود</th>
                                    <th className="text-right p-3 font-bold">QR</th>
                                    <th className="text-right p-3 font-bold">الحالة</th>
                                    <th className="text-right p-3 font-bold">التسليم</th>
                                    <th className="text-right p-3 font-bold">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFolders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400">لا توجد نتائج</td>
                                    </tr>
                                ) : (
                                    filteredFolders.map(f => (
                                        <tr
                                            key={f.id}
                                            className={`border-t ${f.is_checked_out ? 'bg-red-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
                                        >
                                            <td className="p-3">
                                                <div className="font-bold text-gray-800">{f.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{f.path}</div>
                                            </td>
                                            <td className="p-3 text-gray-700">{f.sector?.name ?? '—'}</td>
                                            <td className="p-3">
                                                <div className="font-mono text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 inline-block" dir="ltr">
                                                    {f.inventory_code ?? f.qr_code ?? '—'}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="bg-white border border-gray-200 rounded-lg p-2 inline-block">
                                                    <QRCodeSVG value={f.inventory_code ?? f.qr_code ?? ''} size={56} />
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {f.is_checked_out ? (
                                                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">مُسلّم</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">متاح</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {f.is_checked_out ? (
                                                    <div className="text-xs text-gray-700">
                                                        <div>إلى: <span className="font-bold">{f.checked_out_to ?? '—'}</span></div>
                                                        <div className="text-gray-500 mt-1">{formatDate(f.checked_out_at)}</div>
                                                        {f.checked_out_notes && (
                                                            <div className="text-gray-500 mt-1 line-clamp-2">{f.checked_out_notes}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    {canManage ? (
                                                        f.is_checked_out ? (
                                                            <button
                                                                onClick={() => openCheckin(f)}
                                                                className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                <Hand size={14} />
                                                                استلام
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => openCheckout(f)}
                                                                className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                <Handshake size={14} />
                                                                تسليم
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-gray-400">بدون صلاحية</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal
                open={checkoutModal.open}
                title={`تسليم مجلد: ${checkoutModal.folder?.name ?? ''}`}
                onClose={() => setCheckoutModal({ open: false, folder: null })}
            >
                {actionError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                        {actionError}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">تم تسليمه إلى</label>
                        <input
                            value={checkoutForm.to_person}
                            onChange={(e) => setCheckoutForm(f => ({ ...f, to_person: e.target.value }))}
                            className="w-full rounded-lg border-gray-200 focus:border-red-500 focus:ring-red-500"
                            placeholder="اسم الشخص/الجهة"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">ملاحظات (اختياري)</label>
                        <textarea
                            value={checkoutForm.notes}
                            onChange={(e) => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full rounded-lg border-gray-200 focus:border-red-500 focus:ring-red-500"
                            rows={3}
                            placeholder="مثال: للاطلاع/مراجعة عقد..."
                        />
                    </div>
                    <button
                        onClick={submitCheckout}
                        disabled={actionLoading || !checkoutForm.to_person.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg py-2.5"
                    >
                        <Handshake size={16} />
                        {actionLoading ? '...' : 'تأكيد التسليم'}
                    </button>
                </div>
            </Modal>

            <Modal
                open={checkinModal.open}
                title={`استلام مجلد: ${checkinModal.folder?.name ?? ''}`}
                onClose={() => setCheckinModal({ open: false, folder: null })}
            >
                {actionError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                        {actionError}
                    </div>
                )}

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 text-sm">
                    <div className="text-gray-700">
                        تم تسليمه إلى: <span className="font-bold">{checkinModal.folder?.checked_out_to ?? '—'}</span>
                    </div>
                    <div className="text-gray-500 mt-1">التاريخ: {formatDate(checkinModal.folder?.checked_out_at)}</div>
                    {checkinModal.folder?.checked_out_notes && (
                        <div className="text-gray-500 mt-2">ملاحظات التسليم: {checkinModal.folder.checked_out_notes}</div>
                    )}
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">ملاحظات الاستلام (اختياري)</label>
                        <textarea
                            value={checkinForm.notes}
                            onChange={(e) => setCheckinForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                            rows={3}
                            placeholder="مثال: تم الاستلام بحالة جيدة..."
                        />
                    </div>
                    <button
                        onClick={submitCheckin}
                        disabled={actionLoading}
                        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg py-2.5"
                    >
                        <Hand size={16} />
                        {actionLoading ? '...' : 'تأكيد الاستلام'}
                    </button>
                </div>
            </Modal>
        </>
    );
}

InventoryIndex.layout = page => <ArchiveLayout title="الجرد" children={page} />;
