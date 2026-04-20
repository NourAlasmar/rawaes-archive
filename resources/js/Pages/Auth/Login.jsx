import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="تسجيل الدخول" />
            <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e2a4a] via-[#0f1729] to-[#1e2a4a] p-4 font-sans">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 -left-40 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-md">
                    {/* Logo + Title */}
                    <div className="text-center mb-8">
                        <img
                            src="/images/logo.png"
                            alt="روائس"
                            className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-xl"
                            onError={(e) => e.target.style.display='none'}
                        />
                        <h1 className="text-3xl font-bold text-white mb-1">روائس</h1>
                        <p className="text-amber-400/80 text-sm">نظام الأرشفة الإلكترونية</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                            تسجيل الدخول
                        </h2>

                        {status && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    البريد الإلكتروني
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        autoComplete="username"
                                        required
                                        autoFocus
                                        dir="ltr"
                                        className="w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="admin@rawaes.com"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        required
                                        className="w-full pr-10 pl-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 accent-amber-500"
                                    />
                                    <span className="text-sm text-gray-600">تذكرني</span>
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="text-sm text-amber-600 hover:text-amber-700">
                                        نسيت كلمة المرور؟
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {processing && <Loader2 size={16} className="animate-spin" />}
                                {processing ? 'جاري الدخول...' : 'دخول'}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-white/40 mt-6">
                        © 2026 شركة رواس لتأجير السيارات — جميع الحقوق محفوظة
                    </p>
                </div>
            </div>
        </>
    );
}
