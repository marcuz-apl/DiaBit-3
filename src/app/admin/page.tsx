'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import Link from 'next/link';
import {
  Users,
  Database,
  UserPlus,
  Trash2,
  Settings,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  role: 'Admin' | 'Engineer';
}

export default function AdminPanel() {
  const { user, loadingUser, triggerRefreshTree } = useApp();
  const router = useRouter();

  // Users management states
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState<'Admin' | 'Engineer'>('Engineer');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Database operations states
  const [dbPruneId, setDbPruneId] = useState('');
  const [dbPruneDepth, setDbPruneDepth] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isPruning, setIsPruning] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Guard access
  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'Admin')) {
      router.push('/');
    }
  }, [user, loadingUser, router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Create or Update user
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserId,
          username: usernameInput,
          password: passwordInput || undefined,
          role: roleInput,
        }),
      });

      if (res.ok) {
        showFeedback('success', selectedUserId ? 'User profile updated' : 'New user created successfully');
        setUsernameInput('');
        setPasswordInput('');
        setRoleInput('Engineer');
        setSelectedUserId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to save user');
      }
    } catch (err) {
      showFeedback('error', 'Network failure while saving user');
    }
  };

  // Edit user click
  const handleEditClick = (u: UserItem) => {
    setSelectedUserId(u.id);
    setUsernameInput(u.username);
    setRoleInput(u.role);
    setPasswordInput(''); // leave empty to not change
  };

  // Delete user
  const handleDeleteUser = async (id: number) => {
    if (id === user?.id) {
      showFeedback('error', 'Cannot delete your active administrative session');
      return;
    }

    if (!window.confirm('Delete user profile permanently?')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback('success', 'User profile deleted');
        if (selectedUserId === id) {
          setSelectedUserId(null);
          setUsernameInput('');
          setPasswordInput('');
        }
        fetchUsers();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Failed to delete user');
      }
    } catch (err) {
      showFeedback('error', 'Network failure while deleting user');
    }
  };

  // Reset database back to default seed data
  const handleResetDatabase = async () => {
    if (!window.confirm('WARNING: This will wipe all user-created wells, slots, trajectories, and accounts, then restore default configurations. Proceed?')) return;
    
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (res.ok) {
        showFeedback('success', 'Database reset and seed dataset imported');
        triggerRefreshTree();
        fetchUsers();
      } else {
        const data = await res.json();
        showFeedback('error', data.error || 'Database reset failed');
      }
    } catch (err) {
      showFeedback('error', 'Error resetting database');
    } finally {
      setIsResetting(false);
    }
  };

  // Prune bad logs (points) from a trajectory
  const handlePruneLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPruneId || !dbPruneDepth) return;

    setIsPruning(true);
    try {
      const res = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prune_points',
          trajectoryId: parseInt(dbPruneId, 10),
          thresholdDepth: parseFloat(dbPruneDepth),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message || 'Log points pruned successfully');
        setDbPruneId('');
        setDbPruneDepth('');
        triggerRefreshTree();
      } else {
        showFeedback('error', data.error || 'Pruning operation failed');
      }
    } catch (err) {
      showFeedback('error', 'Error pruning log points');
    } finally {
      setIsPruning(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <span className="text-sm text-slate-400">Verifying administrative credentials...</span>
      </div>
    );
  }

  // Access check
  if (!user || user.role !== 'Admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-slate-100">
      
      {/* Header section */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-[#0b0f19]/85">
        <div className="flex h-14 items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Workspace</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-black tracking-tight text-rose-600 dark:text-rose-400 uppercase">
              DiaBitter Administration Console
            </span>
          </div>

          <div className="text-[10px] rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Current Session: {user.username} ({user.role})
          </div>
        </div>
      </header>

      {/* Main console content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Floating feedback alert */}
        {feedback && (
          <div
            className={`flex items-center space-x-2 rounded-xl p-3.5 border text-xs font-semibold animate-pulse ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/10 dark:text-rose-400 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4.5 w-4.5" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: User Profile Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <UserPlus className="h-4.5 w-4.5 text-sky-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {selectedUserId ? 'Modify User Profile' : 'Register New User'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveUser} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Password {selectedUserId && <span className="text-slate-400">(leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={!selectedUserId}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  placeholder={selectedUserId ? 'Enter new password or leave blank' : 'Enter password'}
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Role Type</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as 'Admin' | 'Engineer')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
                >
                  <option value="Engineer">Engineer (Read/Write Trajectories)</option>
                  <option value="Admin">Admin (Full System Privilege)</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                {selectedUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId(null);
                      setUsernameInput('');
                      setPasswordInput('');
                      setRoleInput('Engineer');
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 transition-colors"
                >
                  {selectedUserId ? 'Update User' : 'Register User'}
                </button>
              </div>
            </form>
          </div>

          {/* Column 2: Users List */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="h-4.5 w-4.5 text-sky-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registered Access Accounts
                </h3>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                title="Refresh user accounts list"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto max-h-[360px] pr-1">
              {usersList.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{u.username}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        u.role === 'Admin' 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                          : 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400'
                      }`}>
                        {u.role}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">ID: {u.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 font-semibold dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.id === user.id}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500 disabled:opacity-20 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Database & Dataset Management */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Database className="h-4.5 w-4.5 text-sky-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dataset Operations
              </h3>
            </div>

            <div className="mt-4 space-y-6 text-xs">
              
              {/* Prune Log stations */}
              <form onSubmit={handlePruneLogs} className="space-y-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <span className="block font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                  Prune Trajectory logs
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Trajectory ID</label>
                    <input
                      type="number"
                      required
                      value={dbPruneId}
                      onChange={(e) => setDbPruneId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Cutoff MD (Depth)</label>
                    <input
                      type="number"
                      required
                      value={dbPruneDepth}
                      onChange={(e) => setDbPruneDepth(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPruning}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/20 text-rose-500 font-bold py-2 transition-colors cursor-pointer"
                >
                  {isPruning ? 'Pruning logs...' : 'Prune Stations Above Depth'}
                </button>
              </form>

              {/* Hard Database Wiping / Seeding */}
              <div className="space-y-3">
                <span className="block font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                  Hard Database Operations
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Triggers full database cleanup, wipes all client slots, wells, custom configurations, and re-imports the default Canada Alberta Western Canada Pembina PEM-101 Slot-A1 trajectory set.
                </p>

                <button
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-400 text-white font-bold py-2.5 transition-colors shadow-sm cursor-pointer"
                >
                  {isResetting ? 'Resetting and Importing Seeder...' : 'Wipe & Re-Seed Database'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
