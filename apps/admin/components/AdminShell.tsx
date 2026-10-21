'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { UserRole } from '@ford/shared';
import { clearSession, getStoredUser, SessionUser } from '@/lib/api';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || stored.role !== UserRole.FACILITY_ADMIN) {
      router.replace('/');
      return;
    }
    setUser(stored);
  }, [router]);

  if (!user) {
    return (
      <div className="container">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  const links = [
    { href: '/approvals', label: 'Approvals' },
    { href: '/history', label: 'History' },
    { href: '/facilities', label: 'Facilities' },
    { href: '/block-slots', label: 'Block slots' },
  ];

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="brand">
            Ford <span>Facility</span> Admin
          </div>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <button
          className="btn secondary"
          type="button"
          onClick={() => {
            clearSession();
            router.replace('/');
          }}
        >
          Sign out
        </button>
      </div>
      <nav className="nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
