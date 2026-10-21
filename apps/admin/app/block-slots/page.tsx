'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api } from '@/lib/api';

type Facility = {
  id: string;
  name: string;
  type: string;
};

export default function BlockSlotsPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reason, setReason] = useState('Maintenance');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Facility[]>('/admin/facilities');
        setFacilities(data.filter((f) => true));
        if (data[0]) setFacilityId(data[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/admin/slots/block', {
        method: 'POST',
        body: JSON.stringify({
          facilityId,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          reason,
        }),
      });
      setMessage('Slot blocked successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Block failed');
    }
  }

  return (
    <AdminShell>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Block a slot</h2>
        <p className="muted">
          Block time for maintenance or events. Blocked slots cannot be booked.
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Facility</label>
            <select
              className="input"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              required
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Start</label>
            <input
              className="input"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">End</label>
            <input
              className="input"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Reason</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit">
            Block slot
          </button>
        </form>
        {message ? <p style={{ color: '#8dffb5' }}>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </AdminShell>
  );
}
