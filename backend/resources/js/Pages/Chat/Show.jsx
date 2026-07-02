import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export default function ChatShow({ conversation, messages: initialMessages }) {
    const { auth } = usePage().props;
    const [messages, setMessages] = useState(initialMessages.data);
    const [pagination, setPagination] = useState(initialMessages);
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const { data, setData, post, processing, reset } = useForm({
        isi_pesan: '',
        file: null,
    });

    const otherMembers = conversation.members.filter(
        (m) => m.id !== auth.user.id
    );
    const conversationName =
        conversation.tipe === 'grup'
            ? conversation.nama_grup
            : otherMembers.map((m) => m.name).join(', ');

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Scroll to bottom on initial load only
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Echo real-time listener
    // Notifikasi suara
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
        } catch (e) { /* audio tidak didukung */ }
    }, []);

    // Notifikasi browser
    const notifyBrowser = useCallback((title, body) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icons/icon.svg', tag: 'chat' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
        // Update tab title
        document.title = '🔴 ' + title + ' - ' + (import.meta.env.VITE_APP_NAME || 'Laravel');
        setTimeout(() => {
            document.title = title + ' - ' + (import.meta.env.VITE_APP_NAME || 'Laravel');
        }, 5000);
    }, []);

    useEffect(() => {
        if (typeof window.initializeEcho === 'function') {
            window.initializeEcho();
        }

        if (typeof window.Echo !== 'undefined') {
            const channel = window.Echo.private(`conversation.${conversation.id}`);
            channel.listen('.message.sent', (e) => {
                setMessages((prev) => [...prev, e]);

                // Notifikasi jika pesan dari orang lain
                if (e.sender_id !== auth.user.id) {
                    playNotificationSound();
                    const senderName = e.sender?.name || 'Seseorang';
                    const preview = e.tipe_pesan === 'file'
                        ? '📎 ' + (e.file_name || 'File')
                        : e.isi_pesan;
                    notifyBrowser(senderName, preview);
                }
            });

            return () => {
                channel.stopListening('.message.sent');
            };
        }
    }, [conversation.id, auth.user.id, playNotificationSound, notifyBrowser]);

    // Mark as read
    useEffect(() => {
        axios.post('/chat/' + conversation.id + '/read');
    }, [conversation.id]);

    const loadMore = useCallback(async () => {
        if (!pagination.prev_page_url || loading) return;
        setLoading(true);
        try {
            const res = await axios.get(pagination.prev_page_url);
            setPagination(res.data);
            setMessages((prev) => [...res.data.data, ...prev]);
        } finally {
            setLoading(false);
        }
    }, [pagination, loading]);

    // Infinite scroll (load older messages when scrolling up)
    useEffect(() => {
        const el = document.getElementById('messages-container');
        const handleScroll = () => {
            if (el.scrollTop === 0 && pagination.prev_page_url) {
                loadMore();
            }
        };
        el?.addEventListener('scroll', handleScroll);
        return () => el?.removeEventListener('scroll', handleScroll);
    }, [loadMore, pagination.prev_page_url]);

    // Auto-scroll to bottom when new message arrives
    const prevMessagesLength = useRef(messages.length);
    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            scrollToBottom();
        }
        prevMessagesLength.current = messages.length;
    }, [messages.length, scrollToBottom]);

    const handleFileSelect = (file) => {
        if (!file) return;

        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            alert('Ukuran file maksimal 20MB');
            return;
        }

        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/jpg',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword', 'application/vnd.ms-excel',
            'text/plain', 'text/csv',
        ];

        if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
            alert('Tipe file tidak didukung');
            return;
        }

        setData('file', file);
        setFilePreview({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type,
            isImage: file.type.startsWith('image/'),
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        });
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!data.isi_pesan && !data.file) return;

        const isTextOnly = data.isi_pesan && !data.file;
        const messageText = data.isi_pesan;

        // Optimistic UI: tampilkan pesan langsung
        const tempId = 'temp-' + Date.now();
        const optimisticMessage = {
            id: tempId,
            conversation_id: conversation.id,
            sender_id: auth.user.id,
            tipe_pesan: 'text',
            isi_pesan: messageText,
            file_path: null,
            file_type: null,
            file_name: null,
            file_size: null,
            read_at: null,
            created_at: new Date().toISOString(),
            sender: { id: auth.user.id, name: auth.user.name, username: auth.user.username },
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        reset();
        setFilePreview(null);
        scrollToBottom();

        try {
            let responseData;

            const sendUrl = '/chat/' + conversation.id + '/send';

            if (isTextOnly) {
                const res = await axios.post(sendUrl, {
                    isi_pesan: messageText,
                });
                responseData = res.data;
            } else {
                const formData = new FormData();
                if (messageText) formData.append('isi_pesan', messageText);
                if (data.file) formData.append('file', data.file);

                const res = await axios.post(sendUrl, formData, {
                    onUploadProgress: (e) => {
                        if (e.lengthComputable) {
                            setUploadProgress(Math.round((e.loaded * 100) / e.total));
                        }
                    },
                });
                responseData = res.data;
                setUploadProgress(null);
            }

            // Replace optimistic with server data
            if (responseData) {
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === tempId ? responseData : msg))
                );
            }
        } catch (err) {
            console.error('Send failed:', err);
            setUploadProgress(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };

    const getFileIcon = (type) => {
        if (!type) return '📄';
        if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📕';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        return '📄';
    };

    return (
        <div className="flex h-screen flex-col">
            <Head title={conversationName} />
            <style>{`
                .wa-bubble-mine {
                    background-color: #D9FDD3;
                    border-radius: 8px 0 8px 8px;
                }
                .wa-bubble-other {
                    background-color: #FFFFFF;
                    border-radius: 0 8px 8px 8px;
                }
                .chat-bg {
                    background-color: #ECE5DD;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D1C7B7' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }
                .wa-scroll::-webkit-scrollbar { width: 6px; }
                .wa-scroll::-webkit-scrollbar-track { background: transparent; }
                .wa-scroll::-webkit-scrollbar-thumb { background: #CCC; border-radius: 3px; }
            `}</style>

            {/* WhatsApp Header */}
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white shadow-sm">
                <a
                    href={route('chat.main')}
                    className="flex items-center justify-center rounded-full p-1 hover:bg-white/10"
                >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </a>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DFE5E7] text-sm font-bold text-[#54656F]">
                    {conversation.tipe === 'grup'
                        ? (conversation.nama_grup || 'G').charAt(0).toUpperCase()
                        : (otherMembers[0]?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="truncate text-base font-semibold">{conversationName}</h2>
                    <p className="text-xs text-white/70">
                        {conversation.tipe === 'grup'
                            ? conversation.members.length + ' anggota'
                            : 'online'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div
                id="messages-container"
                className="chat-bg flex-1 overflow-y-auto px-3 py-3 wa-scroll text-gray-900"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {loading && (
                    <div className="py-4 text-center text-xs text-[#667781]">
                        Memuat pesan lama...
                    </div>
                )}

                <div className="space-y-1">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[#667781]">
                            <svg className="mb-3 h-12 w-12 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                            </svg>
                            <p className="text-sm">Belum ada pesan</p>
                            <p className="text-xs mt-1">Kirim pesan pertama!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMine = msg.sender_id === auth.user.id;
                            const showSender = !isMine && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-3' : 'mt-0.5'}`}>
                                    <div className={`relative max-w-[75%] ${
                                        isMine
                                            ? 'wa-bubble-mine'
                                            : 'wa-bubble-other shadow-sm'
                                    } px-3 py-1.5`}>
                                        {showSender && (
                                            <p className="mb-0.5 text-xs font-semibold text-[#06CF9C]">
                                                {msg.sender?.name}
                                            </p>
                                        )}

                                        {msg.tipe_pesan === 'file' ? (
                                            <div>
                                                {msg.file_type?.startsWith('image/') && msg.file_path ? (
                                                    <div className="-mx-3 -mt-1.5 mb-1">
                                                        <img
                                                            src={'/storage/' + msg.file_path}
                                                            alt={msg.file_name}
                                                            className="max-h-64 w-full cursor-pointer rounded-t-lg object-cover hover:opacity-90 transition"
                                                            onClick={() => setLightbox({
                                                                src: '/storage/' + msg.file_path,
                                                                name: msg.file_name,
                                                            })}
                                                        />
                                                        {msg.file_name && (
                                                            <p className="px-3 pt-1 text-xs text-[#667781] truncate">{msg.file_name}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <a href={'/storage/' + msg.file_path} target="_blank" rel="noopener noreferrer"
                                                       className="flex items-center gap-2 rounded-lg bg-black/5 p-2 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
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

                                        <div className={`-mr-1 -mb-0.5 flex items-center justify-end gap-0.5 text-[11px] ${
                                            isMine ? 'text-[#667781]' : 'text-[#667781]'
                                        }`}>
                                            <span>
                                                {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            {isMine && (
                                                <span className={msg.read_at ? 'text-[#53BDEB]' : ''}>
                                                    {msg.read_at ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Drag & drop overlay */}
            {dragOver && (
                <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#075E54]/20">
                    <div className="rounded-2xl border-2 border-dashed border-[#25D366] bg-white/95 p-8 text-center shadow-xl">
                        <p className="text-lg font-semibold text-[#075E54]">
                            Lepaskan file di sini
                        </p>
                        <p className="mt-1 text-sm text-[#667781]">
                            PDF, DOCX, XLSX, JPG, PNG (maks 20MB)
                        </p>
                    </div>
                </div>
            )}

            {/* File preview */}
            {filePreview && (
                <div className="bg-[#F0F2F5] px-3 py-2 dark:bg-[#1f2c33]">
                    <div className="flex items-center gap-3 rounded-lg bg-white p-2 dark:bg-[#2A3942]">
                        {filePreview.isImage ? (
                            <img src={filePreview.url} alt="preview" className="h-10 w-10 rounded object-cover" />
                        ) : (
                            <span className="text-2xl">📎</span>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{filePreview.name}</p>
                            <p className="text-xs text-[#667781]">{filePreview.size}</p>
                        </div>
                        <button onClick={() => { setFilePreview(null); setData('file', null); }}
                            className="text-gray-500 hover:text-gray-900">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Upload progress */}
            {uploadProgress !== null && (
                <div className="bg-[#F0F2F5] px-4 py-2 dark:bg-[#1f2c33]">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-[#E9EDEF]">
                        <div className="h-full rounded-full bg-[#25D366] transition-all" style={{ width: uploadProgress + '%' }} />
                    </div>
                    <p className="mt-1 text-xs text-[#667781]">Mengupload... {uploadProgress}%</p>
                </div>
            )}

            {/* WhatsApp Input */}
            <div className="bg-[#F0F2F5] px-3 py-2 dark:bg-[#1f2c33]">
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#667781] hover:bg-white/50 dark:hover:bg-[#2A3942]">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                        </svg>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.doc,.xls,.txt,.csv" />
                    <div className="flex-1">
                        <input type="text" value={data.isi_pesan}
                            onChange={(e) => setData('isi_pesan', e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                            placeholder="Ketik pesan"
                            className="w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm outline-none shadow-sm dark:bg-[#2A3942] dark:text-white dark:placeholder-[#8696A0]"
                        />
                    </div>
                    <button type="submit" disabled={!data.isi_pesan && !data.file}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#667781] disabled:opacity-30 hover:bg-white/50 dark:hover:bg-[#2A3942]">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#00A884">
                            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                        </svg>
                    </button>
                </form>
            </div>

            {/* Lightbox for image preview */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightbox.src}
                            alt={lightbox.name}
                            className="max-h-[85vh] max-w-full rounded-lg object-contain"
                        />
                        <div className="mt-3 flex items-center justify-center gap-3">
                            <a href={lightbox.src} download
                                className="rounded-full bg-white/20 px-5 py-2 text-sm text-white backdrop-blur hover:bg-white/30">
                                ⬇ Download
                            </a>
                            <button onClick={() => setLightbox(null)}
                                className="rounded-full bg-white/20 px-5 py-2 text-sm text-white backdrop-blur hover:bg-white/30">
                                ✕ Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
