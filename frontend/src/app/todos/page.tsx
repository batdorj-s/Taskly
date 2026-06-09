'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, LogOut, Edit2 } from 'lucide-react';

interface Todo {
    id: number;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    deadline: string;
}

export default function TodoPage() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [deadline, setDeadline] = useState('');
    const [status, setStatus] = useState('Pending');
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10;
    
    // Модал нээлттэй эсэхийг хянах
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const router = useRouter();

    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [priorities, setPriorities] = useState<{id: number, name: string, weight: number}[]>([]);
    const [statuses, setStatuses] = useState<{id: number, name: string}[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchTodos();
        fetchMetadata();
    }, [page]);

    const fetchMetadata = async () => {
        try {
            const [catRes, prioRes, statRes] = await Promise.all([
                api.get('/categories'),
                api.get('/priorities'),
                api.get('/statuses')
            ]);
            setCategories(catRes.data);
            setPriorities(prioRes.data);
            setStatuses(statRes.data);
        } catch (err) {
            console.error('Metadata татаж чадсангүй', err);
        }
    };

    const getPriorityWeight = (name: string) => {
        const p = priorities.find(p => p.name === name);
        return p ? p.weight : 0;
    };

    const fetchTodos = async () => {
        try {
            const response = await api.get(`/tasks?skip=${(page - 1) * limit}&limit=${limit}`);
            
            // Эрэмбэлэх логик (Хатуу эрэмбэ)
            const sortedTodos = [...response.data].sort((a, b) => 
                getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
            );
            
            setTodos(sortedTodos);
            setHasMore(response.data.length === limit);
        } catch (err) {
            console.error('Ажлуудыг татаж чадсангүй', err);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('');
        setPriority('');
        setDeadline('');
        setStatus('Pending');
        setEditingTodo(null);
    };

    const openModal = (todo: Todo | null = null) => {
        if (todo) {
            setEditingTodo(todo);
            setTitle(todo.title);
            setDescription(todo.description);
            setCategory(todo.category);
            setPriority(todo.priority);
            setDeadline(todo.deadline ? todo.deadline.substring(0, 16) : '');
            setStatus(todo.status);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const saveTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const todoData = { title, description, category, priority, deadline: deadline || new Date().toISOString(), status };
            if (editingTodo) {
                await api.put(`/tasks/${editingTodo.id}`, todoData);
            } else {
                await api.post('/tasks/', todoData);
            }
            
            setIsModalOpen(false);
            resetForm();
            fetchTodos();
        } catch (err) {
            alert('Ажил хадгалахад алдаа гарлаа');
        }
    };

    const deleteTodo = async (id: number) => {
        if (!confirm('Энэ ажлыг устгахдаа итгэлтэй байна уу?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchTodos();
        } catch (err) {
            alert('Устгахад алдаа гарлаа');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
            <header className="bg-white border-b border-gray-100 px-8 py-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-black text-indigo-600">Taskly</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                            <Plus size={18} /> Шинэ
                        </button>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 p-2">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto w-full p-8">
                <div className="grid gap-6">
                    {todos.map((todo) => (
                        <div key={todo.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-block mb-1 text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                        {todo.priority || 'Normal'}
                                    </span>
                                    <h3 className="text-xl font-black">{todo.title}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(todo)} className="text-gray-400 hover:text-blue-600 p-2" title="Засах"><Edit2 size={18} /></button>
                                    <button onClick={() => deleteTodo(todo.id)} className="text-gray-400 hover:text-red-600 p-2" title="Устгах"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-4">{todo.description}</p>
                            <div className="flex items-center gap-4 pt-2">
                                <span className="text-xs font-black text-indigo-600 bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-wider">{todo.category || 'Хувийн'}</span>
                                <span className="text-xs font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-full uppercase tracking-wider">{todo.status || 'Pending'}</span>
                                {todo.deadline && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                        Дуусах: {new Date(todo.deadline).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Хуудаслалт */}
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-200 transition"
                    >
                        Өмнөх
                    </button>
                    <span className="font-black text-gray-700">Хуудас {page}</span>
                    <button 
                        onClick={() => setPage(page + 1)}
                        disabled={!hasMore}
                        className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-xl font-bold hover:bg-indigo-200 transition"
                    >
                        Дараах
                    </button>
                </div>
            </main>

            <footer className="text-center p-6 text-gray-400 text-sm">
                Taskly © 2026 - Бүх эрх хуулиар хамгаалагдсан
            </footer>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 overflow-hidden">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">{editingTodo ? 'Ажил засах' : 'Шинэ ажил нэмэх'}</h2>
                        
                        <form onSubmit={saveTodo} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Гарчиг</label>
                                <input type="text" required className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Дуусах хугацаа</label>
                                <input type="datetime-local" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Тайлбар</label>
                                <textarea className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ангилал</label>
                                    <select className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="">Сонгох...</option>
                                        {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Түвшин</label>
                                    <select className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                        <option value="">Сонгох...</option>
                                        {priorities.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Төлөв</label>
                                <select className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="">Сонгох...</option>
                                    {statuses.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-bold hover:bg-gray-200 transition">Болих</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition">Хадгалах</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
