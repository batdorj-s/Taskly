'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Edit2, Save, LogOut } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [priorities, setPriorities] = useState<{id: number, name: string}[]>([]);
    const [statuses, setStatuses] = useState<{id: number, name: string}[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const router = useRouter();

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/admin/login');
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

    const saveEdit = async (url: string) => {
        try {
            await api.put(`${url}/${editingId}?name=${editName}`);
            setEditingId(null);
            setEditName('');
            fetchData();
        } catch (err) { alert('Засахад алдаа гарлаа'); }
    };

    const startEdit = (id: number, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Админ Дашбоард</h1>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition"
                >
                    <LogOut size={18} />
                    Гарах
                </button>
            </div>
            
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
                        { title: 'Ангилал', list: categories, setter: setNewCategory, val: newCategory, add: () => addEntry('/admin/categories', newCategory, setNewCategory, fetchData), del: (id: number) => deleteEntry('/admin/categories', id), editUrl: '/admin/categories' },
                        { title: 'Чухал түвшин', list: priorities, setter: setNewPriority, val: newPriority, add: () => addEntry('/admin/priorities', newPriority, setNewPriority, fetchData), del: (id: number) => deleteEntry('/admin/priorities', id), editUrl: '/admin/priorities' },
                        { title: 'Төлөв', list: statuses, setter: setNewStatus, val: newStatus, add: () => addEntry('/admin/statuses', newStatus, setNewStatus, fetchData), del: (id: number) => deleteEntry('/admin/statuses', id), editUrl: '/admin/statuses' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">{item.title}</h2>
                            <ul className="mb-4 space-y-2">
                                {item.list.map((i: any) => (
                                    <li key={i.id} className="flex justify-between items-center text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {editingId === i.id ? (
                                            <input className="border p-1 rounded" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                        ) : (
                                            i.name
                                        )}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => editingId === i.id ? saveEdit(item.editUrl) : startEdit(i.id, i.name)} 
                                                className="text-blue-500 hover:text-blue-700 p-1"
                                                title={editingId === i.id ? "Хадгалах" : "Засах"}
                                            >
                                                {editingId === i.id ? <Save size={16} /> : <Edit2 size={16} />}
                                            </button>
                                            <button onClick={() => item.del(i.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                        </div>
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
