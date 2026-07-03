import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ChatIndex({ conversations }) {
    const { auth } = usePage().props;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const { data, setData, post, processing } = useForm({
        tipe: 'personal',
        nama_grup: '',
        members: [],
    });

    useEffect(() => {
        axios.get('/users').then((res) => setUsers(res.data));
    }, []);

    const toggleMember = (userId) => {
        const current = data.members;
        if (current.includes(userId)) {
            setData('members', current.filter((id) => id !== userId));
        } else {
            setData('members', [...current, userId]);
        }
    };

    const createConversation = (e) => {
        e.preventDefault();
        post(route('chat.create'), {
            onSuccess: () => setShowCreateModal(false),
        });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
            <Head title="Chat" />
            <style>{`
                .wa-scroll::-webkit-scrollbar { width: 6px; }
                .wa-scroll::-webkit-scrollbar-track { background: transparent; }
                .wa-scroll::-webkit-scrollbar-thumb { background: #CCC; border-radius: 3px; }
            `}</style>

            {/* WhatsApp Header */}
            <div className="safe-area-top flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
                <h1 className="text-lg font-semibold">Chat App</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-full p-2 hover:bg-white/10"
                >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white px-4 py-2 dark:bg-[#111B21]">
                <div className="flex items-center gap-2 rounded-lg bg-[#F0F2F5] px-3 py-2 dark:bg-[#202C33]">
                    <svg className="h-5 w-5 text-[#667781]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari atau mulai chat baru"
                        className="w-full bg-transparent text-sm outline-none dark:text-white"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto wa-scroll">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#667781]">
                        <svg className="mb-4 h-16 w-16 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        </svg>
                        <p className="text-sm">Belum ada percakapan</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const otherUser = conv.members?.filter((m) => m.id !== auth.user.id);
                        const convName = conv.tipe === 'grup'
                            ? conv.nama_grup
                            : otherUser?.map((m) => m.name).join(', ');
                        const initials = conv.tipe === 'grup'
                            ? (conv.nama_grup || 'G').charAt(0).toUpperCase()
                            : otherUser?.map((m) => m.name.charAt(0).toUpperCase()).join('');

                        return (
                            <Link
                                key={conv.id}
                                href={route('chat.show', conv.id)}
                                className="flex items-center gap-3 border-b border-[#E9EDEF] px-4 py-3 transition hover:bg-[#F0F2F5] dark:border-[#313D45] dark:hover:bg-[#202C33]"
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DFE5E7] text-sm font-bold text-[#54656F] dark:bg-[#2A3942] dark:text-[#AEBAC1]">
                                        {initials}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between">
                                        <h3 className={`truncate text-base ${
                                            conv.unread_count > 0
                                                ? 'font-semibold text-[#111B21] dark:text-[#E9EDEF]'
                                                : 'text-[#111B21] dark:text-[#E9EDEF]'
                                        }`}>
                                            {convName}
                                        </h3>
                                        <span className="ml-2 shrink-0 text-[11px] text-[#667781]">
                                            {conv.last_message?.created_at
                                                ? formatTime(conv.last_message.created_at)
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`truncate text-sm ${
                                            conv.unread_count > 0
                                                ? 'text-[#111B21] dark:text-[#AEBAC1]'
                                                : 'text-[#667781]'
                                        }`}>
                                            {conv.last_message?.tipe_pesan === 'file'
                                                ? '📎 ' + (conv.last_message.file_name || 'File')
                                                : (conv.last_message?.isi_pesan || '')}
                                        </p>
                                        {conv.unread_count > 0 && (
                                            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-white">
                                                {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* FAB New Chat (Mobile) */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5E]"
            >
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
            </button>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
                    <div className="w-full rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl dark:bg-[#1f2c33]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                                Percakapan Baru
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-[#667781]">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={createConversation}>
                            {auth.user?.role !== 'guest' && (
                                <div className="mb-4">
                                    <label className="mb-1 block text-xs font-medium text-[#667781]">Tipe</label>
                                    <select
                                        value={data.tipe}
                                        onChange={(e) => setData('tipe', e.target.value)}
                                        className="w-full rounded-lg border border-[#E9EDEF] bg-[#F0F2F5] px-3 py-2.5 text-sm outline-none focus:border-[#25D366] dark:border-[#313D45] dark:bg-[#2A3942] dark:text-white"
                                    >
                                        <option value="personal">Personal</option>
                                        <option value="grup">Grup</option>
                                    </select>
                                </div>
                            )}

                            {data.tipe === 'grup' && (
                                <div className="mb-4">
                                    <label className="mb-1 block text-xs font-medium text-[#667781]">Nama Grup</label>
                                    <input
                                        type="text"
                                        value={data.nama_grup}
                                        onChange={(e) => setData('nama_grup', e.target.value)}
                                        className="w-full rounded-lg border border-[#E9EDEF] bg-[#F0F2F5] px-3 py-2.5 text-sm outline-none focus:border-[#25D366] dark:border-[#313D45] dark:bg-[#2A3942] dark:text-white"
                                        placeholder="Nama grup..."
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="mb-1 block text-xs font-medium text-[#667781]">Anggota</label>
                                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#E9EDEF] p-2 dark:border-[#313D45]">
                                    {users.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942]"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DFE5E7] text-xs font-bold text-[#54656F]">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[#111B21] dark:text-[#E9EDEF]">{user.name}</p>
                                                <p className="text-xs text-[#667781]">@{user.username}</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={data.members.includes(user.id)}
                                                onChange={() => toggleMember(user.id)}
                                                className="h-5 w-5 rounded accent-[#25D366]"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || data.members.length === 0}
                                className="w-full rounded-lg bg-[#075E54] py-3 text-sm font-semibold text-white hover:bg-[#054D44] disabled:opacity-50"
                            >
                                Buat Percakapan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
