import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  houseNumber: string | null;
  createdAt: string;
}

const ActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
      toast.error('ไม่สามารถโหลดประวัติการทำงานได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.houseNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'แก้ไขข้อมูลบ้าน': return '#3B82F6'; // Blue
      case 'แจ้งชำระเงิน': return '#EAB308'; // Yellow
      case 'ออกใบเสร็จ': return '#10B981'; // Green
      case 'ยกเลิกรายการ': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)' }}>ประวัติการทำงาน</h1>
        <button 
          onClick={fetchLogs} 
          style={{ 
            padding: '4px 12px', fontSize: '0.85rem', 
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          รีเฟรชข้อมูล
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 ค้นหาบ้านเลขที่, หรือการกระทำ..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '15px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '15px 20px', color: '#4B5563', fontWeight: '600', width: '200px' }}>วัน-เวลา</th>
                <th style={{ padding: '15px 20px', color: '#4B5563', fontWeight: '600', width: '150px' }}>หมวดหมู่</th>
                <th style={{ padding: '15px 20px', color: '#4B5563', fontWeight: '600', width: '120px' }}>บ้านเลขที่</th>
                <th style={{ padding: '15px 20px', color: '#4B5563', fontWeight: '600' }}>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '15px 20px', color: '#6B7280', fontSize: '14px' }}>
                    {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm น.', { locale: th })}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      backgroundColor: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action)
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>
                    {log.houseNumber || '-'}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#374151' }}>
                    {log.description}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    ไม่พบประวัติการทำงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
