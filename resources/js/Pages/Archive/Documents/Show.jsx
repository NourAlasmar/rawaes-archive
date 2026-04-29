import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import { QRCodeSVG } from 'qrcode.react';
import {
    FileText, Download, Edit2, Trash2, ArrowLeft, Calendar,
    Building2, User, Clock, QrCode, MapPin, Lock, Shield,
    FolderOpen, Archive, Tag, FileType, AlertTriangle, CheckCircle,
    Printer, ScanSearch, Sparkles, Loader2
} from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

function InfoRow({ icon: Icon, label, value, className = '' }) {
    if (!value && value !== 0) return null;
    return (
        <div className={`flex items-start gap-3 py-2.5 ${className}`}>
            <Icon size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
            </div>
        </div>
    );
}

const statusLabels = {
    active: { label: 'نشط', color: 'bg-green-100 text-green-700' },
    expired: { label: 'منتهي', color: 'bg-red-100 text-red-700' },
    archived: { label: 'مؤرشف', color: 'bg-gray-100 text-gray-700' },
    pending_review: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700' },
};

export default function ShowDocument({ document }) {
    const [runningOcr, setRunningOcr] = useState(false);
    const ext = document.file_extension?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';
    const isOffice = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);
    const ocrSupported = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'docx', 'doc', 'txt'].includes(ext);

    const runOcr = () => {
        setRunningOcr(true);
        router.post(`/archive/documents/${document.id}/ocr`, {}, {
            onFinish: () => setRunningOcr(false),
        });
    };

    const handleDelete = () => {
        if (confirm(`هل أنت متأكد من حذف "${document.title}"؟`)) {
            router.delete(`/archive/documents/${document.id}`);
        }
    };

    const status = statusLabels[document.status] ?? statusLabels.active;

    return (
        <>
            <Head title={document.title} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
                <Link href="/archive/documents" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ArrowLeft size={14} /> المستندات
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-medium truncate max-w-xs">{document.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Preview column */}
                <div className="lg:col-span-2">
                    {/* Header */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="p-3 bg-amber-50 rounded-xl shrink-0">
                                    <FileText size={24} className="text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl font-bold text-gray-800 mb-1 break-words">{document.title}</h1>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                        {document.document_number && (
                                            <>
                                                <span>#{document.document_number}</span>
                                                <span className="text-gray-300">·</span>
                                            </>
                                        )}
                                        <span>{document.file_extension?.toUpperCase()}</span>
                                        <span className="text-gray-300">·</span>
                                        <span dir="ltr">{formatBytes(document.file_size)}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                            {status.label}
                                        </span>
                                        {document.is_confidential && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <Lock size={11} /> سري
                                            </span>
                                        )}
                                        {document.is_expiring_soon && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                <Clock size={11} /> ينتهي قريباً
                                            </span>
                                        )}
                                        {document.is_expired && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <AlertTriangle size={11} /> منتهي
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <a
                                    href={`/archive/documents/${document.id}/download`}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download size={15} />
                                    <span className="hidden sm:inline">تحميل</span>
                                </a>
                                <Link
                                    href={`/archive/documents/${document.id}/edit`}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Edit2 size={15} />
                                    <span className="hidden sm:inline">تعديل</span>
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* File preview */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {isImage ? (
                            <img
                                src={`/archive/documents/${document.id}/preview`}
                                alt={document.title}
                                className="w-full max-h-[600px] object-contain bg-gray-50"
                            />
                        ) : isPdf ? (
                            <object
                                data={`/archive/documents/${document.id}/preview#view=FitH&toolbar=1`}
                                type="application/pdf"
                                className="w-full h-[700px]"
                            >
                                <div className="p-10 text-center">
                                    <p className="text-gray-500 mb-3">المتصفح لا يدعم عرض PDF هنا</p>
                                    <a
                                        href={`/archive/documents/${document.id}/preview`}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                                    >
                                        فتح في نافذة جديدة
                                    </a>
                                </div>
                            </object>
                        ) : isOffice ? (
                            <div className="p-10 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                                <FileText size={56} className="mx-auto text-blue-400 mb-3" />
                                <p className="font-medium text-gray-700 mb-1">ملف {ext.toUpperCase()}</p>
                                <p className="text-xs text-gray-500 mb-4">
                                    معاينة Office تحتاج رابط عام. حمّل الملف أو اقرأ النص المستخرج أدناه
                                </p>
                                <a
                                    href={`/archive/documents/${document.id}/download`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                                >
                                    <Download size={16} />
                                    تحميل الملف
                                </a>
                            </div>
                        ) : (
                            <div className="p-16 text-center">
                                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 mb-3">لا يمكن معاينة هذا النوع من الملفات</p>
                                <a
                                    href={`/archive/documents/${document.id}/download`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                                >
                                    <Download size={16} />
                                    تحميل الملف
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {document.notes && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
                            <h3 className="font-semibold text-gray-800 mb-2">ملاحظات</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{document.notes}</p>
                        </div>
                    )}

                    {/* OCR Content */}
                    {ocrSupported && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <ScanSearch size={18} className="text-purple-500" />
                                    النص المستخرج (OCR)
                                    {document.ocr_content && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                                            قابل للبحث
                                        </span>
                                    )}
                                </h3>
                                <button
                                    onClick={runOcr}
                                    disabled={runningOcr}
                                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {runningOcr
                                        ? <><Loader2 size={14} className="animate-spin" /> جاري الاستخراج...</>
                                        : <><Sparkles size={14} /> {document.ocr_content ? 'إعادة الاستخراج' : 'استخراج النص'}</>
                                    }
                                </button>
                            </div>

                            {document.ocr_content ? (
                                <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                        {document.ocr_content}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <ScanSearch size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">لم يتم استخراج النص بعد</p>
                                    <p className="text-xs mt-1">اضغط "استخراج النص" لاستخدام OCR</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">معلومات المستند</h3>
                        <div className="divide-y divide-gray-50">
                            <InfoRow icon={Archive} label="القطاع" value={document.sector?.name} />
                            <InfoRow icon={FileType} label="نوع المستند" value={document.document_type?.name} />
                            <InfoRow icon={FolderOpen} label="المجلد" value={document.folder?.name} />
                            <InfoRow icon={Building2} label="الجهة المصدرة" value={document.issuing_entity} />
                            <InfoRow icon={Calendar} label="تاريخ الإصدار" value={document.issue_date} />
                            <InfoRow icon={Clock} label="تاريخ الانتهاء" value={document.expiry_date} />
                            <InfoRow icon={MapPin} label="الموقع الفعلي" value={document.physical_location} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-800 mb-3">الرفع والتتبع</h3>
                        <div className="divide-y divide-gray-50">
                            <InfoRow icon={User} label="رفع بواسطة" value={document.uploader?.name} />
                            <InfoRow icon={Calendar} label="تاريخ الرفع" value={new Date(document.created_at).toLocaleString('en-GB')} />
                            <InfoRow icon={Calendar} label="آخر تعديل" value={new Date(document.updated_at).toLocaleString('en-GB')} />
                        </div>
                    </div>

                    {/* QR & Barcode */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <QrCode size={16} className="text-amber-500" />
                                المعرّفات
                            </h3>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                title="طباعة"
                            >
                                <Printer size={14} />
                            </button>
                        </div>

                        {document.qr_code && (
                            <div className="flex flex-col items-center bg-gray-50 rounded-lg p-4 mb-3">
                                <QRCodeSVG
                                    value={window.location.origin + '/archive/documents/' + document.id}
                                    size={140}
                                    level="M"
                                    includeMargin={false}
                                />
                                <p className="text-xs text-gray-400 mt-2 font-mono">{document.qr_code.slice(0, 12)}...</p>
                            </div>
                        )}

                        {document.barcode && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                <span className="text-gray-500">Barcode:</span>
                                <code className="font-mono text-gray-700">{document.barcode}</code>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    {document.metadata?.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Tag size={16} className="text-blue-500" />
                                بيانات إضافية
                            </h3>
                            <div className="space-y-2">
                                {document.metadata.map((m) => (
                                    <div key={m.id} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                                        <span className="text-gray-500">{m.key}</span>
                                        <span className="text-gray-800 font-medium">{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ShowDocument.layout = page => <ArchiveLayout title="عرض المستند" children={page} />;
