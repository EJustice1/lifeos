"use client"
import { useEffect, useState } from 'react'
import { runFullMigration } from '@/lib/actions/migration'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

export default function MigrationPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const { showToast } = useToast()

  const handleMigrate = async () => {
    setStatus('running')
    try {
      await runFullMigration('current-user-id')
      setStatus('success')
      showToast('Migration completed successfully', 'success')
    } catch (e) {
      console.error(e)
      setStatus('error')
      showToast('Migration failed', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3rem' }}>
      <h2>Data Migration</h2>
      <p>Convert legacy buckets and goals to the new Strategy Hub structure.</p>
      {status === 'idle' && <button onClick={handleMigrate} style={{ marginTop: '1rem' }}>Start Migration</button>}
      {status === 'running' && <p>Progress: {progress}%</p>}
      {status === 'success' && <p style={{ color: 'teal' }}>✅ Migration finished.</p>}
      {status === 'error' && <p style={{ color: 'red' }}>❌ Migration failed.</p>}
    </div>
  )
}
