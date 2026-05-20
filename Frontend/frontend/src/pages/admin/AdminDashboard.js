import React, { useState, useEffect } from 'react';
import {
    Users,
    BarChart3,
    ShieldCheck,
    Activity,
    ArrowUpRight,
    UserPlus,
    MoreVertical,
    Search,
    CheckCircle2,
    XCircle,
    Megaphone,
    LifeBuoy,
    Clock
} from 'lucide-react';
import { getAdminStats, getAllUsers, updateUserRole, broadcastAnnouncement, updateUserStatus, getSupportTickets, updateTicketStatus } from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [announcement, setAnnouncement] = useState("");
    const [broadcasting, setBroadcasting] = useState(false);
    const [search, setSearch] = useState("");
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState('users'); // users | support

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsData, usersData, ticketsData] = await Promise.all([
                getAdminStats(),
                getAllUsers(),
                getSupportTickets().catch(() => [])
            ]);
            setStats(statsData);
            setUsers(usersData);
            setTickets(ticketsData);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (email, newRole) => {
        try {
            await updateUserRole(email, newRole);
            const updatedUsers = await getAllUsers();
            setUsers(updatedUsers);
        } catch (error) {
            alert("Failed to update role");
        }
    };

    const handleStatusToggle = async (email, currentStatus) => {
        try {
            const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
            await updateUserStatus(email, newStatus);
            const updatedUsers = await getAllUsers();
            setUsers(updatedUsers);
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    const handleBroadcast = async () => {
        if (!announcement) return;
        try {
            setBroadcasting(true);
            await broadcastAnnouncement(announcement);
            setAnnouncement("");
            alert("Announcement sent!");
        } catch (error) {
            alert("Failed to send announcement");
        } finally {
            setBroadcasting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const handleResolveTicket = async (id) => {
        try {
            await updateTicketStatus(id, 'resolved');
            setTickets(tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
        } catch (error) {
            alert("Failed to resolve ticket");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Administration</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage global access and platform intelligence</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-bold shadow-sm hover:bg-slate-50 transition-all">
                        <Activity size={18} />
                        <span>Audit Logs</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-purple-600 px-4 py-2 rounded-xl text-white font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all">
                        <BarChart3 size={18} />
                        <span>Full Report</span>
                    </button>
                </div>
            </div>

            {/* Stats Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Members"
                    value={stats?.total_users || 0}
                    icon={<Users className="text-blue-600" />}
                    trend="+12% this week"
                    color="bg-blue-50"
                />
                <StatsCard
                    title="AI Diagnoses"
                    value={stats?.total_analyses || 0}
                    icon={<ArrowUpRight className="text-purple-600" />}
                    trend="+5.2% accuracy"
                    color="bg-purple-50"
                />
                <StatsCard
                    title="Expert Reviews"
                    value="42"
                    icon={<ShieldCheck className="text-emerald-600" />}
                    trend="8 pending validation"
                    color="bg-emerald-50"
                />
                <StatsCard
                    title="System Health"
                    value="99.9%"
                    icon={<Activity className="text-orange-600" />}
                    trend="All services active"
                    color="bg-orange-50"
                />
            </div>

            {/* View Toggle Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button 
                  onClick={() => setActiveTab('users')} 
                  className={`px-6 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                  Member Directory
                </button>
                <button 
                  onClick={() => setActiveTab('support')} 
                  className={`px-6 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'support' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-800 flex items-center gap-2'}`}>
                  Support Tickets
                  {tickets.filter(t => t.status === 'open').length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tickets.filter(t => t.status === 'open').length}</span>
                  )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area based on Tab */}
                {activeTab === 'users' && (
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Member Directory</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Email Address</th>
                                    <th className="px-6 py-4 text-left">Current Role</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.email} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className={`text-xs font-black uppercase px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-purple-500 cursor-pointer
                                                ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                        user.role === 'expert' ? 'bg-blue-100 text-blue-700' :
                                                            user.role === 'premium' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-600'}`}
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.email, e.target.value)}
                                            >
                                                <option value="user">User</option>
                                                <option value="premium">Premium</option>
                                                <option value="expert">Expert</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleStatusToggle(user.email, user.status || 'active')}
                                                className={`flex items-center text-sm font-bold px-3 py-1 rounded-full transition-all active:scale-95
                                                    ${(user.status || 'active') === 'active'
                                                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                        : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                                            >
                                                {(user.status || 'active') === 'active' ? (
                                                    <><CheckCircle2 size={14} className="mr-1.5" /> Active</>
                                                ) : (
                                                    <><XCircle size={14} className="mr-1.5" /> Blocked</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
                )}

                {activeTab === 'support' && (
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><LifeBuoy className="text-indigo-500" /> Active Support Tickets</h2>
                      </div>
                      <div className="space-y-4">
                          {tickets.length === 0 ? (
                              <div className="text-center py-10 text-slate-400 font-medium">No support tickets found.</div>
                          ) : (
                              tickets.map(ticket => (
                                  <div key={ticket.id} className={`p-4 rounded-2xl border ${ticket.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-white border-amber-200 shadow-sm'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${ticket.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                  {ticket.priority} Priority
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-400 ml-2">ID: {ticket.id}</span>
                                          </div>
                                          <span className={`text-xs font-bold flex items-center gap-1 ${ticket.status === 'resolved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                              {ticket.status === 'resolved' ? <CheckCircle2 size={14} /> : <Clock size={14} />} 
                                              {ticket.status}
                                          </span>
                                      </div>
                                      <h3 className="font-bold text-slate-900 mt-2">{ticket.subject}</h3>
                                      <p className="text-sm text-slate-600 mt-1">{ticket.message}</p>
                                      
                                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                          <div className="text-xs text-slate-500 font-medium">From: {ticket.user_email}</div>
                                          {ticket.status === 'open' && (
                                              <button 
                                                onClick={() => handleResolveTicket(ticket.id)}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                                              >
                                                  Mark Resolved
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
                )}

                {/* Console / Broadcast Area */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Megaphone size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Global Broadcast</h3>
                        </div>
                        <p className="text-indigo-100 text-sm mb-4">Send a maintenance alert or announcement to all active platform members.</p>
                        <textarea
                            className="w-full bg-indigo-500/30 border border-white/20 rounded-2xl p-4 text-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4 h-32"
                            placeholder="Type your message here..."
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                        />
                        <button
                            onClick={handleBroadcast}
                            disabled={broadcasting || !announcement}
                            className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {broadcasting ? "Broadcasting..." : "Confirm Broadcast"}
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Face Shape Trends</h3>
                        <div className="space-y-4">
                            {stats?.face_shape_trends?.map((trend, idx) => (
                                <div key={typeof trend._id === 'string' ? trend._id : `trend-${idx}`} className="space-y-1">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-slate-600">
                                            {typeof trend._id === 'string' ? trend._id :
                                                (trend._id?.value || (Array.isArray(trend._id) ? trend._id[0] : "Unknown"))}
                                        </span>
                                        <span className="text-slate-900">{trend.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(trend.count / (stats?.total_analyses || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, trend, color }) => (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color}`}>
                {icon}
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{trend}</span>
        </div>
        <div className="space-y-1">
            <h3 className="text-slate-500 font-bold text-sm tracking-wide uppercase">{title}</h3>
            <div className="text-3xl font-black text-slate-900">{value}</div>
        </div>
    </div>
);

export default AdminDashboard;
