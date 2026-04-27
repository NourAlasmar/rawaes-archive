import { Head, Link } from '@inertiajs/react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import {
    FileText, Clock, AlertTriangle, Lock, Upload,
    Archive, FolderOpen, Settings, Users, HardDrive,
    TrendingUp, Activity, Eye, Download, Edit2, Trash2
} from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

function StatCard({ icon: Icon, label, value, color, href, trend }) {
    const content = (
        <div className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all ${href ? 'cursor-pointer hover:border-amber-300' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    {trend && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <TrendingUp size={12} />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-2.5 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-50')}`}>
                    <Icon size={20} className={color} />
                </div>
            </div>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function BarChart({ data, color = 'bg-amber-500' }) {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="space-y-2.5">
            {data.slice(0, 6).map((item, i) => (
                <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-xs text-gray-500 font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${color} rounded-full transition-all duration-500`}
                            style={{ width: `${(item.count / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
            {data.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">لا توجد بيانات</p>
            )}
        </div>
    );
}

const actionIcons = {
    upload: { icon: Upload, text: 'text-blue-500', bg: 'bg-blue-50' },
    view: { icon: Eye, text: 'text-gray-500', bg: 'bg-gray-50' },
    download: { icon: Download, text: 'text-green-500', bg: 'bg-green-50' },
    update: { icon: Edit2, text: 'text-amber-500', bg: 'bg-amber-50' },
    delete: { icon: Trash2, text: 'text-red-500', bg: 'bg-red-50' },
};

export default function Dashboard({ stats, bySector, byType, trend, recent, expiringList, recentActivity, isScoped, sectorName }) {
    return (
        <>
            <Head title="لوحة البيانات" />

            {isScoped && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-center gap-2 text-sm">
                    <Archive size={16} className="text-amber-600 shrink-0" />
                    <span className="text-amber-800">
                        أنت تعرض بيانات قطاع <strong>{sectorName}</strong> فقط
                    </span>
                </div>
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={FileText}
                    label="إجمالي المستندات"
                    value={stats.total.toLocaleString('ar-SA')}
                    color="text-blue-600"
                    href="/archive/documents"
                />
                <StatCard
                    icon={Clock}
                    label="تنتهي خلال 30 يوم"
                    value={stats.expiring_soon.toLocaleString('ar-SA')}
                    color="text-amber-600"
                    href="/archive/documents?expiring_soon=true"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="منتهية الصلاحية"
                    value={stats.expired.toLocaleString('ar-SA')}
                    color="text-red-600"
                    href="/archive/documents?expired=true"
                />
                <StatCard
                    icon={HardDrive}
                    label="حجم الأرشيف"
                    value={formatBytes(stats.total_size)}
                    color="text-purple-600"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                    { icon: Archive, label: 'قطاعات', value: stats.sectors, color: 'text-amber-600' },
                    { icon: FolderOpen, label: 'مجلدات', value: stats.folders, color: 'text-blue-600' },
                    { icon: Settings, label: 'أنواع', value: stats.types, color: 'text-green-600' },
                    stats.users !== null && { icon: Users, label: 'مستخدمون', value: stats.users, color: 'text-purple-600' },
                    { icon: Lock, label: 'سرية', value: stats.confidential, color: 'text-red-600' },
                ].filter(Boolean).map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
                            <Icon size={18} className={s.color} />
                            <div>
                                <p className="text-xs text-gray-500">{s.label}</p>
                                <p className="font-bold text-gray-800">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts row */}
            <div className={`grid grid-cols-1 ${bySector.length > 0 ? 'lg:grid-cols-2' : ''} gap-5 mb-6`}>
                {bySector.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">المستندات حسب القطاع</h3>
                            <Archive size={18} className="text-amber-500" />
                        </div>
                        <BarChart data={bySector} color="bg-amber-500" />
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">المستندات حسب النوع</h3>
                        <FileText size={18} className="text-blue-500" />
                    </div>
                    <BarChart data={byType} color="bg-blue-500" />
                </div>
            </div>

            {/* Three columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Documents */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">أحدث المستندات</h3>
                        <Link href="/archive/documents" className="text-xs text-amber-600 hover:text-amber-700">
                            عرض الكل ←
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recent.length > 0 ? recent.map(doc => (
                            <Link
                                key={doc.id}
                                href={`/archive/documents/${doc.id}`}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText size={16} className="text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {doc.sector?.name} · {doc.document_type?.name} · {doc.uploader?.name}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(doc.created_at).toLocaleDateString('ar-SA')}
                                </span>
                            </Link>
                        )) : (
                            <p className="text-center text-gray-400 text-sm py-8">لا توجد مستندات حديثة</p>
                        )}
                    </div>
                </div>

                {/* Expiring Soon */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">تنبيهات الانتهاء</h3>
                        <Clock size={18} className="text-amber-500" />
                    </div>
                    <div className="space-y-2">
                        {expiringList.length > 0 ? expiringList.map(doc => (
                            <Link
                                key={doc.id}
                                href={`/archive/documents/${doc.id}`}
                                className="block p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition-colors"
                            >
                                <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    ينتهي: {doc.expiry_date}
                                </p>
                            </Link>
                        )) : (
                            <p className="text-center text-gray-400 text-sm py-8">لا توجد تنبيهات</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity log preview - admins only */}
            {recentActivity.length > 0 && (
            <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity size={18} className="text-purple-500" />
                        النشاط الأخير
                    </h3>
                    <Link href="/archive/audit-logs" className="text-xs text-amber-600 hover:text-amber-700">
                        عرض كامل السجل ←
                    </Link>
                </div>
                <div className="space-y-2">
                    {recentActivity.length > 0 ? recentActivity.map(log => {
                        const cfg = actionIcons[log.action] ?? { icon: Activity, text: 'text-gray-500', bg: 'bg-gray-50' };
                        const ActionIcon = cfg.icon;
                        return (
                            <div key={log.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                                    <ActionIcon size={14} className={cfg.text} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 truncate">{log.description ?? log.action}</p>
                                    <p className="text-xs text-gray-400">{log.user_name}</p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString('ar-SA')}
                                </span>
                            </div>
                        );
                    }) : (
                        <p className="text-center text-gray-400 text-sm py-6">لا يوجد نشاط</p>
                    )}
                </div>
            </div>
            )}
        </>
    );
}

Dashboard.layout = page => <ArchiveLayout title="لوحة البيانات" children={page} />;
