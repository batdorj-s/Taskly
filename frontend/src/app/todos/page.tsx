// src/app/todos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, LogOut, CheckCircle, Circle } from 'lucide-react';

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
    
    // Модал нээлттэй эсэхийг хянах
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Засварлаж байгаа ажил (null бол шинээр нэмж байна гэсэн үг)
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const router = useRouter();

    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [priorities, setPriorities] = useState<{id: number, name: string}[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchTodos();
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const catRes = await api.get('/categories');
            setCategories(catRes.data);
            const prioRes = await api.get('/priorities');
            setPriorities(prioRes.data);
        } catch (err) {
            console.error('Metadata татаж чадсангүй', err);
        }
    };

    // Формыг цэвэрлэх
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('');
        setPriority('');
        setDeadline('');
        setStatus('Pending');
        setEditingTodo(null);
    };

    // Нэмэх/Засах модал нээх
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

    const fetchTodos = async () => {
        try {
            const response = await api.get('/tasks/');
            setTodos(response.data);
        } catch (err) {
            console.error('Ажлуудыг татаж чадсангүй');
        }
    };

    // Ажил хадгалах (Шинээр нэмэх эсвэл Шинэчлэх)
    const saveTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const todoData = {
                title,
                description,
                category,
                priority,
                deadline: deadline || new Date().toISOString(),
                status
            };

            if (editingTodo) {
                // Засах (PUT)
                await api.put(`/tasks/${editingTodo.id}`, todoData);
            } else {
                // Шинээр нэмэх (POST)
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
        <div className="flex min-h-screen bg-white text-gray-900">
            {/* 1. ЗҮҮН ТАЛЫН SIDEBAR */}
            <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-6 hidden md:flex">
                <div className="mb-10">
                    <h1 className="text-2xl font-black text-indigo-600 tracking-tight">Taskly</h1>
                </div>

                <button 
                    onClick={() => openModal()}
                    className="w-full bg-indigo-600 text-white rounded-xl py-3 px-4 hover:bg-indigo-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-100 transition-all mb-auto"
                >
                    <Plus size={20} />
                    Шинэ ажил нэмэх
                </button>

                <div className="mt-10 pt-10 border-t border-gray-200">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-gray-600 font-bold hover:text-red-600 transition w-full p-2 hover:bg-red-50 rounded-lg"
                    >
                        <LogOut size={20} />
                        <span>Гарах</span>
                    </button>
                </div>
            </aside>

            {/* 2. БАРУУН ТАЛЫН ҮНДСЭН ХЭСЭГ */}
            <main className="flex-1 p-10 bg-gray-50/50 overflow-y-auto">
                <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Миний ажлууд</h2>
                    {/* Гар утсан дээр харагдах Нэмэх товч */}
                    <button 
                        onClick={() => openModal()}
                        className="md:hidden bg-indigo-600 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
                    >
                        <Plus size={24} />
                    </button>
                </header>

                <div className="max-w-4xl mx-auto space-y-6">
                    {todos.length === 0 ? (
                        <div className="py-32 text-center border-2 border-dashed border-gray-200 rounded-[32px] bg-white">
                            <div className="text-gray-300 mb-4 flex justify-center">
                                <Plus size={48} className="rotate-45 opacity-20" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-400">Одоогоор ямар ч ажил алга</h3>
                            <p className="text-gray-400 mt-2 font-medium">Шинэ ажил нэмэж төлөвлөгөөгөө эхлүүлээрэй.</p>
                        </div>
                    ) : (
                        todos.map((todo) => (
                            <div key={todo.id} className="bg-white rounded-[24px] p-8 border border-gray-100 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                                <div className="space-y-4 flex-1 w-full">
                                    <div className="space-y-2">
                                        <div className="flex items-center flex-wrap gap-3">
                                            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{todo.title}</h3>
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${
                                                todo.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                todo.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                                'bg-green-50 text-green-700 border-green-100'
                                            }`}>
                                                {todo.priority || 'Low'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-lg font-medium leading-relaxed">{todo.description}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 pt-2">
                                        <span className="text-xs font-black text-indigo-600 bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                                            {todo.category || 'Хувийн'}
                                        </span>
                                        {todo.deadline && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                                Дуусах: {new Date(todo.deadline).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                                    <button 
                                        onClick={() => openModal(todo)}
                                        className="flex-1 md:flex-none px-5 py-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                        title="Засах"
                                    >
                                        <Plus size={18} className="rotate-45" />
                                        <span>Засах</span>
                                    </button>
                                    <button 
                                        onClick={() => deleteTodo(todo.id)}
                                        className="flex-1 md:flex-none px-5 py-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                        title="Устгах"
                                    >
                                        <Trash2 size={18} />
                                        <span>Устгах</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* 3. MODAL (Нэмэх болон Засах форм) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 overflow-hidden">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">
                            {editingTodo ? 'Ажил засах' : 'Шинэ ажил нэмэх'}
                        </h2>
                        
                        <form onSubmit={saveTodo} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Гарчиг</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Дуусах хугацаа</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Тайлбар</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ангилал</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="">Сонгох...</option>
                                        {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Чухал түвшин</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="">Сонгох...</option>
                                        {priorities.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Төлөв</label>
                                <select
                                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-bold hover:bg-gray-200 transition"
                                >
                                    Болих
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
                                >
                                    Хадгалах
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
