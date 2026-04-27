import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, RadialBarChart, RadialBar, Sector,
} from 'recharts';
import {
    FileText, Download, Calendar, TrendingUp, HardDrive,
    AlertTriangle, Clock, Archive, Users, Activity, Filter,
    Sparkles, BarChart3, PieChart as PieIcon
} from 'lucide-react';

// ─────── Color palette ───────
const COLORS = {
    amber: '#F59E0B',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    green: '#10B981',
    red: '#EF4444',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
};
const CHART_COLORS = [COLORS.amber, COLORS.blue, COLORS.purple, COLORS.green, COLORS.pink, COLORS.indigo, COLORS.teal, COLORS.red];

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

const actionLabels = {
    upload: 'رفع', view: 'استعراض', download: 'تحميل', update: 'تعديل',
    delete: 'حذف', login: 'تسجيل دخول', logout: 'تسجيل خروج', login_failed: 'دخول فاشل',
    create_user: 'إنشاء مستخدم', update_user: 'تعديل مستخدم',
};

// ─────── Custom tooltip ───────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3" dir="rtl">
            {label && <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>}
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }}></span>
                    <span className="text-gray-600">{p.name}:</span>
                    <span className="font-bold text-gray-900">{p.value?.toLocaleString('ar-SA')}</span>
                </div>
            ))}
        </div>
    );
}

// ─────── Stat Card ───────
function StatCard({ icon: Icon, label, value, color, accent, change }) {
    return (
        <div className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all`}>
            <div className={`absolute -top-8 -left-8 w-24 h-24 ${accent} rounded-full opacity-50 blur-2xl`}></div>
            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${accent}`}>
                        <Icon size={20} className={color} />
                    </div>
                    {change && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            +{change}
                        </span>
                    )}
                </div>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────
export default function ReportsIndex({ filters, totals, uploadsTrend, bySector, byType, topUploaders, activityCounts }) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilters = () => router.get('/reports', { from, to }, { preserveState: true });
    const exportUrl = `/reports/export?from=${filters.from}&to=${filters.to}`;

    // Quick presets
    const setPreset = (days) => {
        const today = new Date();
        const past = new Date();
        past.setDate(today.getDate() - days);
        const f = past.toISOString().split('T')[0];
        const t = today.toISOString().split('T')[0];
        setFrom(f); setTo(t);
        router.get('/reports', { from: f, to: t }, { preserveState: true });
    };

    // Format trend data for chart
    const trendData = uploadsTrend.map(d => ({
        date: d.date?.slice(5),
        count: parseInt(d.count),
        size: parseInt(d.total_size) || 0,
    }));

    // Activity for pie chart
    const activityData = activityCounts.map((a, i) => ({
        name: actionLabels[a.action] ?? a.action,
        value: parseInt(a.count),
        fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
        <>
            <Head title="التقارير والإحصائيات" />

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-l from-[#1e2a4a] via-[#243561] to-[#2c3e6e] rounded-2xl p-6 mb-6 text-white">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-amber-300 text-sm mb-2">
                            <Sparkles size={14} />
                            <span>تقارير وتحليلات</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-1">إحصائيات الأرشيف</h2>
                        <p className="text-white/70 text-sm">
                            من <strong className="text-amber-300">{filters.from}</strong> إلى <strong className="text-amber-300">{filters.to}</strong>
                        </p>
                    </div>
                    <a
                        href={exportUrl}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:scale-105"
                    >
                        <Download size={16} />
                        تصدير CSV
                    </a>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                        <Filter size={16} className="text-amber-500" />
                        <span>الفترة:</span>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">من</label>
                        <input
                            type="date" value={from} onChange={e => setFrom(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">إلى</label>
                        <input
                            type="date" value={to} onChange={e => setTo(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={applyFilters}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold"
                    >
                        تطبيق
                    </button>

                    <div className="flex gap-1 mr-auto">
                        {[7, 30, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setPreset(d)}
                                className="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                            >
                                آخر {d} يوم
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={FileText}        label="مستندات الفترة" value={totals.documents.toLocaleString('ar-SA')} color="text-blue-600"   accent="bg-blue-50" />
                <StatCard icon={HardDrive}       label="حجم المستندات" value={formatBytes(totals.size)}                  color="text-purple-600" accent="bg-purple-50" />
                <StatCard icon={AlertTriangle}   label="منتهية (إجمالي)" value={totals.expired.toLocaleString('ar-SA')}    color="text-red-600"    accent="bg-red-50" />
                <StatCard icon={Clock}           label="تنتهي قريباً" value={totals.expiring.toLocaleString('ar-SA')}      color="text-amber-600"  accent="bg-amber-50" />
            </div>

            {/* Trend Area Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-500" />
                            تطور رفع المستندات
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">رسم بياني يومي لعدد المستندات المرفوعة</p>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" reversed />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone" dataKey="count" name="المستندات"
                                stroke={COLORS.amber} strokeWidth={2.5}
                                fillOpacity={1} fill="url(#colorCount)"
                                dot={{ r: 3, fill: COLORS.amber }}
                                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Two charts: Sector Bar + Type Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                {/* Sector bar chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-amber-500" />
                            المستندات حسب القطاع
                        </h3>
                        <span className="text-xs text-gray-400">{bySector.length} قطاع</span>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bySector} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} stroke="#e2e8f0" width={75} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="count" name="مستندات" fill={COLORS.amber} radius={[0, 6, 6, 0]}>
                                    {bySector.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Type pie chart */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <PieIcon size={18} className="text-blue-500" />
                        حسب النوع
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={byType.map((t, i) => ({ ...t, value: parseInt(t.count), fill: CHART_COLORS[i % CHART_COLORS.length] }))}
                                    cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                                    paddingAngle={3} dataKey="value"
                                />
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="space-y-1.5 mt-3">
                        {byType.slice(0, 5).map((t, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                                    <span className="text-gray-700">{t.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Uploaders + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Users size={18} className="text-purple-500" />
                            الأكثر رفعاً
                        </h3>
                        <span className="text-xs text-gray-400">Top 10</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topUploaders} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#e2e8f0" angle={-15} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#e2e8f0" />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="count" name="مستندات" fill={COLORS.purple} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={18} className="text-green-500" />
                            ملخص النشاط
                        </h3>
                    </div>
                    {activityData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={activityData}
                                        cx="50%" cy="50%" outerRadius={90}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                        dataKey="value"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 text-sm py-12">لا يوجد نشاط</p>
                    )}
                </div>
            </div>
        </>
    );
}

ReportsIndex.layout = page => <ArchiveLayout title="التقارير" children={page} />;
