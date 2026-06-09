'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Trash2, Plus } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [priorities, setPriorities] = useState<{id: number, name: string}[]>([]);
    const [statuses, setStatuses] = useState<{id: number, name: string}[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [usersRes, catRes, prioRes, statRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/categories'),
                api.get('/priorities'),
                api.get('/statuses')
            ]);
            setUsers(usersRes.data);
            setCategories(catRes.data);
            setPriorities(prioRes.data);
            setStatuses(statRes.data);
        } catch (err) { console.error('Өгөгдөл татаж чадсангүй', err); }
    };

    const addEntry = async (url: string, name: string, setter: any, fetchData: any) => {
        try {
            await api.post(`${url}?name=${name}`);
            setter('');
            fetchData();
        } catch (err) { alert('Алдаа гарлаа'); }
    };

    const deleteEntry = async (url: string, id: number) => {
        if (!confirm('Устгах уу?')) return;
        try {
            await api.delete(`${url}/${id}`);
            fetchData();
        } catch (err) { alert('Устгахад алдаа гарлаа'); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
            <h1 className="text-4xl font-black mb-10 text-gray-900 tracking-tight">Админ Дашбоард</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Хэрэглэгчид */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-black mb-6">Бүртгэлтэй хэрэглэгчид</h2>
                    <ul className="space-y-3">
                        {users.map((u: any) => (
                            <li key={u.id} className="p-4 bg-gray-50 rounded-xl font-bold flex justify-between items-center">
                                <div>
                                    <span className="block">{u.email}</span>
                                    <span className="text-xs text-gray-500 font-normal">
                                        Бүртгүүлсэн: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Тодорхойгүй'}
                                    </span>
                                </div>
                                <button onClick={() => deleteEntry('/admin/users', u.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Тохиргооны хэсэг */}
                <div className="space-y-8">
                    {[
                        { title: 'Ангилал', list: categories, setter: setNewCategory, val: newCategory, add: () => addEntry('/admin/categories', newCategory, setNewCategory, fetchData), del: (id: number) => deleteEntry('/admin/categories', id) },
                        { title: 'Чухал түвшин', list: priorities, setter: setNewPriority, val: newPriority, add: () => addEntry('/admin/priorities', newPriority, setNewPriority, fetchData), del: (id: number) => deleteEntry('/admin/priorities', id) },
                        { title: 'Төлөв', list: statuses, setter: setNewStatus, val: newStatus, add: () => addEntry('/admin/statuses', newStatus, setNewStatus, fetchData), del: (id: number) => deleteEntry('/admin/statuses', id) },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">{item.title}</h2>
                            <ul className="mb-4 space-y-2">
                                {item.list.map((i) => (
                                    <li key={i.id} className="flex justify-between items-center text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {i.name}
                                        <button onClick={() => item.del(i.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <input className="flex-1 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" value={item.val} onChange={(e) => item.setter(e.target.value)} placeholder={`Шинэ ${item.title}`} />
                                <button onClick={item.add} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"><Plus size={20} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
