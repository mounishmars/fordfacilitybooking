'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FacilityType } from '@ford/shared';
import { AdminShell } from '@/components/AdminShell';
import { api } from '@/lib/api';

type Facility = {
  id: string;
  name: string;
  type: string;
  location: string;
  active: boolean;
  capacity: number;
};

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(FacilityType.TURF);
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(1);

  const load = useCallback(async () => {
    try {
      const data = await api<Facility[]>('/admin/facilities');
      setFacilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/facilities', {
        method: 'POST',
        body: JSON.stringify({ name, type, location, capacity }),
      });
      setName('');
      setLocation('');
      setCapacity(1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function toggleActive(f: Facility) {
    try {
      await api(`/admin/facilities/${f.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !f.active }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <AdminShell>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add facility</h2>
        <form onSubmit={onCreate}>
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label className="label">Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ width: 180 }}>
              <label className="label">Type</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {Object.values(FacilityType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label className="label">Location</label>
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ width: 100 }}>
              <label className="label">Capacity</label>
              <input
                className="input"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>
          </div>
          <button className="btn" type="submit">
            Create facility
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Facilities</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.type}</td>
                <td>{f.location}</td>
                <td>{f.capacity}</td>
                <td>{f.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => toggleActive(f)}
                  >
                    {f.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
