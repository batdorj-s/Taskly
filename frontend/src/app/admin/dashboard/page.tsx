'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [priorities, setPriorities] = useState<{id: number, name: string}[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newPriority, setNewPriority] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, catRes, prioRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/categories'),
                api.get('/priorities')
            ]);
            setUsers(usersRes.data);
            setCategories(catRes.data);
            setPriorities(prioRes.data);
        } catch (err) {
            console.error('Өгөгдөл татаж чадсангүй', err);
        }
    };

    const addCategory = async () => {
        try {
            await api.post(`/admin/categories?name=${newCategory}`);
            alert('Ангилал амжилттай нэмэгдлээ!');
            setNewCategory('');
        } catch (err) {
            alert('Ангилал нэмэхэд алдаа гарлаа');
        }
    };

    const addPriority = async () => {
        try {
            await api.post(`/admin/priorities?name=${newPriority}`);
            alert('Түвшин амжилттай нэмэгдлээ!');
            setNewPriority('');
        } catch (err) {
            alert('Түвшин нэмэхэд алдаа гарлаа');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-10 text-gray-900">
            <h1 className="text-3xl font-black mb-8 text-indigo-600">Админ Дашбоард</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Хэрэглэгчдийн жагсаалт */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Бүртгэлтэй хэрэглэгчид</h2>
                    <ul className="space-y-2">
                        {users.map((u: any) => (
                            <li key={u.id} className="p-3 bg-gray-50 rounded-lg font-medium border border-gray-100">
                                {u.email}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-8">
                    {/* Ангилал нэмэх & Жагсаалт */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Ангилал (Categories)</h2>
                        <ul className="mb-4 space-y-1">
                            {categories.map((c) => <li key={c.id} className="text-sm text-gray-600">• {c.name}</li>)}
                        </ul>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Шинэ ангилал"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />
                            <button onClick={addCategory} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition">Нэмэх</button>
                        </div>
                    </div>
                    {/* Түвшин нэмэх & Жагсаалт */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Чухал түвшин (Priorities)</h2>
                        <ul className="mb-4 space-y-1">
                            {priorities.map((p) => <li key={p.id} className="text-sm text-gray-600">• {p.name}</li>)}
                        </ul>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Шинэ түвшин"
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value)}
                            />
                            <button onClick={addPriority} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition">Нэмэх</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
