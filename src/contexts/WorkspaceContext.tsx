'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Workspace } from '../types';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { initializeWorkspace } from '../lib/api';

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  isWorkspaceInitializing: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  updateWorkspaceName: (name: string) => Promise<void>;
}

const emptyContext: WorkspaceContextType = {
  activeWorkspace: null, workspaces: [], isWorkspaceInitializing: true,
  setActiveWorkspace: () => {}, refreshWorkspaces: async () => {}, updateWorkspaceName: async () => {},
};
const WorkspaceContext = createContext<WorkspaceContextType>(emptyContext);
const STORAGE_KEY = 'astrix_demo_workspace';
const DEFAULT_MOCK_WORKSPACE: Workspace = {
  id: 'ws-demo-astrix', name: 'Acme Corp Workspace', slug: 'acme-corp',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', logo_url: null,
  plan: 'Hook', created_at: new Date().toISOString(),
};

const isDemo = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'workspace';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitializing: isAuthInitializing } = useAuth();
  const { addToast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWs] = useState<Workspace | null>(null);
  const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true);

  const fetchWorkspaces = async () => {
    if (isAuthInitializing) return;
    setIsWorkspaceInitializing(true);
    try {
      if (isDemo()) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const ws = stored ? JSON.parse(stored) as Workspace : DEFAULT_MOCK_WORKSPACE;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
        setWorkspaces([ws]); setActiveWs(ws);
        initializeWorkspace(ws.id);
        return;
      }
      if (!user) {
        setWorkspaces([]); setActiveWs(null);
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const [{ data: profile, error: profileError }, { data: memberships, error: memberError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id),
      ]);
      if (profileError) throw profileError;
      if (memberError) throw memberError;
      let workspaceIds = (memberships ?? []).map(member => member.workspace_id);
      if (workspaceIds.length === 0) {
        const base = slugify(String(user.user_metadata.full_name || user.email.split('@')[0]));
        let created: { id: string; name: string; slug: string; created_at: string } | null = null;
        for (let attempt = 0; attempt < 4 && !created; attempt += 1) {
          const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
          const result = await supabase.from('workspaces').insert({ name: String(user.user_metadata.full_name || `${user.email}'s workspace`), slug, created_by: user.id }).select('id,name,slug,created_at').single();
          if (!result.error && result.data) created = result.data;
          else if (result.error && !result.error.message.toLowerCase().includes('duplicate')) throw result.error;
        }
        if (!created) {
          const retry = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id);
          if (retry.error || !retry.data?.length) throw new Error('Could not provision your workspace.');
          workspaceIds = retry.data.map(member => member.workspace_id);
        } else workspaceIds = [created.id];
      }
      const { data: rows, error } = await supabase
        .from('workspaces')
        .select('id,name,slug,created_at,subscriptions(status,plans(name))')
        .in('id', workspaceIds);
      if (error) throw error;
      const timezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      type WsRow = {
        id: string; name: string; slug: string; created_at: string;
        subscriptions?: Array<{ status: string; plans?: { name: string } | null }> | null;
      };
      const mapped = ((rows ?? []) as WsRow[]).map(row => {
        const activeSub = row.subscriptions?.find(s => s.status === 'active' || s.status === 'trialing');
        const planName = activeSub?.plans?.name ?? 'Hook';
        return { id: row.id, name: row.name, slug: row.slug, timezone, logo_url: null, plan: planName, created_at: row.created_at } as Workspace;
      });
      setWorkspaces(mapped); setActiveWs(mapped[0] ?? null);
    } catch (error) {
      setWorkspaces([]); setActiveWs(null);
      addToast(error instanceof Error ? error.message : 'Could not load your workspace.', 'error');
    } finally {
      setIsWorkspaceInitializing(false);
    }
  };

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWs(workspace);
    if (isDemo()) localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  };

  const updateWorkspaceName = async (name: string) => {
    if (!activeWorkspace) return;
    if (isDemo()) {
      setActiveWorkspace({ ...activeWorkspace, name }); return;
    }
    const { error } = await createSupabaseBrowserClient().from('workspaces').update({ name: name.trim() }).eq('id', activeWorkspace.id);
    if (error) { addToast(error.message, 'error'); return; }
    const updated = { ...activeWorkspace, name: name.trim() };
    setActiveWs(updated); setWorkspaces([updated]);
  };

  useEffect(() => {
    queueMicrotask(() => { void fetchWorkspaces(); });
  }, [user, isAuthInitializing]); // eslint-disable-line react-hooks/exhaustive-deps
  return <WorkspaceContext.Provider value={{ activeWorkspace, workspaces, isWorkspaceInitializing, setActiveWorkspace, refreshWorkspaces: fetchWorkspaces, updateWorkspaceName }}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => useContext(WorkspaceContext);
