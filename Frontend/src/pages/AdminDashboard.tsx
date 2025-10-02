import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, PieChart as PieIcon, BarChart2, AlertCircle, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { escrowApi, userApi } from '../lib/api';
import { Escrow, SearchUser } from '../types';
import { formatCurrency, formatRelativeTime, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

type StatusKey = 'Pending' | 'Funded' | 'Released' | 'Disputed';
const STATUS_ORDER: StatusKey[] = ['Pending', 'Funded', 'Released', 'Disputed'];
const STATUS_COLORS: Record<StatusKey, string> = {
  Pending: '#FBBF24',
  Funded: '#22C55E',
  Released: '#60A5FA',
  Disputed: '#F87171',
};

// Simple SVG Donut Pie Chart
const DonutChart = ({ data, total, size = 180, stroke = 22 }: { data: { label: string; value: number; color: string }[]; total: number; size?: number; stroke?: number; }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={radius} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        {data.map((d, i) => {
          const fraction = total > 0 ? d.value / total : 0;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={i}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          );
          offset += dash;
          return circle;
        })}
        <text textAnchor="middle" dy="6" className="fill-gray-900 font-semibold">
          {total}
        </text>
      </g>
    </svg>
  );
};

// Simple Bar chart for amounts by status
const BarChart = ({ items, maxValue }: { items: { label: string; value: number; color: string }[]; maxValue: number; }) => {
  return (
    <div className="space-y-3">
      {items.map((i) => {
        const pct = maxValue > 0 ? (i.value / maxValue) * 100 : 0;
        return (
          <div key={i.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{i.label}</span>
              <span className="text-gray-900 font-medium">{formatCurrency(i.value)}</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded">
              <div className="h-3 rounded" style={{ width: `${pct}%`, backgroundColor: i.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminDashboard = () => {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all escrows (using existing endpoint; for admins this may return all)
      const escrowResp = await escrowApi.getMyEscrows();
      const payload: any = escrowResp.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.escrows)
        ? payload.escrows
        : [];
      setEscrows(list as Escrow[]);

      // Fetch all users
      try {
        const usersResp = await userApi.getAllUsers();
        const u = usersResp?.data?.users || [];
        setUsers(u);
      } catch {
        const fallback = await userApi.searchUsers('');
        setUsers(fallback?.data?.users || []);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aggregations
  const countsByStatus = useMemo(() => {
    const base: Record<StatusKey, number> = { Pending: 0, Funded: 0, Released: 0, Disputed: 0 } as const as any;
    for (const e of escrows) {
      const key = (e.status as StatusKey) || 'Pending';
      if (base[key] !== undefined) base[key] += 1;
    }
    return base;
  }, [escrows]);

  const amountByStatus = useMemo(() => {
    const base: Record<StatusKey, number> = { Pending: 0, Funded: 0, Released: 0, Disputed: 0 } as const as any;
    for (const e of escrows) {
      const key = (e.status as StatusKey) || 'Pending';
      if (base[key] !== undefined) base[key] += Number(e.amount || 0);
    }
    return base;
  }, [escrows]);

  const pieData = useMemo(() => STATUS_ORDER.map((s) => ({ label: s, value: countsByStatus[s], color: STATUS_COLORS[s] })), [countsByStatus]);
  const pieTotal = useMemo(() => escrows.length, [escrows]);
  const barItems = useMemo(() => STATUS_ORDER.map((s) => ({ label: s, value: amountByStatus[s], color: STATUS_COLORS[s] })), [amountByStatus]);
  const barMax = useMemo(() => Math.max(0, ...barItems.map((i) => i.value)), [barItems]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of escrows and users</p>
          </div>
          <button onClick={loadData} disabled={loading} className="btn btn-outline btn-md">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[240px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Unable to load data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={loadData} className="btn btn-outline btn-sm">Try again</button>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <PieIcon className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Escrows by Status</h3>
                  </div>
                  <span className="text-sm text-gray-500">Total: {pieTotal}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <DonutChart data={pieData} total={pieTotal} />
                  <div className="space-y-3">
                    {pieData.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-700">{d.label}</span>
                        </div>
                        <span className="text-gray-900 font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <BarChart2 className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Amount by Status</h3>
                </div>
                <BarChart items={barItems} maxValue={barMax} />
              </motion.div>
            </div>

            {/* All Escrows */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">All Escrows</h3>
                </div>
                <span className="text-sm text-gray-500">Total: {escrows.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {escrows.map((e) => {
                      const buyerName = users.find(u => u.id === e.buyer_id)?.first_name + ' ' + users.find(u => u.id === e.buyer_id)?.last_name || `#${e.buyer_id}`;
                      const sellerName = users.find(u => u.id === e.seller_id)?.first_name + ' ' + users.find(u => u.id === e.seller_id)?.last_name || `#${e.seller_id}`;
                      return (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{e.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{buyerName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{sellerName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(e.amount)}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{e.status}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{formatRelativeTime(e.created_at)}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={() => { setSelectedEscrow(e); setShowEscrowModal(true); }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Users List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
                </div>
                <span className="text-sm text-gray-500">Total: {users.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profession</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{u.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{u.first_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{u.last_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{u.profession}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.activated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.activated ? 'Yes' : 'No'}
                          </span>
                        </td>
                       
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
      {/* Escrow Details Modal */}
      {showEscrowModal && selectedEscrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEscrowModal(false)}/>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 h-[calc(100vh-4rem)] overflow-scroll">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Escrow #{selectedEscrow.id} Details</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEscrowModal(false)}>Close</button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="text-gray-900 font-medium">{selectedEscrow.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="text-gray-900 font-medium">{formatCurrency(selectedEscrow.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{formatDate(selectedEscrow.created_at)}</span>
              </div>
              {selectedEscrow.conditions && (
                <div className="text-sm">
                  <div className="text-gray-600 mb-1">Conditions</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{selectedEscrow.conditions}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Buyer</div>
                  <div className="text-gray-900">{users.find(u => u.id === selectedEscrow.buyer_id)?.first_name + ' ' + users.find(u => u.id === selectedEscrow.buyer_id)?.last_name || `#${selectedEscrow.buyer_id}`}</div>
                </div>
                <div>
                  <div className="text-gray-600">Seller</div>
                  <div className="text-gray-900">{users.find(u => u.id === selectedEscrow.seller_id)?.first_name + ' ' + users.find(u => u.id === selectedEscrow.seller_id)?.last_name || `#${selectedEscrow.seller_id}`}</div>
                </div>
              </div>
              {(selectedEscrow.blockchain_tx_hash || selectedEscrow.blockchain_escrow_id) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedEscrow.blockchain_tx_hash && (
                    <div>
                      <div className="text-gray-600">Tx Hash</div>
                      <div className="text-xs text-gray-900 break-all">{selectedEscrow.blockchain_tx_hash}</div>
                    </div>
                  )}
                  {selectedEscrow.blockchain_escrow_id && (
                    <div>
                      <div className="text-gray-600">Chain Escrow ID</div>
                      <div className="text-gray-900">{selectedEscrow.blockchain_escrow_id}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Link to={`/escrow/${selectedEscrow.id}`} className="btn btn-primary btn-sm">Open Full Page</Link>
              <button className="btn btn-outline btn-sm" onClick={() => setShowEscrowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;