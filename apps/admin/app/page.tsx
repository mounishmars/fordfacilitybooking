'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@ford/shared';
import { getStoredUser, mockLogin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ford.com');
  const [name, setName] = useState('Facility Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role === UserRole.FACILITY_ADMIN) {
      router.replace('/approvals');
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await mockLogin({
        email,
        name,
        role: UserRole.FACILITY_ADMIN,
      });
      if (user.role !== UserRole.FACILITY_ADMIN) {
        setError('This portal is for facility admins only');
        return;
      }
      router.push('/approvals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 80 }}>
      <div className="card">
        <div className="brand" style={{ marginBottom: 8 }}>
          Ford <span>Facility</span> Admin
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Mock SSO login (replace with Ford Entra ID later)
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in as Facility Admin'}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
