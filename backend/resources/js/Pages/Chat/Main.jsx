import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { showNotification } from '../../Lib/notifications';

export default function ChatMain({ conversations, activeConversation, messages: initialMessages }) {
    const { auth } = usePage().props;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [users, setUsers] = useState([]);
    const [mobileView, setMobileView] = useState(activeConversation ? 'chat' : 'list');
    const menuRef = useRef(null);
    const { data, setData, post, processing } = useForm({
        tipe: 'personal',
        nama_grup: '',
        members: [],
    });

    // Chat state
    const conv = activeConversation;
    const convRef = useRef(conv);
    convRef.current = conv;
    const initialMsgs = initialMessages;
    const [messages, setMessages] = useState(initialMsgs?.data || []);
    const [convList, setConvList] = useState(conversations);
    const [pagination, setPagination] = useState(initialMsgs || { data: [] });
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [msgText, setMsgText] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const otherMembers = conv?.members?.filter((m) => m.id !== auth.user.id) || [];
    const conversationName = conv?.tipe === 'grup'
        ? conv.nama_grup
        : otherMembers.map((m) => m.name).join(', ');

    // Close menu on click outside
    useEffect(() => {
        const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        axios.get('/users').then((res) => setUsers(res.data));
    }, []);

    const handleLogout = () => {
        router.post(route('logout'));
    };

    // Sync messages & conversations when activeConversation changes
    useEffect(() => {
        setMessages(initialMsgs?.data || []);
        setPagination(initialMsgs || { data: [] });
        setConvList(conversations);
        prevLen.current = 0;
        if (activeConversation) setMobileView('chat');
    }, [activeConversation, initialMsgs, conversations]);

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

    // === Chat Functions ===
    const playNotificationSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) { /* audio not supported */ }
    }, []);

    // Notifikasi
    const notify = useCallback(async (title, body) => {
        try {
            await showNotification(title, body, { id: Date.now() });
        } catch (_) {}
    }, []);

    // Echo real-time — listen on active conversation channel
    useEffect(() => {
        if (typeof window.initializeEcho === 'function') window.initializeEcho();
        if (typeof window.Echo !== 'undefined' && conv) {
            const channel = window.Echo.private(`conversation.${conv.id}`);
            channel.listen('.message.sent', (e) => {
                setMessages((prev) => [...prev, e]);
                // Update sidebar for incoming messages
                setConvList((prev) => {
                    const updated = prev.map((c) => {
                        if (c.id === e.conversation_id) {
                            const isSameConv = convRef.current?.id === e.conversation_id;
                            return {
                                ...c,
                                last_message: {
                                    id: e.id,
                                    conversation_id: e.conversation_id,
                                    sender_id: e.sender_id,
                                    tipe_pesan: e.tipe_pesan,
                                    isi_pesan: e.isi_pesan,
                                    file_name: e.file_name,
                                    created_at: e.created_at,
                                },
                                unread_count: isSameConv ? (c.unread_count || 0) : (c.unread_count || 0) + 1,
                            };
                        }
                        return c;
                    });
                    updated.sort((a, b) => {
                        const aTime = a.last_message?.created_at || a.created_at;
                        const bTime = b.last_message?.created_at || b.created_at;
                        return new Date(bTime) - new Date(aTime);
                    });
                    return [...updated];
                });
                if (e.sender_id !== auth.user.id) {
                    playNotificationSound();
                    const senderName = e.sender?.name || 'Seseorang';
                    const preview = e.tipe_pesan === 'file' ? '📎 ' + (e.file_name || 'File') : e.isi_pesan;
                    notify(senderName, preview);
                }
            });
            return () => channel.stopListening('.message.sent');
        }
    }, [conv?.id, auth.user.id]);

    // Echo real-time — listen on user's own channel for sidebar updates
    useEffect(() => {
        if (typeof window.initializeEcho === 'function') window.initializeEcho();
        if (typeof window.Echo !== 'undefined' && auth.user?.id) {
            const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);
            channel.listen('.conversation.new.message', (e) => {
                const isActiveConv = convRef.current?.id === e.conversation_id;
                setConvList((prev) => {
                    const updated = prev.map((c) => {
                        if (c.id === e.conversation_id) {
                            return {
                                ...c,
                                last_message: {
                                    id: e.id,
                                    conversation_id: e.conversation_id,
                                    sender_id: e.sender_id,
                                    tipe_pesan: e.tipe_pesan,
                                    isi_pesan: e.isi_pesan,
                                    file_name: e.file_name,
                                    created_at: e.created_at,
                                },
                                // Don't increment unread if user is viewing this conversation
                                unread_count: isActiveConv ? (c.unread_count || 0) : (c.unread_count || 0) + 1,
                            };
                        }
                        return c;
                    });
                    // Sort: most recent conversation first
                    updated.sort((a, b) => {
                        const aTime = a.last_message?.created_at || a.created_at;
                        const bTime = b.last_message?.created_at || b.created_at;
                        return new Date(bTime) - new Date(aTime);
                    });
                    return [...updated];
                });
            });
            return () => channel.stopListening('.conversation.new.message');
        }
    }, [auth.user?.id]);

    // Mark as read
    useEffect(() => {
        if (conv) axios.post('/chat/' + conv.id + '/read');
    }, [conv?.id]);

    const scrollToBottom = useCallback((instant = false) => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
        }, 50);
    }, []);

    // Scroll to bottom on initial load
    useEffect(() => { if (messages.length > 0) scrollToBottom(true); }, []);

    // Auto scroll when any new message arrives (sent or received)
    const prevLen = useRef(0);
    useEffect(() => {
        if (messages.length > prevLen.current) {
            scrollToBottom();
        }
        prevLen.current = messages.length;
    }, [messages.length, scrollToBottom]);

    const loadMore = useCallback(async () => {
        if (!pagination.prev_page_url || loading) return;
        setLoading(true);
        try {
            const res = await axios.get(pagination.prev_page_url);
            setPagination(res.data);
            setMessages((prev) => [...res.data.data, ...prev]);
        } finally { setLoading(false); }
    }, [pagination, loading]);

    useEffect(() => {
        const el = document.getElementById('messages-container');
        const handleScroll = () => { if (el?.scrollTop === 0 && pagination.prev_page_url) loadMore(); };
        el?.addEventListener('scroll', handleScroll);
        return () => el?.removeEventListener('scroll', handleScroll);
    }, [loadMore, pagination.prev_page_url]);

    const handleFileSelect = (file) => {
        if (!file) return;
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) { alert('Ukuran file maksimal 20MB'); return; }
        const allowedTypes = ['image/jpeg','image/png','image/jpg','application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword','application/vnd.ms-excel','text/plain','text/csv'];
        if (file.type && !allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
            alert('Tipe file tidak didukung'); return;
        }
        setFilePreview({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type, isImage: file.type.startsWith('image/'),
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null });
        setSelectedFile(file);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!msgText && !selectedFile) return;
        const isTextOnly = msgText && !selectedFile;
        const tempId = 'temp-' + Date.now();

        const optimisticMessage = {
            id: tempId, conversation_id: conv.id, sender_id: auth.user.id,
            tipe_pesan: 'text', isi_pesan: msgText,
            file_path: null, file_type: null, file_name: null, file_size: null,
            read_at: null, created_at: new Date().toISOString(),
            sender: { id: auth.user.id, name: auth.user.name, username: auth.user.username },
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        const textVal = msgText;
        setMsgText('');
        setFilePreview(null);
        setSelectedFile(null);

        const sendUrl = '/chat/' + conv.id + '/send';
        try {
            let responseData;
            if (isTextOnly) {
                const res = await axios.post(sendUrl, { isi_pesan: textVal });
                responseData = res.data;
            } else {
                const formData = new FormData();
                if (textVal) formData.append('isi_pesan', textVal);
                if (selectedFile) formData.append('file', selectedFile);
                const res = await axios.post(sendUrl, formData, {
                    onUploadProgress: (e) => {
                        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded * 100) / e.total));
                    },
                });
                responseData = res.data;
                setUploadProgress(null);
            }
            if (responseData) {
                setMessages((prev) => prev.map((msg) => msg.id === tempId ? responseData : msg));
                // Update sidebar with sent message
                if (conv) {
                    setConvList((prev) => {
                        const updated = prev.map((c) => {
                            if (c.id === conv.id) {
                                return {
                                    ...c,
                                    unread_count: 0,
                                    last_message: {
                                        id: responseData.id,
                                        conversation_id: conv.id,
                                        sender_id: auth.user.id,
                                        tipe_pesan: responseData.tipe_pesan,
                                        isi_pesan: responseData.isi_pesan,
                                        file_name: responseData.file_name,
                                        created_at: responseData.created_at,
                                    },
                                };
                            }
                            return c;
                        });
                        updated.sort((a, b) => {
                            const aTime = a.last_message?.created_at || a.created_at;
                            const bTime = b.last_message?.created_at || b.created_at;
                            return new Date(bTime) - new Date(aTime);
                        });
                        return [...updated];
                    });
                }
            }
        } catch (err) { console.error('Send failed:', err); setUploadProgress(null); }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return ''; if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };
    const getFileIcon = (type) => {
        if (!type) return '📄'; if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📕'; if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊'; return '📄';
    };
    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const isOnline = (user) => {
        if (!user?.last_seen_at) return false;
        const diff = Date.now() - new Date(user.last_seen_at).getTime();
        return diff < 120000; // online if seen within 2 minutes
    };

    const lastSeenText = (user) => {
        if (!user?.last_seen_at) return 'offline';
        const diff = Date.now() - new Date(user.last_seen_at).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 2) return 'online';
        if (mins < 60) return 'last seen ' + mins + 'm ago';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return 'last seen ' + hours + 'h ago';
        return 'last seen ' + Math.floor(hours / 24) + 'd ago';
    };

    const totalUnread = useMemo(() => {
        return convList.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    }, [convList]);

    // Update document title with unread count
    useEffect(() => {
        const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
        if (totalUnread > 0) {
            document.title = `(${totalUnread}) ${appName}`;
        } else {
            document.title = appName;
        }
    }, [totalUnread]);

    const selectConversation = (id) => {
        router.get('/chat/' + id, {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="flex flex-col sm:flex-row dvh-fallback" style={{ height: '100dvh' }}>
            <Head title={conv ? conversationName : 'Chat'} />
            <style>{`
                .wa-bubble-mine { background-color: #D9FDD3; border-radius: 8px 0 8px 8px; }
                .wa-bubble-other { background-color: #FFFFFF; border-radius: 0 8px 8px 8px; }
                .chat-bg {
                    background-color: #ECE5DD;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D1C7B7' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }
                .wa-scroll::-webkit-scrollbar { width: 6px; }
                .wa-scroll::-webkit-scrollbar-track { background: transparent; }
                .wa-scroll::-webkit-scrollbar-thumb { background: #CCC; border-radius: 3px; }
                /* Safari & iOS fixes */
                input, textarea, select { -webkit-appearance: none; appearance: none; }
                .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
                @supports (height: 100dvh) {
                    .dvh-fallback { height: 100dvh; }
                }
            `}</style>

            {/* ===== SIDEBAR: Conversation List ===== */}
            <div className={`${mobileView === 'chat' && conv ? 'hidden' : 'flex'} sm:flex w-full sm:w-[350px] lg:w-[400px] flex-col border-r border-gray-200 bg-white shrink-0`}>
                {/* Header */}
                <div className="safe-area-top flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2 rounded-full py-1 pr-2 hover:bg-white/10">
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                                {auth.user?.name?.charAt(0).toUpperCase() || '?'}
                                {totalUnread > 0 && (
                                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#075E54]">
                                        {totalUnread > 99 ? '99+' : totalUnread}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{auth.user?.name}</span>
                        </button>
                        {showMenu && (
                            <div className="absolute left-0 top-12 z-50 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5">
                                <div className="border-b border-gray-100 px-4 py-2">
                                    <p className="text-sm font-medium text-gray-900">{auth.user?.name}</p>
                                    <p className="text-xs text-gray-500">@{auth.user?.username}</p>
                                </div>
                                <button onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                    </svg>
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="rounded-full p-2 hover:bg-white/10">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                </div>
                {/* Search — WA style */}
                <div className="bg-white px-3 py-2">
                    <div className="flex items-center gap-3 rounded-lg bg-[#F0F2F5] px-4 py-2">
                        <svg className="h-5 w-5 shrink-0 text-[#54656F]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input type="text" placeholder="Cari atau mulai chat baru" className="w-full bg-transparent text-sm outline-none text-[#111B21] placeholder-[#667781]" />
                        <svg className="h-5 w-5 shrink-0 text-[#54656F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>
                {/* List */}
                <div className="flex-1 overflow-y-auto wa-scroll">
                    {convList.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-[#667781]">
                            <svg className="mb-6 h-24 w-24 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                            </svg>
                            <p className="text-sm font-medium">Belum ada percakapan</p>
                            <p className="mt-1 text-xs">Tap ikon + untuk memulai chat</p>
                        </div>
                    ) : (
                        convList.map((c) => {
                            const ou = c.members?.filter((m) => m.id !== auth.user.id);
                            const name = c.tipe === 'grup' ? c.nama_grup : ou?.map((m) => m.name).join(', ');
                            const initLetter = c.tipe === 'grup' ? (c.nama_grup || 'G').charAt(0).toUpperCase()
                                : (ou?.[0]?.name || '?').charAt(0).toUpperCase();
                            const isActive = conv?.id === c.id;
                            // Format timestamp like WA
                            const fmtTime = (ts) => {
                                if (!ts) return '';
                                const d = new Date(ts);
                                const now = new Date();
                                const diff = now - d;
                                const oneDay = 86400000;
                                if (diff < oneDay && d.getDate() === now.getDate()) {
                                    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                }
                                if (diff < 2 * oneDay && (d.getDate() === now.getDate() - 1 || (now.getDay() === 0 && d.getDay() === 6))) {
                                    return 'Kemarin';
                                }
                                if (diff < 7 * oneDay) {
                                    return d.toLocaleDateString('id-ID', { weekday: 'short' });
                                }
                                return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                            };
                            // Preview text
                            const previewText = c.last_message?.tipe_pesan === 'file'
                                ? '📎 ' + (c.last_message.file_name || 'File')
                                : (c.last_message?.isi_pesan || '');
                            return (
                                <div key={c.id}
                                    onClick={() => selectConversation(c.id)}
                                    className={`flex cursor-pointer items-center gap-3 border-b border-[#F0F2F5] px-4 py-3 transition-colors ${
                                        isActive ? 'bg-[#F0F2F5]' : 'hover:bg-gray-50'
                                    }`}>
                                    {/* Avatar with online dot */}
                                    <div className="relative shrink-0">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                                            isActive ? 'bg-[#075E54] text-white' : 'bg-[#DFE5E7] text-[#54656F]'
                                        }`}>{initLetter}</div>
                                        {c.unread_count > 0 && (
                                            <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-white shadow">
                                                {c.unread_count > 99 ? '99+' : c.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <h3 className={`truncate text-[15px] ${c.unread_count > 0 ? 'font-semibold text-[#111B21]' : 'text-[#111B21]'}`}>{name}</h3>
                                            <span className="ml-2 shrink-0 text-[12px] text-[#667781]">
                                                {fmtTime(c.last_message?.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {c.last_message?.sender_id === auth.user.id && (
                                                <span className="text-[11px] text-[#8696A0]">✓✓</span>
                                            )}
                                            <p className={`truncate text-[14px] ${c.unread_count > 0 ? 'text-[#3B4A54] font-medium' : 'text-[#667781]'}`}>
                                                {previewText || (c.tipe === 'grup' ? (ou?.map(m => m.name).join(', ') || '') : '')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ===== MAIN: Chat View ===== */}
            <div className={`${!conv || mobileView === 'list' ? 'hidden' : 'flex'} sm:flex flex-1 flex-col min-h-0 relative`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}>
                {!conv ? (
                    <div className="hidden sm:flex flex-1 flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <svg className="mb-4 h-20 w-20 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        </svg>
                        <p className="text-lg">Pilih percakapan untuk memulai chat</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="safe-area-top flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white shadow-sm">
                            <button onClick={() => setMobileView('list')} className="relative flex sm:hidden items-center justify-center rounded-full p-1 hover:bg-white/10">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                                {totalUnread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#075E54]">
                                        {totalUnread > 99 ? '99+' : totalUnread}
                                    </span>
                                )}
                            </button>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DFE5E7] text-sm font-bold text-[#54656F]">
                                {conv.tipe === 'grup' ? (conv.nama_grup || 'G').charAt(0).toUpperCase()
                                    : (otherMembers[0]?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="truncate text-base font-semibold">{conversationName}</h2>
                                <p className="text-xs text-white/70">
                                    {conv.tipe === 'grup'
                                        ? conv.members?.length + ' anggota'
                                        : (isOnline(otherMembers[0]) ? 'online' : lastSeenText(otherMembers[0]))}
                                </p>
                            </div>

                        </div>

                        {/* Messages */}
                        <div id="messages-container" className="chat-bg flex-1 overflow-y-auto px-3 pt-3 pb-20 wa-scroll text-gray-900 min-h-0"
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}>
                            {loading && <div className="py-4 text-center text-xs text-gray-500">Memuat pesan lama...</div>}
                            <div className="space-y-1">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                        <p className="text-sm">Belum ada pesan</p>
                                        <p className="mt-1 text-xs">Kirim pesan pertama!</p>
                                    </div>
                                ) : messages.map((msg, idx) => {
                                    const isMine = msg.sender_id === auth.user.id;
                                    const showSender = !isMine && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-3' : 'mt-0.5'}`}>
                                            <div className={`relative max-w-[75%] ${isMine ? 'wa-bubble-mine' : 'wa-bubble-other shadow-sm'} px-3 py-1.5`}>
                                                {showSender && <p className="mb-0.5 text-xs font-semibold text-[#06CF9C]">{msg.sender?.name}</p>}
                                                {msg.tipe_pesan === 'file' ? (
                                                    <div>
                                                        {msg.file_type?.startsWith('image/') && msg.file_path ? (
                                                            <div className="-mx-3 -mt-1.5 mb-1">
                                                                <img src={'/storage/' + msg.file_path} alt={msg.file_name}
                                                                    className="max-h-64 w-full cursor-pointer rounded-t-lg object-cover hover:opacity-90 transition"
                                                                    onClick={() => setLightbox({ src: '/storage/' + msg.file_path, name: msg.file_name })} />
                                                                {msg.file_name && <p className="px-3 pt-1 text-xs text-gray-500 truncate">{msg.file_name}</p>}
                                                            </div>
                                                        ) : (
                                                            <a href={'/storage/' + msg.file_path} target="_blank" rel="noopener noreferrer"
                                                               className="flex items-center gap-2 rounded-lg bg-black/5 p-2 hover:bg-black/10">
                                                                <span className="text-xl">{getFileIcon(msg.file_type)}</span>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium">{msg.file_name || 'File'}</p>
                                                                    <p className="text-xs opacity-70">{formatFileSize(msg.file_size)}</p>
                                                                </div>
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p style={{color:'#111B21',fontSize:'14px',lineHeight:'20px',whiteSpace:'pre-wrap',margin:0}}>
                                                        {msg.isi_pesan}
                                                    </p>
                                                )}
                                                <div className="-mr-1 -mb-0.5 flex items-center justify-end gap-0.5 text-[11px] text-gray-500">
                                                    <span>{new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMine && <span className={msg.read_at ? 'text-[#53BDEB]' : ''}>{msg.read_at ? '✓✓' : '✓'}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Upload progress */}
                        {uploadProgress !== null && (
                            <div className="bg-gray-100 px-4 py-2">
                                <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div className="h-full rounded-full bg-[#25D366] transition-all" style={{ width: uploadProgress + '%' }} />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Mengupload... {uploadProgress}%</p>
                            </div>
                        )}

                        {/* File preview */}
                        {filePreview && (
                            <div className="bg-gray-100 px-3 py-2">
                                <div className="flex items-center gap-3 rounded-lg bg-white p-2">
                                    {filePreview.isImage ? <img src={filePreview.url} alt="preview" className="h-10 w-10 rounded object-cover" />
                                        : <span className="text-2xl">📎</span>}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium">{filePreview.name}</p>
                                        <p className="text-xs text-gray-500">{filePreview.size}</p>
                                    </div>
                                    <button onClick={() => { setFilePreview(null); setSelectedFile(null); }}
                                        className="text-gray-500 hover:text-gray-700">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="bg-gray-100 px-3 py-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-white/50">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                    </svg>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.doc,.xls,.txt,.csv" />
                                <div className="flex-1">
                                    <input type="text" value={msgText}
                                        onChange={(e) => setMsgText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                                        placeholder="Ketik pesan"
                                        className="w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm outline-none shadow-sm" />
                                </div>
                                <button type="submit" disabled={!msgText && !selectedFile}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#00A884">
                                        <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                                    </svg>
                                </button>
                            </form>
                        </div>

                        {/* Drag overlay */}
                        {dragOver && (
                            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#075E54]/20">
                                <div className="rounded-2xl border-2 border-dashed border-[#25D366] bg-white/95 p-8 text-center shadow-xl">
                                    <p className="text-lg font-semibold text-[#075E54]">Lepaskan file di sini</p>
                                    <p className="mt-1 text-sm text-gray-500">PDF, DOCX, XLSX, JPG, PNG (maks 20MB)</p>
                                </div>
                            </div>
                        )}

                        {/* Lightbox */}
                        {lightbox && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
                                <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
                                    <img src={lightbox.src} alt={lightbox.name} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
                                    <div className="mt-3 flex items-center justify-center gap-3">
                                        <a href={lightbox.src} download className="rounded-full bg-white/20 px-5 py-2 text-sm text-white backdrop-blur hover:bg-white/30">⬇ Download</a>
                                        <button onClick={() => setLightbox(null)} className="rounded-full bg-white/20 px-5 py-2 text-sm text-white backdrop-blur hover:bg-white/30">✕ Tutup</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* FAB for new chat (mobile only) */}
            {mobileView === 'list' && (
                <button onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5E] sm:hidden">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
                    <div className="w-full rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Percakapan Baru</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                        <form onSubmit={createConversation}>
                            {auth.user?.role !== 'guest' && (
                                <div className="mb-4">
                                    <label className="mb-1 block text-xs font-medium text-gray-500">Tipe</label>
                                    <select value={data.tipe} onChange={(e) => setData('tipe', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#25D366]">
                                        <option value="personal">Personal</option>
                                        <option value="grup">Grup</option>
                                    </select>
                                </div>
                            )}
                            {data.tipe === 'grup' && (
                                <div className="mb-4">
                                    <label className="mb-1 block text-xs font-medium text-gray-500">Nama Grup</label>
                                    <input type="text" value={data.nama_grup} onChange={(e) => setData('nama_grup', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#25D366]" placeholder="Nama grup..." />
                                </div>
                            )}
                            <div className="mb-4">
                                <label className="mb-1 block text-xs font-medium text-gray-500">Anggota</label>
                                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                                    {users.map((user) => (
                                        <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-gray-500">@{user.username}</p>
                                            </div>
                                            <input type="checkbox" checked={data.members.includes(user.id)}
                                                onChange={() => toggleMember(user.id)} className="h-5 w-5 rounded accent-[#25D366]" />
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={processing || data.members.length === 0}
                                className="w-full rounded-lg bg-[#075E54] py-3 text-sm font-semibold text-white hover:bg-[#054D44] disabled:opacity-50">
                                Buat Percakapan
                            </button>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}