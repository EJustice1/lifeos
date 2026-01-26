'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  initiateGoogleCalendarAuth,
  disconnectGoogleCalendar,
  getGoogleCalendarSyncStatus,
  manualSyncGoogleCalendar,
  setGoogleCalendarSyncEnabled,
  testGoogleCalendarConnection,
} from '@/lib/actions/google-calendar'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

function GoogleCalendarSettings() {
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const [syncStatus, setSyncStatus] = useState<{
    last_sync: Date | null
    sync_enabled: boolean
    connected: boolean
  }>({
    last_sync: null,
    sync_enabled: false,
    connected: false,
  })

  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Load sync status
  useEffect(() => {
    loadSyncStatus()
  }, [])

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      showToast('Google Calendar connected successfully!', 'success')
      loadSyncStatus()
    } else if (error) {
      showToast(`Failed to connect: ${error}`, 'error')
    }
  }, [searchParams, showToast])

  async function loadSyncStatus() {
    const status = await getGoogleCalendarSyncStatus()
    setSyncStatus(status)
  }

  async function handleConnect() {
    setConnecting(true)
    try {
      const { authUrl } = await initiateGoogleCalendarAuth()
      window.location.href = authUrl
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      showToast('Failed to initiate authorization', 'error')
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await disconnectGoogleCalendar()
      showToast('Google Calendar disconnected', 'success')
      loadSyncStatus()
    } catch (error) {
      console.error('Failed to disconnect:', error)
      showToast('Failed to disconnect', 'error')
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await manualSyncGoogleCalendar()
      showToast(
        `Synced: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`,
        'success'
      )
      loadSyncStatus()
    } catch (error) {
      console.error('Sync failed:', error)
      showToast('Sync failed', 'error')
    } finally {
      setSyncing(false)
    }
  }

  async function handleToggleSync() {
    try {
      await setGoogleCalendarSyncEnabled(!syncStatus.sync_enabled)
      loadSyncStatus()
      showToast(
        syncStatus.sync_enabled ? 'Auto-sync disabled' : 'Auto-sync enabled',
        'success'
      )
    } catch (error) {
      console.error('Failed to toggle sync:', error)
      showToast('Failed to update sync settings', 'error')
    }
  }

  async function handleTestConnection() {
    try {
      const result = await testGoogleCalendarConnection()
      if (result.connected) {
        showToast('Connection successful!', 'success')
      } else {
        showToast(`Connection failed: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('Connection test failed', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Google Calendar Settings</h1>

        {/* Connection Status */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold text-white mb-4">Connection Status</h2>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-zinc-400">Status</p>
              <p className="text-white font-medium">
                {syncStatus.connected ? (
                  <span className="text-emerald-500">Connected</span>
                ) : (
                  <span className="text-zinc-500">Not Connected</span>
                )}
              </p>
            </div>

            {syncStatus.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect Google Calendar'}
              </button>
            )}
          </div>

          {syncStatus.connected && (
            <>
              <div className="border-t border-zinc-800 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-zinc-400">Last Sync</p>
                  <p className="text-white">
                    {syncStatus.last_sync
                      ? new Date(syncStatus.last_sync).toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-zinc-400">Auto-Sync</p>
                  <button
                    onClick={handleToggleSync}
                    className={`px-4 py-2 rounded-lg ${
                      syncStatus.sync_enabled
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    } text-white`}
                  >
                    {syncStatus.sync_enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>

                <button
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                >
                  Test Connection
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">About Google Calendar Sync</h2>

          <div className="space-y-2 text-zinc-400 text-sm">
            <p>
              Connect your Google Calendar to automatically sync events with your LifeOS tasks:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View Google Calendar events in your Day View timeline</li>
              <li>Create calendar events by scheduling tasks</li>
              <li>Bidirectional sync keeps everything in sync</li>
              <li>Auto-sync refreshes every 15 minutes when enabled</li>
            </ul>

            <div className="mt-4 p-3 bg-zinc-800 rounded border border-zinc-700">
              <p className="font-medium text-white mb-1">Required Permissions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Read and write calendar events</li>
                <li>View calendar metadata</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GoogleCalendarSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <GoogleCalendarSettings />
    </Suspense>
  )
}
