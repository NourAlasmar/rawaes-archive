import { Head, Link, useForm } from '@inertiajs/react';
import ArchiveLayout from '@/Layouts/ArchiveLayout';
import { Save, ArrowLeft, User as UserIcon, Shield } from 'lucide-react';

const roleLabels = {
    'super-admin': 'مدير عام (صلاحيات كاملة)',
    'archive-manager': 'مدير أرشيف',
    'employee': 'موظف',
    'auditor': 'مدقق',
};

export default function UserForm({ user, sectors, roles }) {
    const isEdit = Boolean(user);

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        employee_id: user?.employee_id ?? '',
        sector_id: user?.sector_id ?? '',
        department: user?.department ?? '',
        job_title: user?.job_title ?? '',
        phone: user?.phone ?? '',
        role: user?.roles?.[0]?.name ?? 'employee',
        is_active: user?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit
            ? put(`/users/${user.id}`)
            : post('/users');
    };

    return (
        <>
            <Head title={isEdit ? `تعديل - ${user.name}` : 'مستخدم جديد'} />

            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <Link href="/users" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <ArrowLeft size={14} /> المستخدمون
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-800 font-medium">{isEdit ? 'تعديل' : 'جديد'}</span>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-amber-50 rounded-lg">
                                <UserIcon size={22} className="text-amber-500" />
                            </div>
                            <h2 className="font-bold text-gray-800">البيانات الشخصية</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    الاسم الكامل <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    البريد الإلكتروني <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الرقم الوظيفي</label>
                                <input
                                    type="text"
                                    value={data.employee_id}
                                    onChange={e => setData('employee_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    dir="ltr"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-bold text-gray-800 mb-4">البيانات الوظيفية</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">المسمى الوظيفي</label>
                                <input
                                    type="text"
                                    value={data.job_title}
                                    onChange={e => setData('job_title', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">القسم / الإدارة</label>
                                <input
                                    type="text"
                                    value={data.department}
                                    onChange={e => setData('department', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">القطاع</label>
                                <select
                                    value={data.sector_id}
                                    onChange={e => setData('sector_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">بدون قطاع</option>
                                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <Shield size={12} className="inline ml-1" />
                                    الدور <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.role}
                                    onChange={e => setData('role', e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.name}>
                                            {roleLabels[r.name] ?? r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-bold text-gray-800 mb-4">
                            {isEdit ? 'تغيير كلمة المرور (اختياري)' : 'كلمة المرور'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    كلمة المرور {!isEdit && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    required={!isEdit}
                                    dir="ltr"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    تأكيد كلمة المرور {!isEdit && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    required={!isEdit}
                                    dir="ltr"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        {isEdit && (
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="w-4 h-4 accent-amber-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    الحساب نشط (يستطيع تسجيل الدخول)
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href="/users" className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                            إلغاء
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
                        >
                            <Save size={16} />
                            {processing ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

UserForm.layout = page => <ArchiveLayout title={page.props.user ? 'تعديل مستخدم' : 'مستخدم جديد'} children={page} />;
