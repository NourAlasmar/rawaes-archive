import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import {
    FileText, Download, Calendar, TrendingUp, HardDrive,
    AlertTriangle, Clock, Archive, Users, Activity, Filter
} from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

function BarChart({ data, labelKey = 'name', valueKey = 'count', color = 'bg-amber-500' }) {
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="space-y-2.5">
            {data.length > 0 ? data.slice(0, 8).map((item, i) => (
                <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate ml-2">{item[labelKey]}</span>
                        <span className="text-xs text-gray-500 font-medium">{item[valueKey]}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${color} rounded-full transition-all`}
                            style={{ width: `${(item[valueKey] / max) * 100}%` }}
                        />
                    </div>
                </div>
            )) : <p className="text-center text-gray-400 text-sm py-6">لا توجد بيانات</p>}
        </div>
    );
}

const actionLabels = {
    upload: 'رفع',
    view: 'استعراض',
    download: 'تحميل',
    update: 'تعديل',
    delete: 'حذف',
    create_user: 'إنشاء مستخدم',
    update_user: 'تعديل مستخدم',
};

export default function ReportsIndex({ filters, totals, uploadsTrend, bySector, byType, topUploaders, activityCounts }) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilters = () => {
        router.get('/reports', { from, to }, { preserveState: true });
    };

    const exportUrl = `/reports/export?from=${filters.from}&to=${filters.to}`;

    return (
        <>
            <Head title="التقارير" />

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Filter size={16} />
                        <span className="font-medium">تصفية بالتاريخ:</span>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">من</label>
                        <input
                            type="date"
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">إلى</label>
                        <input
                            type="date"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <button
                        onClick={applyFilters}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        تطبيق
                    </button>
                    <a
                        href={exportUrl}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium mr-auto"
                    >
                        <Download size={16} />
                        تصدير CSV
                    </a>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">مستندات الفترة</p>
                            <p className="text-2xl font-bold text-blue-600">{totals.documents.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 bg-blue-50 rounded-lg">
                            <FileText size={20} className="text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">حجم المستندات</p>
                            <p className="text-2xl font-bold text-purple-600">{formatBytes(totals.size)}</p>
                        </div>
                        <div className="p-2.5 bg-purple-50 rounded-lg">
                            <HardDrive size={20} className="text-purple-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">منتهية (إجمالي)</p>
                            <p className="text-2xl font-bold text-red-600">{totals.expired.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 bg-red-50 rounded-lg">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">تنتهي قريباً</p>
                            <p className="text-2xl font-bold text-amber-600">{totals.expiring.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-lg">
                            <Clock size={20} className="text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-500" />
                        مستندات مرفوعة يومياً
                    </h3>
                    <span className="text-xs text-gray-400">{uploadsTrend.length} يوم</span>
                </div>
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                    {uploadsTrend.length > 0 ? (
                        uploadsTrend.map((d, i) => {
                            const max = Math.max(...uploadsTrend.map(x => x.count));
                            const height = (d.count / max) * 100;
                            return (
                                <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                                    <div className="relative w-full flex items-end" style={{ height: '140px' }}>
                                        <div
                                            className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t transition-all hover:from-amber-600 hover:to-amber-400 cursor-pointer relative"
                                            style={{ height: `${height}%` }}
                                        >
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {d.count}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 rotate-45 origin-left whitespace-nowrap mt-2">
                                        {d.date?.slice(5)}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="w-full text-center text-gray-400 text-sm py-10">لا توجد بيانات في هذه الفترة</p>
                    )}
                </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Archive size={18} className="text-amber-500" />
                        حسب القطاع
                    </h3>
                    <BarChart data={bySector} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" />
                        حسب النوع
                    </h3>
                    <BarChart data={byType} color="bg-blue-500" />
                </div>
            </div>

            {/* Top uploaders + activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-purple-500" />
                        الأكثر رفعاً
                    </h3>
                    <BarChart data={topUploaders} color="bg-purple-500" />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-green-500" />
                        ملخص النشاط
                    </h3>
                    <div className="space-y-2">
                        {activityCounts.length > 0 ? activityCounts.map((a, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{actionLabels[a.action] ?? a.action}</span>
                                <span className="text-sm font-bold text-gray-800">{a.count}</span>
                            </div>
                        )) : <p className="text-center text-gray-400 text-sm py-4">لا يوجد نشاط</p>}
                    </div>
                </div>
            </div>
        </>
    );
}

ReportsIndex.layout = page => <ArchiveLayout title="التقارير" children={page} />;
