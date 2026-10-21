'use client';

import { useCallback, useEffect, useState } from 'react';
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

export default function ApprovalsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api<Booking[]>(
        `/admin/bookings?status=${BookingStatus.PENDING}`,
      );
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await api(`/admin/bookings/${id}/approve`, { method: 'POST', body: '{}' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const note = window.prompt('Rejection note (optional)') || undefined;
    setBusyId(id);
    try {
      await api(`/admin/bookings/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ adminNote: note }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pending approvals</h2>
        <p className="muted">
          Employee requests wait here until you approve or reject.
        </p>
        {error ? <p className="error">{error}</p> : null}
        {bookings.length === 0 ? (
          <p className="muted">No pending requests.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Facility</th>
                <th>Slot</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div>{b.user?.name}</div>
                    <div className="muted">{b.user?.email}</div>
                  </td>
                  <td>
                    {b.facility?.name}
                    <div className="muted">{b.facility?.type}</div>
                  </td>
                  <td>
                    {b.slot
                      ? `${new Date(b.slot.startAt).toLocaleString()} – ${new Date(
                          b.slot.endAt,
                        ).toLocaleTimeString()}`
                      : '—'}
                  </td>
                  <td>{new Date(b.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="row">
                      <button
                        className="btn success"
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => approve(b.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => reject(b.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
