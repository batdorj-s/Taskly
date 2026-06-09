// src/app/login/page.tsx
'use client';

import { useState, useMemo } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    // Password validation state
    const validation = useMemo(() => {
        return {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    }, [password]);

    const isPasswordValid = Object.values(validation).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', password);

                const response = await api.post('/token', formData);
                localStorage.setItem('token', response.data.access_token);
                router.push('/todos');
            } else {
                if (!isPasswordValid) return;
                await api.post('/register', { email, password });
                alert('Бүртгэл амжилттай! Одоо нэвтэрнэ үү.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Алдаа гарлаа');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 text-gray-900">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-indigo-600 mb-2">Taskly</h1>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Тавтай морил' : 'Бүртгүүлэх'}
                    </h2>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm text-center font-bold border border-red-100">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">И-мэйл</label>
                            <input
                                type="email"
                                required
                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="example@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Нууц үг</label>
                            <input
                                type="password"
                                required
                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {!isLogin && (
                            <div className="space-y-1 text-sm">
                                {[
                                    { key: 'minLength', label: 'Хамгийн багадаа 8 тэмдэгт' },
                                    { key: 'hasUpperCase', label: 'Ядаж 1 ТОМ үсэг (A-Z)' },
                                    { key: 'hasLowerCase', label: 'Ядаж 1 жижиг үсэг (a-z)' },
                                    { key: 'hasSpecialChar', label: 'Ядаж 1 тусгай тэмдэгт (!@#$%^&*)' },
                                ].map((item) => (
                                    <div key={item.key} className={`font-medium ${validation[item.key as keyof typeof validation] ? 'text-green-600' : 'text-gray-500'}`}>
                                        {validation[item.key as keyof typeof validation] ? '• ' : '◦ '} {item.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={!isLogin && !isPasswordValid}
                            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        {isLogin ? 'Шинэ хаяг нээх үү?' : 'Аль хэдийн хаягтай юу? Нэвтрэх'}
                    </button>
                </div>
            </div>
        </div>
    );
}
