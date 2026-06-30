import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalHouses: number;
  collectionRate: number;
  housesWithParking: number;
  totalCollected: number;
  totalOutstanding: number;
  monthlyData: any[];
  statusCounts: {
    'รอแจ้งค่าส่วนกลาง': { count: number; amount: number };
    'รอการชำระ': { count: number; amount: number };
    'รอตรวจสอบยอดเงิน': { count: number; amount: number };
    'ชำระเต็มจำนวน': { count: number; amount: number };
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="page-container"><p>กำลังโหลดข้อมูล...</p></div>;

  const pieData = [
    { name: 'ชำระแล้ว', value: stats.collectionRate, color: 'var(--color-success)' },
    { name: 'รอการชำระ', value: 100 - stats.collectionRate, color: 'var(--color-danger)' },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <h1 className="h1" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>ภาพรวมระบบ (Dashboard)</h1>
        
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'nowrap' }}>
          {['รอแจ้งค่าส่วนกลาง', 'รอการชำระ', 'ชำระบางส่วน', 'รอตรวจสอบยอดเงิน', 'ชำระเต็มจำนวน'].map(status => {
            let statusColor = 'var(--color-primary)';
            if (status === 'รอแจ้งค่าส่วนกลาง') statusColor = '#9CA3AF';
            if (status === 'รอการชำระ') statusColor = 'var(--color-warning)';
            if (status === 'ชำระบางส่วน') statusColor = '#8B5CF6';
            if (status === 'รอตรวจสอบยอดเงิน') statusColor = '#3B82F6';
            if (status === 'ชำระเต็มจำนวน') statusColor = 'var(--color-success)';
            
            const statusData = (stats.statusCounts && stats.statusCounts[status as keyof typeof stats.statusCounts]) || { count: 0, amount: 0 };

            return (
              <div 
                key={status}
                style={{ 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  border: `1px solid ${statusColor}`, 
                  backgroundColor: 'white', 
                  color: statusColor,
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{status}</span>
                <span style={{ backgroundColor: statusColor, color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>{statusData.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="kpi-grid custom-kpi-grid" style={{ flexShrink: 0, marginBottom: '20px' }}>
        <div className="kpi-card">
          <div className="kpi-title">
            จำนวนบ้านทั้งหมด {stats.totalHouses} หลัง
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span className="kpi-title" style={{ margin: 0 }}>ค่าส่วนกลางรวม</span>
            <span className="kpi-value" style={{ margin: 0 }}>
              {(stats.totalCollected + stats.totalOutstanding).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title" style={{ whiteSpace: 'nowrap' }}>จองที่จอดรถส่วนกลาง</div>
          <div className="kpi-value" style={{color: 'var(--color-success)'}}>{stats.housesWithParking} หลัง</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title" style={{ textAlign: 'right' }}>ยอดรับชำระแล้ว (บาท)</div>
          <div className="kpi-value" style={{ textAlign: 'right' }}>{stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title" style={{ textAlign: 'right' }}>ยอดรอการชำระเงิน (บาท)</div>
          <div className="kpi-value" style={{color: 'var(--color-danger)', textAlign: 'right'}}>{stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="charts-grid" style={{ flex: 1, minHeight: 0, marginBottom: 0 }}>
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 className="h2" style={{ fontSize: '1.25rem', flexShrink: 0 }}>การรับชำระรายเดือน</h2>
          <div style={{ flex: 1, minHeight: 0, marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval={0} tick={false} />
                <YAxis hide={true} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="paid" name="แนวโน้ม (บาท)" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.3} />
                <Bar dataKey="paid" name="รับชำระ (บาท)" fill="var(--color-success)" barSize={20} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 className="h2" style={{ fontSize: '1.25rem', flexShrink: 0 }}>สัดส่วนการชำระเงิน</h2>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="160%"
                  outerRadius="200%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-text-main)', lineHeight: '1' }}>
                {stats.collectionRate}%
              </div>
              <div style={{ fontSize: '1rem', color: '#6B7280', marginTop: '5px' }}>อัตราการชำระเงิน</div>
            </div>
          </div>
          <div className="flex-center" style={{ gap: '20px', marginTop: '10px' }}>
            <div className="flex-center" style={{ gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></div>
              <span className="text-muted">ชำระแล้ว ({stats.collectionRate}%)</span>
            </div>
            <div className="flex-center" style={{ gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></div>
              <span className="text-muted">รอการชำระ ({100 - stats.collectionRate}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
