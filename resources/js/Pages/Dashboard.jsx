import { Head, Link } from '@inertiajs/react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import {
    FileText, Clock, AlertTriangle, Lock, Upload,
    Archive, FolderOpen, Settings, Users,
    TrendingUp, Activity, Eye, Download, Edit2, Trash2,
    Sparkles, Calendar, ArrowLeft, Bell, Plus
} from 'lucide-react';

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
    upload:   { icon: Upload,   text: 'text-blue-600',   bg: 'bg-blue-50' },
    view:     { icon: Eye,      text: 'text-gray-500',   bg: 'bg-gray-50' },
    download: { icon: Download, text: 'text-green-600',  bg: 'bg-green-50' },
    update:   { icon: Edit2,    text: 'text-amber-600',  bg: 'bg-amber-50' },
    delete:   { icon: Trash2,   text: 'text-red-600',    bg: 'bg-red-50' },
};

// ─────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD
// ─────────────────────────────────────────────────────────
function EmployeeDashboard({ stats, byType, recent, expiringList, accessibleSectors, currentUser }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير';

    return (
        <>
            {/* Welcome banner */}
            <div className="relative overflow-hidden bg-gradient-to-l from-[#1e2a4a] to-[#2c3e6e] rounded-2xl p-6 mb-6 text-white">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-amber-300 text-sm mb-1">
                            <Sparkles size={14} />
                            <span>{greeting}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-1">{currentUser.name}</h2>
                        <p className="text-white/70 text-sm">
                            {currentUser.job_title}
                            {currentUser.department && <span> · {currentUser.department}</span>}
                            {currentUser.sector_name && <span> · {currentUser.sector_name}</span>}
                        </p>
                    </div>
                    <Link
                        href="/archive/documents/create"
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:scale-105"
                    >
                        <Plus size={18} />
                        رفع مستند جديد
                    </Link>
                </div>
            </div>

            {/* Personal Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Link
                    href="/archive/documents"
                    className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-50 group-hover:bg-blue-100 rounded-xl transition-colors">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.total.toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-gray-500 mt-1">المستندات المتاحة لك</p>
                </Link>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-green-50 rounded-xl">
                            <Upload size={20} className="text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.my_uploads.toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-gray-500 mt-1">رفعتها أنت</p>
                    {stats.my_uploads_month > 0 && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp size={11} />
                            {stats.my_uploads_month} هذا الشهر
                        </p>
                    )}
                </div>

                <Link
                    href="/archive/documents?expiring_soon=true"
                    className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-50 group-hover:bg-amber-100 rounded-xl transition-colors">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.expiring_soon.toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-gray-500 mt-1">تنتهي قريباً</p>
                </Link>

                <Link
                    href="/archive/documents?expired=true"
                    className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-red-300 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-red-50 group-hover:bg-red-100 rounded-xl transition-colors">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.expired.toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-gray-500 mt-1">منتهية الصلاحية</p>
                </Link>
            </div>

            {/* Accessible sectors as nice cards */}
            {accessibleSectors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Archive size={18} className="text-amber-500" />
                            القطاعات المتاحة لك
                        </h3>
                        <span className="text-xs text-gray-400">{accessibleSectors.length} قطاع</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {accessibleSectors.map(sector => (
                            <Link
                                key={sector.id}
                                href={`/archive/documents?sector_id=${sector.id}`}
                                className="group p-4 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <Archive size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">{sector.code}</span>
                                </div>
                                <p className="font-semibold text-gray-800 text-sm mb-1">{sector.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <FileText size={11} />
                                    {sector.documents_count ?? 0} مستند
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Two columns: Recent + Expiring */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                {/* Recent uploads */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText size={18} className="text-blue-500" />
                            أحدث المستندات
                        </h3>
                        <Link href="/archive/documents" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                            عرض الكل <ArrowLeft size={12} />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recent.length > 0 ? recent.map(doc => (
                            <Link
                                key={doc.id}
                                href={`/archive/documents/${doc.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <div className={`p-2 rounded-lg ${doc.is_expired ? 'bg-red-50' : doc.is_expiring_soon ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                    <FileText size={16} className={doc.is_expired ? 'text-red-500' : doc.is_expiring_soon ? 'text-amber-500' : 'text-blue-500'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-amber-600 transition-colors">{doc.title}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {doc.sector?.name} · {doc.document_type?.name}
                                    </p>
                                </div>
                                <div className="text-left shrink-0">
                                    <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('ar-SA')}</p>
                                    {doc.uploader && (
                                        <p className="text-xs text-gray-400 mt-0.5">{doc.uploader.name}</p>
                                    )}
                                </div>
                            </Link>
                        )) : (
                            <div className="py-12 text-center">
                                <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-gray-400 text-sm mb-3">لا توجد مستندات بعد</p>
                                <Link
                                    href="/archive/documents/create"
                                    className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium"
                                >
                                    <Plus size={14} /> ارفع أول مستند
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks / Expiring */}
                <div className="space-y-4">
                    {/* Expiring */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Bell size={16} className="text-amber-500" />
                                تنبيهاتك
                            </h3>
                        </div>
                        {expiringList.length > 0 ? (
                            <div className="space-y-2">
                                {expiringList.slice(0, 4).map(doc => (
                                    <Link
                                        key={doc.id}
                                        href={`/archive/documents/${doc.id}`}
                                        className="block p-3 rounded-xl bg-gradient-to-l from-amber-50 to-amber-50/30 border border-amber-100 hover:border-amber-300 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Calendar size={11} className="text-amber-600" />
                                            <p className="text-xs text-amber-700">ينتهي: {doc.expiry_date}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400">لا توجد تنبيهات</p>
                            </div>
                        )}
                    </div>

                    {/* Quick links */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h3 className="font-bold text-gray-800 mb-3 text-sm">روابط سريعة</h3>
                        <div className="space-y-1">
                            <Link href="/archive/documents/create" className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors text-sm text-gray-700">
                                <Upload size={14} />
                                رفع مستند
                            </Link>
                            <Link href="/archive/documents" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm text-gray-700">
                                <FileText size={14} />
                                كل المستندات
                            </Link>
                            <Link href="/notifications" className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors text-sm text-gray-700">
                                <Bell size={14} />
                                الإشعارات
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents by type chart - small */}
            {byType.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" />
                        توزيع المستندات حسب النوع
                    </h3>
                    <BarChart data={byType} color="bg-blue-500" />
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────
function AdminDashboard({ stats, bySector, byType, recent, expiringList, recentActivity }) {
    return (
        <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Link href="/archive/documents" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">إجمالي المستندات</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.total.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                    </div>
                </Link>
                <Link href="/archive/documents?expiring_soon=true" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">تنتهي خلال 30 يوم</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.expiring_soon.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                    </div>
                </Link>
                <Link href="/archive/documents?expired=true" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-red-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">منتهية الصلاحية</p>
                            <p className="text-2xl font-bold text-red-600">{stats.expired.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-red-50">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                    </div>
                </Link>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">مستندات سرية</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.confidential.toLocaleString('ar-SA')}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-purple-50">
                            <Lock size={20} className="text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Archive, label: 'قطاعات', value: stats.sectors, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: FolderOpen, label: 'مجلدات', value: stats.folders, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: Settings, label: 'أنواع', value: stats.types, color: 'text-green-600', bg: 'bg-green-50' },
                    stats.users !== null && { icon: Users, label: 'مستخدمون', value: stats.users, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].filter(Boolean).map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${s.bg}`}>
                                <Icon size={16} className={s.color} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">{s.label}</p>
                                <p className="font-bold text-gray-800">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className={`grid grid-cols-1 ${bySector.length > 0 ? 'lg:grid-cols-2' : ''} gap-5 mb-6`}>
                {bySector.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">المستندات حسب القطاع</h3>
                            <Archive size={18} className="text-amber-500" />
                        </div>
                        <BarChart data={bySector} color="bg-amber-500" />
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">المستندات حسب النوع</h3>
                        <FileText size={18} className="text-blue-500" />
                    </div>
                    <BarChart data={byType} color="bg-blue-500" />
                </div>
            </div>

            {/* Recent + Expiring */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">أحدث المستندات</h3>
                        <Link href="/archive/documents" className="text-xs text-amber-600 hover:text-amber-700">عرض الكل ←</Link>
                    </div>
                    <div className="space-y-2">
                        {recent.map(doc => (
                            <Link key={doc.id} href={`/archive/documents/${doc.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText size={16} className="text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                                    <p className="text-xs text-gray-500">{doc.sector?.name} · {doc.document_type?.name} · {doc.uploader?.name}</p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(doc.created_at).toLocaleDateString('ar-SA')}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">تنبيهات الانتهاء</h3>
                        <Clock size={18} className="text-amber-500" />
                    </div>
                    <div className="space-y-2">
                        {expiringList.length > 0 ? expiringList.map(doc => (
                            <Link key={doc.id} href={`/archive/documents/${doc.id}`} className="block p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition-colors">
                                <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                                <p className="text-xs text-amber-700 mt-0.5">ينتهي: {doc.expiry_date}</p>
                            </Link>
                        )) : <p className="text-center text-gray-400 text-sm py-8">لا توجد تنبيهات</p>}
                    </div>
                </div>
            </div>

            {/* Activity log */}
            {recentActivity.length > 0 && (
                <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={18} className="text-purple-500" />
                            النشاط الأخير
                        </h3>
                        <Link href="/archive/audit-logs" className="text-xs text-amber-600 hover:text-amber-700">عرض كامل السجل ←</Link>
                    </div>
                    <div className="space-y-2">
                        {recentActivity.map(log => {
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
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString('ar-SA')}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────
export default function Dashboard(props) {
    return (
        <>
            <Head title="لوحة البيانات" />
            {props.isScoped
                ? <EmployeeDashboard {...props} />
                : <AdminDashboard {...props} />
            }
        </>
    );
}

Dashboard.layout = page => <ArchiveLayout title="لوحة البيانات" children={page} />;
