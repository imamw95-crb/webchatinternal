import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Color Palette ───────────────────────────────────────────────
const COLORS = ['#075E54', '#128C7E', '#25D366', '#dcf8c6', '#34b7f1', '#757575'];
const ROLE_COLORS = {
    admin: '#ef4444',
    customerservice: '#3b82f6',
    userinternal: '#8b5cf6',
    user: '#f59e0b',
    guest: '#10b981',
};

const ROLE_LABELS = {
    admin: 'Admin',
    customerservice: 'CS',
    userinternal: 'Internal',
    user: 'User',
    guest: 'Guest',
};

// ─── Stats Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
    return (
        <div className="overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
            <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-0.5 text-2xl font-bold text-gray-900">{value?.toLocaleString() ?? 0}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Modal ───────────────────────────────────────────────────────
function Modal({ show, onClose, title, children }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard({ stats, messagesPerDay, usersByRole, conversationsPerDay, isAdmin, isCs }) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');

    // ── Users state ──
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userPagination, setUserPagination] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // ── Add / Edit User state ──
    const [showAddUser, setShowAddUser] = useState(false);
    const [showEditUser, setShowEditUser] = useState(false);
    const [editUserData, setEditUserData] = useState(null);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'user', status_aktif: true });
    const [formErrors, setFormErrors] = useState({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // ── Conversations state ──
    const [conversations, setConversations] = useState([]);
    const [convLoading, setConvLoading] = useState(false);
    const [convSearch, setConvSearch] = useState('');
    const [convPage, setConvPage] = useState(1);
    const [convPagination, setConvPagination] = useState(null);
    const [peekConv, setPeekConv] = useState(null);
    const [peekMessages, setPeekMessages] = useState([]);
    const [peekLoading, setPeekLoading] = useState(false);

    // ── Load users ──
    const loadUsers = async (page = 1) => {
        setUsersLoading(true);
        try {
            const params = { page };
            if (userSearch) params.search = userSearch;
            if (roleFilter) params.role = roleFilter;
            const res = await axios.get('/admin/users', { params });
            setUsers(res.data.data);
            setUserPagination(res.data);
            setUserPage(page);
        } catch (e) { console.error(e); }
        setUsersLoading(false);
    };

    useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);

    // ── Load conversations ──
    const loadConversations = async (page = 1) => {
        setConvLoading(true);
        try {
            const params = { page };
            if (convSearch) params.search = convSearch;
            const res = await axios.get('/admin/conversations', { params });
            setConversations(res.data.data);
            setConvPagination(res.data);
            setConvPage(page);
        } catch (e) { console.error(e); }
        setConvLoading(false);
    };

    useEffect(() => { if (isAdmin && activeTab === 'peek') loadConversations(); }, [isAdmin, activeTab]);

    // ── Peek conversation ──
    const handlePeek = async (conv) => {
        setPeekLoading(true);
        setPeekConv(conv);
        try {
            const res = await axios.get(`/admin/conversations/${conv.id}/peek`);
            setPeekMessages(res.data.messages.data);
        } catch (e) { console.error(e); }
        setPeekLoading(false);
    };

    // ── Toggle user status ──
    const handleToggleStatus = async (user) => {
        try {
            await axios.patch(`/admin/users/${user.id}/toggle-status`);
            loadUsers(userPage);
        } catch (e) { console.error(e); }
    };

    // ── Update user role ──
    const handleUpdateRole = async (user, newRole) => {
        try {
            await axios.patch(`/admin/users/${user.id}/role`, { role: newRole });
            loadUsers(userPage);
            setSelectedUser(null);
        } catch (e) { console.error(e); }
    };

    // ── Open Add User modal ──
    const openAddUser = () => {
        setFormData({ name: '', username: '', password: '', role: 'user', status_aktif: true });
        setFormErrors({});
        setShowAddUser(true);
    };

    // ── Open Edit User modal ──
    const openEditUser = (user) => {
        setEditUserData(user);
        setFormData({
            name: user.name || '',
            username: user.username || '',
            password: '',
            role: user.role || 'user',
            status_aktif: user.status_aktif ?? true,
        });
        setFormErrors({});
        setShowEditUser(true);
    };

    // ── Handle form input change ──
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // ── Submit Add User ──
    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);
        setFormErrors({});
        try {
            await axios.post('/admin/users', formData);
            setShowAddUser(false);
            loadUsers(1);
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                const errors = {};
                Object.entries(err.response.data.errors).forEach(([key, msgs]) => {
                    errors[key] = msgs[0];
                });
                setFormErrors(errors);
            } else {
                alert('Gagal menambahkan pengguna. Silakan coba lagi.');
            }
        }
        setFormSubmitting(false);
    };

    // ── Submit Edit User ──
    const handleEditUser = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);
        setFormErrors({});
        try {
            await axios.put(`/admin/users/${editUserData.id}`, formData);
            setShowEditUser(false);
            setEditUserData(null);
            loadUsers(userPage);
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                const errors = {};
                Object.entries(err.response.data.errors).forEach(([key, msgs]) => {
                    errors[key] = msgs[0];
                });
                setFormErrors(errors);
            } else {
                alert('Gagal memperbarui pengguna. Silakan coba lagi.');
            }
        }
        setFormSubmitting(false);
    };

    // ── Format date ──
    const fmtDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const fmtShortDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    };

    // ── Stats cards data ──
    const statCards = [
        { icon: '👥', label: 'Total Pengguna', value: stats?.totalUsers, color: 'bg-blue-50 text-blue-600' },
        { icon: '💬', label: 'Total Percakapan', value: stats?.totalConversations, color: 'bg-emerald-50 text-emerald-600' },
        { icon: '✉️', label: 'Total Pesan', value: stats?.totalMessages, color: 'bg-purple-50 text-purple-600' },
        ...(isCs ? [{ icon: '🔴', label: 'Pesan Belum Dibaca', value: stats?.unreadMessages, color: 'bg-rose-50 text-rose-600' }] : []),
        { icon: '🟢', label: 'Aktif Hari Ini', value: stats?.activeToday, color: 'bg-green-50 text-green-600' },
    ];

    const tabs = [
        { id: 'overview', label: '📊 Ringkasan', adminOnly: false },
        { id: 'users', label: '👥 Pengguna', adminOnly: true },
        { id: 'peek', label: '🔍 Intip Chat', adminOnly: true },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>
                    {isAdmin && (
                        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                            {tabs.filter(t => !t.adminOnly || isAdmin).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white text-[#075E54] shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* ═══ OVERVIEW TAB ═══ */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Stats Cards */}
                            <div className={`grid gap-4 sm:grid-cols-2 ${isCs ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                                {statCards.map((card, i) => (
                                    <StatCard key={i} {...card} />
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Messages per Day */}
                                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-700">📈 Pesan per Hari (14 Hari Terakhir)</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={messagesPerDay}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtShortDate(v)} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <Tooltip
                                                labelFormatter={(v) => fmtShortDate(v)}
                                                formatter={(v) => [v, 'Pesan']}
                                                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="count" stroke="#075E54" strokeWidth={2} dot={{ fill: '#075E54', r: 3 }} activeDot={{ r: 5 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Users by Role */}
                                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-700">👥 Pengguna Berdasarkan Role</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={usersByRole}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="count"
                                                nameKey="role"
                                                label={({ role, count }) => `${ROLE_LABELS[role] || role}: ${count}`}
                                            >
                                                {usersByRole?.map((entry, i) => (
                                                    <Cell key={i} fill={ROLE_COLORS[entry.role] || COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, name) => [v, ROLE_LABELS[name] || name]} />
                                            <Legend formatter={(value) => ROLE_LABELS[value] || value} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Conversations per Day */}
                            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                                <h3 className="mb-4 text-sm font-semibold text-gray-700">📊 Percakapan Baru per Hari (14 Hari Terakhir)</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={conversationsPerDay}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtShortDate(v)} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            labelFormatter={(v) => fmtShortDate(v)}
                                            formatter={(v) => [v, 'Percakapan Baru']}
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                                        />
                                        <Bar dataKey="count" fill="#128C7E" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Quick Links for non-admin users */}
                            {!isAdmin && (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Link href={route('chat.main')} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">💬</div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
                                                <p className="text-sm text-gray-500">Mulai atau lanjutkan percakapan</p>
                                            </div>
                                        </div>
                                    </Link>
                                    <Link href={route('profile.edit')} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">👤</div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Profil</h3>
                                                <p className="text-sm text-gray-500">Kelola informasi akun</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ USERS TAB (Admin Only) ═══ */}
                    {activeTab === 'users' && isAdmin && (
                        <div className="space-y-4">
                            {/* Search & Filter */}
                            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                                <div className="relative flex-1 min-w-[200px]">
                                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input
                                        type="text" placeholder="Cari pengguna..."
                                        value={userSearch}
                                        onChange={(e) => { setUserSearch(e.target.value); setTimeout(() => loadUsers(1), 300); }}
                                        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none"
                                    />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); loadUsers(1); }}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none"
                                >
                                    <option value="">Semua Role</option>
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={openAddUser}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d44] transition shadow-sm"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Tambah Pengguna
                                </button>
                            </div>

                            {/* Users Table */}
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pengguna</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Username</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">No. RM</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Terakhir Dilihat</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {usersLoading ? (
                                                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Memuat data...</td></tr>
                                            ) : users.length === 0 ? (
                                                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Tidak ada pengguna ditemukan</td></tr>
                                            ) : (
                                                users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">#{user.id}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${user.status_aktif ? 'bg-[#075E54]' : 'bg-gray-400'}`}>
                                                                    {getInitials(user.name)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                                    {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{user.username}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{user.no_rm || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                                style={{ backgroundColor: ROLE_COLORS[user.role] + '20', color: ROLE_COLORS[user.role] }}>
                                                                {ROLE_LABELS[user.role] || user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                user.status_aktif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                            }`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${user.status_aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                {user.status_aktif ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{user.last_seen_at ? fmtDate(user.last_seen_at) : 'Tidak pernah'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => openEditUser(user)}
                                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedUser(user)}
                                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#075E54] hover:bg-[#075E54]/10 transition"
                                                                >
                                                                    Atur Role
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleStatus(user)}
                                                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                                                        user.status_aktif
                                                                            ? 'text-red-600 hover:bg-red-50'
                                                                            : 'text-green-600 hover:bg-green-50'
                                                                    }`}
                                                                >
                                                                    {user.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {userPagination && userPagination.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                                        <p className="text-sm text-gray-500">
                                            Halaman {userPagination.current_page} dari {userPagination.last_page}
                                        </p>
                                        <div className="flex gap-1">
                                            <button
                                                disabled={userPagination.current_page <= 1}
                                                onClick={() => loadUsers(userPagination.current_page - 1)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                            >
                                                ← Sebelumnya
                                            </button>
                                            <button
                                                disabled={userPagination.current_page >= userPagination.last_page}
                                                onClick={() => loadUsers(userPagination.current_page + 1)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                            >
                                                Selanjutnya →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Role Editor Modal */}
                            <Modal show={!!selectedUser} onClose={() => setSelectedUser(null)} title={`Atur Role - ${selectedUser?.name || ''}`}>
                                {selectedUser && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-500">Pilih role baru untuk <strong>{selectedUser.name}</strong>:</p>
                                        <div className="grid gap-2">
                                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleUpdateRole(selectedUser, key)}
                                                    disabled={selectedUser.role === key}
                                                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                                                        selectedUser.role === key
                                                            ? 'border-[#075E54] bg-[#075E54]/5 cursor-not-allowed'
                                                            : 'border-gray-200 hover:border-[#075E54] hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                                                        style={{ backgroundColor: ROLE_COLORS[key] }}>
                                                        {label[0]}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{label}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {selectedUser.role === key ? 'Role saat ini' : 'Klik untuk mengubah'}
                                                        </p>
                                                    </div>
                                                    {selectedUser.role === key && (
                                                        <span className="ml-auto text-xs text-[#075E54] font-medium">✓ Aktif</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Modal>

                            {/* ── Add User Modal ── */}
                            <Modal show={showAddUser} onClose={() => setShowAddUser(false)} title="Tambah Pengguna Baru">
                                <form onSubmit={handleAddUser} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text" required
                                            value={formData.name}
                                            onChange={(e) => handleFormChange('name', e.target.value)}
                                            className={`w-full rounded-lg border ${formErrors.name ? 'border-red-400' : 'border-gray-200'} px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none`}
                                            placeholder="Masukkan nama lengkap"
                                        />
                                        {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            type="text" required
                                            value={formData.username}
                                            onChange={(e) => handleFormChange('username', e.target.value)}
                                            className={`w-full rounded-lg border ${formErrors.username ? 'border-red-400' : 'border-gray-200'} px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none`}
                                            placeholder="Masukkan username"
                                        />
                                        {formErrors.username && <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input
                                            type="password" required
                                            value={formData.password}
                                            onChange={(e) => handleFormChange('password', e.target.value)}
                                            className={`w-full rounded-lg border ${formErrors.password ? 'border-red-400' : 'border-gray-200'} px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none`}
                                            placeholder="Minimal 6 karakter"
                                        />
                                        {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => handleFormChange('role', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none"
                                        >
                                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                        {formErrors.role && <p className="mt-1 text-xs text-red-500">{formErrors.role}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox" id="add-status-aktif"
                                            checked={formData.status_aktif}
                                            onChange={(e) => handleFormChange('status_aktif', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#075E54] focus:ring-[#075E54]"
                                        />
                                        <label htmlFor="add-status-aktif" className="text-sm text-gray-700">Aktif</label>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddUser(false)}
                                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formSubmitting}
                                            className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d44] transition disabled:opacity-50"
                                        >
                                            {formSubmitting ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                </form>
                            </Modal>

                            {/* ── Edit User Modal ── */}
                            <Modal show={showEditUser} onClose={() => { setShowEditUser(false); setEditUserData(null); }} title={`Edit Pengguna - ${editUserData?.name || ''}`}>
                                <form onSubmit={handleEditUser} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text" required
                                            value={formData.name}
                                            onChange={(e) => handleFormChange('name', e.target.value)}
                                            className={`w-full rounded-lg border ${formErrors.name ? 'border-red-400' : 'border-gray-200'} px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none`}
                                            placeholder="Masukkan nama lengkap"
                                        />
                                        {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            type="text" required
                                            value={formData.username}
                                            onChange={(e) => handleFormChange('username', e.target.value)}
                                            className={`w-full rounded-lg border ${formErrors.username ? 'border-red-400' : 'border-gray-200'} px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none`}
                                            placeholder="Masukkan username"
                                        />
                                        {formErrors.username && <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-gray-400 font-normal">(biarkan kosong jika tidak diubah)</span></label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleFormChange('password', e.target.value)}
                                            className={`w-full rounded-lg border ${formErrors.password ? 'border-red-400' : 'border-gray-200'} px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none`}
                                            placeholder="Kosongkan jika tidak ingin mengubah"
                                        />
                                        {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => handleFormChange('role', e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none"
                                        >
                                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                        {formErrors.role && <p className="mt-1 text-xs text-red-500">{formErrors.role}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox" id="edit-status-aktif"
                                            checked={formData.status_aktif}
                                            onChange={(e) => handleFormChange('status_aktif', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#075E54] focus:ring-[#075E54]"
                                        />
                                        <label htmlFor="edit-status-aktif" className="text-sm text-gray-700">Aktif</label>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowEditUser(false); setEditUserData(null); }}
                                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formSubmitting}
                                            className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d44] transition disabled:opacity-50"
                                        >
                                            {formSubmitting ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                </form>
                            </Modal>
                        </div>
                    )}

                    {/* ═══ PEEK CHAT TAB (Admin Only) ═══ */}
                    {activeTab === 'peek' && isAdmin && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                                <svg className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text" placeholder="Cari percakapan berdasarkan nama atau username..."
                                    value={convSearch}
                                    onChange={(e) => { setConvSearch(e.target.value); setTimeout(() => loadConversations(1), 300); }}
                                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none"
                                />
                            </div>

                            {/* Conversations Table */}
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Percakapan</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tipe</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Anggota</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pesan Terakhir</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {convLoading ? (
                                                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">Memuat data...</td></tr>
                                            ) : conversations.length === 0 ? (
                                                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">Tidak ada percakapan</td></tr>
                                            ) : (
                                                conversations.map((conv) => (
                                                    <tr key={conv.id} className="hover:bg-gray-50 transition">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#075E54]/10 text-sm">
                                                                    {conv.tipe === 'grup' ? '👥' : '💬'}
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {conv.tipe === 'grup' ? conv.nama_grup : 'Personal Chat'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                conv.tipe === 'grup' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                                            }`}>
                                                                {conv.tipe === 'grup' ? 'Grup' : 'Personal'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex -space-x-2">
                                                                {conv.members?.slice(0, 4).map((m) => (
                                                                    <div key={m.id} title={`${m.name} (${ROLE_LABELS[m.role] || m.role})`}
                                                                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
                                                                        style={{ backgroundColor: ROLE_COLORS[m.role] || '#757575' }}>
                                                                        {getInitials(m.name)}
                                                                    </div>
                                                                ))}
                                                                {(conv.members?.length || 0) > 4 && (
                                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-medium text-gray-500">
                                                                        +{conv.members.length - 4}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 max-w-[200px]">
                                                            {conv.last_message ? (
                                                                <div>
                                                                    <p className="truncate text-sm text-gray-600">
                                                                        <span className="font-medium text-gray-800">{conv.last_message.sender?.name?.split(' ')[0]}: </span>
                                                                        {conv.last_message.tipe_pesan === 'file' ? '📎 File' : conv.last_message.isi_pesan}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">{fmtDate(conv.last_message.created_at)}</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-400">Belum ada pesan</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handlePeek(conv)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#075E54]/10 px-3 py-1.5 text-xs font-medium text-[#075E54] hover:bg-[#075E54]/20 transition"
                                                            >
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                Intip
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {convPagination && convPagination.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                                        <p className="text-sm text-gray-500">
                                            Halaman {convPagination.current_page} dari {convPagination.last_page}
                                        </p>
                                        <div className="flex gap-1">
                                            <button
                                                disabled={convPagination.current_page <= 1}
                                                onClick={() => loadConversations(convPagination.current_page - 1)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                            >
                                                ← Sebelumnya
                                            </button>
                                            <button
                                                disabled={convPagination.current_page >= convPagination.last_page}
                                                onClick={() => loadConversations(convPagination.current_page + 1)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                            >
                                                Selanjutnya →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Peek Messages Modal */}
                            <Modal show={!!peekConv} onClose={() => { setPeekConv(null); setPeekMessages([]); }} title={`💬 Intip Percakapan`}>
                                {peekConv && (
                                    <div className="space-y-4">
                                        {/* Conversation Info */}
                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#075E54]/10 text-lg">
                                                    {peekConv.tipe === 'grup' ? '👥' : '💬'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {peekConv.tipe === 'grup' ? peekConv.nama_grup : 'Personal Chat'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {peekConv.tipe === 'grup' ? 'Grup' : 'Personal'} · {peekConv.members?.length || 0} anggota
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {peekConv.members?.map((m) => (
                                                    <div key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs shadow-sm">
                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLE_COLORS[m.role] || '#757575' }} />
                                                        <span className="font-medium text-gray-700">{m.name}</span>
                                                        <span className="text-gray-400">({ROLE_LABELS[m.role] || m.role})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        {peekLoading ? (
                                            <div className="py-12 text-center text-sm text-gray-400">Memuat pesan...</div>
                                        ) : peekMessages.length === 0 ? (
                                            <div className="py-12 text-center text-sm text-gray-400">Belum ada pesan dalam percakapan ini</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {[...peekMessages].reverse().map((msg) => (
                                                    <div key={msg.id} className={`flex ${msg.sender_id === auth.user.id ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                                            msg.sender_id === auth.user.id
                                                                ? 'bg-[#075E54] text-white rounded-br-md'
                                                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                                        }`}>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className={`text-xs font-medium ${msg.sender_id === auth.user.id ? 'text-white/80' : 'text-[#075E54]'}`}>
                                                                    {msg.sender?.name}
                                                                </span>
                                                                <span className={`text-[10px] ${msg.sender_id === auth.user.id ? 'text-white/50' : 'text-gray-400'}`}>
                                                                    {fmtDate(msg.created_at)}
                                                                </span>
                                                            </div>
                                                            {msg.tipe_pesan === 'file' ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span>📎</span>
                                                                    <span className="text-sm">{msg.file_name || 'File'}</span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm whitespace-pre-wrap">{msg.isi_pesan}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Modal>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
