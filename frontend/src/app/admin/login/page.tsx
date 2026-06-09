'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            // Admin нэвтрэх хүсэлт (JSON илгээдэг)
            const response = await api.post('/admin/login', {
                username,
                password
            });
            
            // Админ токеноо хадгалах
            localStorage.setItem('token', response.data.access_token);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Админы нэр эсвэл нууц үг буруу байна');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h1 className="text-2xl font-black text-red-600 mb-6 text-center">Админ Нэвтрэх</h1>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Нэр</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Нууц үг</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white rounded-lg py-3 font-bold hover:bg-red-700 transition"
                    >
                        Нэвтрэх
                    </button>
                </form>
            </div>
        </div>
    );
}
