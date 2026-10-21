'use client';

import { useEffect, useState } from 'react';
import { BookingStatus } from '@ford/shared';
import { AdminShell } from '@/components/AdminShell';
import { api } from '@/lib/api';

type Booking = {
  id: string;
  status: BookingStatus;
  adminNote?: string | null;
  createdAt: string;
  user?: { name: string; email: string };
  facility?: { name: string; type: string };
  slot?: { startAt: string; endAt: string };
};

export default function HistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setError('');
      try {
        const q = status ? `?status=${status}` : '';
        const data = await api<Booking[]>(`/admin/bookings${q}`);
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [status]);

  return (
    <AdminShell>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Booking history</h2>
          <select
            className="input"
            style={{ width: 200 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {Object.values(BookingStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Employee</th>
              <th>Facility</th>
              <th>Slot</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                </td>
                <td>
                  {b.user?.name}
                  <div className="muted">{b.user?.email}</div>
                </td>
                <td>{b.facility?.name}</td>
                <td>
                  {b.slot
                    ? new Date(b.slot.startAt).toLocaleString()
                    : '—'}
                </td>
                <td className="muted">{b.adminNote || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
