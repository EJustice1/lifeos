'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  manualSyncGoogleCalendar,
  getGoogleCalendarSyncStatus,
} from '@/lib/actions/google-calendar'

export interface SyncStatus {
  last_sync: Date | null
  sync_enabled: boolean
  connected: boolean
}

export interface UseSyncReturn {
  syncing: boolean
  lastSync: Date | null
  syncStatus: 'idle' | 'syncing' | 'error'
  connected: boolean
  syncEnabled: boolean
  sync: () => Promise<void>
  autoSyncIfNeeded: () => Promise<void>
}

const AUTO_SYNC_INTERVAL = 15 * 60 * 1000 // 15 minutes

export function useGoogleCalendarSync(): UseSyncReturn {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [connected, setConnected] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(false)

  // Load sync status on mount
  useEffect(() => {
    loadSyncStatus()
  }, [])

  // Auto-sync on mount if needed
  useEffect(() => {
    autoSyncIfNeeded()
  }, [connected, syncEnabled, lastSync])

  // Auto-sync on visibility change (when user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        autoSyncIfNeeded()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connected, syncEnabled, lastSync])

  async function loadSyncStatus() {
    try {
      const status = await getGoogleCalendarSyncStatus()
      setLastSync(status.last_sync ? new Date(status.last_sync) : null)
      setConnected(status.connected)
      setSyncEnabled(status.sync_enabled)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const sync = useCallback(async () => {
    if (syncing || !connected) return

    setSyncing(true)
    setSyncStatus('syncing')

    try {
      await manualSyncGoogleCalendar()
      setLastSync(new Date())
      setSyncStatus('idle')
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncStatus('error')
      throw error
    } finally {
      setSyncing(false)
    }
  }, [syncing, connected])

  const autoSyncIfNeeded = useCallback(async () => {
    if (!connected || !syncEnabled || syncing) return

    // Check if last sync was more than 15 minutes ago
    const shouldAutoSync =
      !lastSync || Date.now() - lastSync.getTime() > AUTO_SYNC_INTERVAL

    if (shouldAutoSync) {
      try {
        await sync()
      } catch (error) {
        // Silent fail for auto-sync
        console.warn('Auto-sync failed:', error)
      }
    }
  }, [connected, syncEnabled, lastSync, syncing, sync])

  return {
    syncing,
    lastSync,
    syncStatus,
    connected,
    syncEnabled,
    sync,
    autoSyncIfNeeded,
  }
}
