import React, { useState, useEffect } from 'react';
import { 
  FiClock, FiCalendar, FiDollarSign, FiPlus, FiCheck, FiX, 
  FiUser, FiTrendingUp, FiActivity, FiArrowRight, FiPercent 
} from 'react-icons/fi';
import { getStaffList, markAttendance, getStaffAttendance } from '../../services/partnerApi';
import { requestLeave, getLeavesList, updateLeaveStatus, calculatePayroll } from '../../services/hrApi';
import { toast } from 'react-toastify';

export default function HRPayroll() {
  const [staffList, setStaffList] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // attendance | leaves | payroll
  const [loading, setLoading] = useState(true);

  // Attendance logging state
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStaff, setAttStaff] = useState('');
  const [attStatus, setAttStatus] = useState('present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [attNotes, setAttNotes] = useState('');

  // Request leave state
  const [leaveStaff, setLeaveStaff] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('casual');
  const [leaveReason, setLeaveReason] = useState('');

  // Payroll calculation state
  const [payrollMonth, setPayrollMonth] = useState('2026-05');
  const [payrollData, setPayrollData] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await getStaffList();
      setStaffList(s);
      if (s.length > 0) {
        setAttStaff(s[0].id);
        setLeaveStaff(s[0].id);
      }
      const l = await getLeavesList();
      setLeaves(l);
    } catch (e) {
      toast.error('Failed to load HR details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!attStaff) return toast.warning('Select a staff member');
    try {
      await markAttendance({
        staff_id: attStaff,
        date: attDate,
        status: attStatus,
        check_in: attStatus === 'present' || attStatus === 'half_day' ? checkInTime : null,
        check_out: attStatus === 'present' || attStatus === 'half_day' ? checkOutTime : null,
        notes: attNotes
      });
      toast.success('Attendance entry submitted');
      setAttNotes('');
      loadData();
    } catch (e) {
      toast.error('Failed to log attendance');
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (!leaveStaff || !leaveStart || !leaveEnd) return toast.warning('Fill all fields');
    try {
      await requestLeave({
        staff_id: leaveStaff,
        start_date: leaveStart,
        end_date: leaveEnd,
        leave_type: leaveType,
        reason: leaveReason
      });
      toast.success('Leave requested successfully');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      loadData();
    } catch (e) {
      toast.error('Failed to request leave');
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await updateLeaveStatus(id, status);
      toast.success(`Leave request ${status}`);
      loadData();
    } catch (e) {
      toast.error('Failed to update leave');
    }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    try {
      setCalculating(true);
      const data = await calculatePayroll(payrollMonth);
      setPayrollData(data);
      toast.success('Payroll compiled successfully!');
    } catch (e) {
      toast.error('Failed to compile payroll');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top statistics overview bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-2xl border border-indigo-200/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Staff</p>
            <h4 className="text-2xl font-black text-indigo-900 mt-1">{staffList.length} Roster Members</h4>
          </div>
          <FiUser size={32} className="text-indigo-600 opacity-60" />
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Pending Leaves</p>
            <h4 className="text-2xl font-black text-purple-900 mt-1">{leaves.filter(l => l.status === 'pending').length} Requests</h4>
          </div>
          <FiCalendar size={32} className="text-purple-600 opacity-60" />
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border border-emerald-200/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Payroll Status</p>
            <h4 className="text-2xl font-black text-emerald-900 mt-1">Ledger Live</h4>
          </div>
          <FiDollarSign size={32} className="text-emerald-600 opacity-60" />
        </div>
      </div>

      {/* Mini tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm gap-1 overflow-x-auto">
        {[
          ['attendance', 'Attendance Logs', FiClock],
          ['leaves', 'Staff Leaves', FiCalendar],
          ['payroll', 'Monthly Payroll Engine', FiDollarSign],
        ].map(([k, l, Icon]) => (
          <button 
            key={k} 
            onClick={() => setActiveSubTab(k)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeSubTab === k ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Icon size={14} />
            {l}
          </button>
        ))}
      </div>

      {/* ATTENDANCE SECTION */}
      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roster list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-lg">Daily Shift Attendance Tracker</h3>
            <div className="divide-y divide-slate-100">
              {staffList.length === 0 ? (
                <p className="text-slate-400 text-xs py-4">No staff members in roster.</p>
              ) : (
                staffList.map(member => (
                  <div key={member.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-full font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.role} · Base: ₹{member.base_salary}</p>
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      <p className="font-semibold text-slate-700">Commission: {member.commission_rate}%</p>
                      <p className="text-slate-400 text-[10px]">{member.shift_start} - {member.shift_end}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mark attendance form */}
          <form onSubmit={handleMarkAttendance} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit">
            <h3 className="font-black text-slate-800 text-lg">Log Attendance</h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Select Staff Member</label>
              <select 
                value={attStaff} 
                onChange={e => setAttStaff(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border rounded-xl outline-none text-xs text-slate-700 font-bold"
              >
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                <input 
                  type="date" 
                  value={attDate} 
                  onChange={e => setAttDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                <select 
                  value={attStatus} 
                  onChange={e => setAttStatus(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs capitalize"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
            </div>

            {(attStatus === 'present' || attStatus === 'half_day') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Check In</label>
                  <input 
                    type="time" 
                    value={checkInTime} 
                    onChange={e => setCheckInTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Check Out</label>
                  <input 
                    type="time" 
                    value={checkOutTime} 
                    onChange={e => setCheckOutTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Remarks / Notes</label>
              <input 
                type="text" 
                value={attNotes} 
                onChange={e => setAttNotes(e.target.value)}
                placeholder="e.g. Arrived on time"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
              />
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-700 shadow-md transition-colors flex items-center justify-center gap-1.5">
              Submit Record
            </button>
          </form>
        </div>
      )}

      {/* LEAVES SECTION */}
      {activeSubTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaves request list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-lg">Leave Request Ledger</h3>
            
            {leaves.length === 0 ? (
              <p className="text-slate-400 text-xs">No leave requests logged.</p>
            ) : (
              <div className="space-y-3">
                {leaves.map(l => (
                  <div key={l.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{l.staff_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${l.leave_type === 'sick' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {l.leave_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Dates: <span className="font-semibold text-slate-700">{l.start_date}</span> to <span className="font-semibold text-slate-700">{l.end_date}</span>
                      </p>
                      {l.reason && <p className="text-xs text-slate-400 italic mt-0.5">"{l.reason}"</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {l.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleUpdateLeaveStatus(l.id, 'approved')}
                            className="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            title="Approve Leave"
                          >
                            <FiCheck />
                          </button>
                          <button 
                            onClick={() => handleUpdateLeaveStatus(l.id, 'rejected')}
                            className="bg-red-50 text-red-700 p-2 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                            title="Reject Leave"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {l.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request leave form */}
          <form onSubmit={handleRequestLeave} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit">
            <h3 className="font-black text-slate-800 text-lg">Request Leave</h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Select Staff Member</label>
              <select 
                value={leaveStaff} 
                onChange={e => setLeaveStaff(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border rounded-xl outline-none text-xs text-slate-700 font-bold"
              >
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                <input 
                  type="date" 
                  value={leaveStart} 
                  onChange={e => setLeaveStart(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                <input 
                  type="date" 
                  value={leaveEnd} 
                  onChange={e => setLeaveEnd(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Leave Type</label>
              <select 
                value={leaveType} 
                onChange={e => setLeaveType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs capitalize"
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Reason / Justification</label>
              <input 
                type="text" 
                value={leaveReason} 
                onChange={e => setLeaveReason(e.target.value)}
                placeholder="e.g. Doctor appointment"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
              />
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-700 shadow-md transition-colors flex items-center justify-center gap-1.5">
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* PAYROLL ENGINE SECTION */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          <form onSubmit={handleRunPayroll} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Payroll Month</label>
              <input 
                type="month" 
                value={payrollMonth} 
                onChange={e => setPayrollMonth(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-slate-50 border rounded-xl outline-none text-xs font-bold"
              />
            </div>
            <button 
              type="submit" 
              disabled={calculating}
              className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-purple-700 shadow-md transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {calculating ? (
                <>Calculating...</>
              ) : (
                <>Compile Ledger</>
              )}
            </button>
          </form>

          {payrollData ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Payroll Ledger Summary — {payrollData.month}</h3>
                  <p className="text-xs text-slate-500 mt-1">Overview of commission, deductions, and payouts</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total Outflow</p>
                  <p className="text-xl font-black text-purple-700">
                    ₹{payrollData.payroll.reduce((sum, item) => sum + item.net_payout, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                      <th className="py-3 px-6">Employee</th>
                      <th className="py-3 px-6">Salary (Base)</th>
                      <th className="py-3 px-6">Commissions</th>
                      <th className="py-3 px-6">Deductions</th>
                      <th className="py-3 px-6 text-right">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {payrollData.payroll.map(p => (
                      <tr key={p.staff_id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-bold text-slate-900">{p.staff_name}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{p.role}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">₹{p.base_salary.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold text-emerald-600">+₹{p.commission_earned.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400">
                              {p.commission_rate} of ₹{p.revenue_generated.toLocaleString()} ({p.completed_bookings_count} bookings)
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold text-red-600">-₹{p.deductions.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400">
                              {p.absent_days} absent day(s)
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-purple-700 text-base">
                          ₹{p.net_payout.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
              <FiDollarSign size={48} className="mx-auto text-slate-200 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Ledger Compile Required</h3>
              <p className="text-slate-400 text-xs mt-1">Select a month and click "Compile Ledger" to compute the payroll breakdown.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
