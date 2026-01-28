'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useStudySession } from '@/lib/hooks/useStudySession'
import { logCompletedSession } from '@/lib/actions/study'
import { useProjects } from '@/contexts/ProjectContext'
import { ProjectFormModal } from '@/components/modals/ProjectFormModal'
import { ToggleButton } from '@/components/mobile/buttons/ToggleButton'
import { useToast } from '@/components/mobile/feedback/ToastProvider'
import type { Project } from '@/types/database'

interface Session {
  id: string
  duration_minutes: number
  notes: string | null
  project: { title: string; color: string } | null
}

// Helper functions
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function CareerTracker({
  todaySessions: initialSessions,
}: {
  todaySessions: Session[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { projects, archiveProject, refreshProjects } = useProjects()

  const {
    activeSession: activeStudySession,
    startSession,
    updateTimer,
    updateNotes: updateSessionNotes,
    endSession,
    isSessionActive,
  } = useStudySession()

  // Session state derived from hook
  const isRunning = isSessionActive
  
  // Calculate seconds from start time for accuracy (survives tab backgrounding)
  const [, setTick] = useState(0)
  const seconds = activeStudySession?.startedAt
    ? Math.floor((Date.now() - new Date(activeStudySession.startedAt).getTime()) / 1000)
    : 0

  // UI mode state
  const [mode, setMode] = useState<'timer' | 'manual'>('timer')
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined)

  // Form state
  const activeProjects = projects.filter(p => !p.archived)
  const [selectedProject, setSelectedProject] = useState(
    activeStudySession?.projectId || activeProjects[0]?.id || ''
  )
  const [notes, setNotes] = useState(activeStudySession?.notes || '')
  const [manualMinutes, setManualMinutes] = useState(30)
  const [manualHours, setManualHours] = useState(0)

  // Data state
  const [todaySessions, setTodaySessions] = useState(initialSessions)

  // Timer effect - trigger re-renders and periodically update storage
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        // Force re-render to recalculate seconds from start time
        setTick(t => t + 1)
        // Periodically update storage for session recovery
        updateTimer(seconds)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, seconds, updateTimer])

  const { showToast } = useToast()

  // Sync notes with session
  useEffect(() => {
    if (notes && isSessionActive) {
      updateSessionNotes(notes)
    }
  }, [notes, isSessionActive])

  // Aggregate today's sessions
  const todayByProject = todaySessions.reduce((acc, session) => {
    const name = session.project?.title ?? 'Unknown'
    const color = session.project?.color ?? '#3b82f6'
    if (!acc[name]) {
      acc[name] = { minutes: 0, color }
    }
    acc[name].minutes += session.duration_minutes || 0
    return acc
  }, {} as Record<string, { minutes: number; color: string }>)

  const totalMinutes = Object.values(todayByProject).reduce((sum, p) => sum + p.minutes, 0)
  const currentSessionMinutes = isRunning ? Math.floor(seconds / 60) : 0
  const adjustedTotal = totalMinutes + currentSessionMinutes

  // Timer handlers
  async function handleStartTimer() {
    if (!selectedProject) return

    startTransition(async () => {
      try {
        await startSession(selectedProject)
      } catch (error) {
        showToast('Failed to start session. Please try again.', 'error')
        console.error('Start session error:', error)
      }
    })
  }

  async function handleStopTimer() {
    if (!activeStudySession) return

    const previousSessions = todaySessions

    startTransition(async () => {
      try {
        // Optimistically update
        const project = activeProjects.find(p => p.id === selectedProject)
        const newSession: Session = {
          id: activeStudySession.sessionId,
          duration_minutes: Math.floor(seconds / 60),
          notes: notes || null,
          project: project ? { title: project.title, color: project.color } : null,
        }
        setTodaySessions(prev => [newSession, ...prev])

        const result = await endSession(notes || undefined)
        setNotes('')
        
        // Only show success toast if data was actually saved
        if (result.saved) {
          showToast('Session saved!', 'success')
        } else {
          // Remove the temp session if nothing was saved
          setTodaySessions(previousSessions)
        }
      } catch (error) {
        setTodaySessions(previousSessions)
        showToast('Failed to save session. Please try again.', 'error')
        console.error('Stop session error:', error)
      }
    })
  }

  function handleResetTimer() {
    updateTimer(0)
  }

  // Manual entry handler
  async function handleManualLog() {
    if (!selectedProject) return

    const totalMin = (manualHours * 60) + manualMinutes
    if (totalMin <= 0) {
      showToast('Duration must be greater than 0', 'error')
      return
    }

    const previousSessions = todaySessions

    startTransition(async () => {
      try {
        // Optimistic update
        const project = activeProjects.find(p => p.id === selectedProject)
        const tempSession: Session = {
          id: 'temp-' + Date.now(),
          duration_minutes: totalMin,
          notes: notes || null,
          project: project ? { title: project.title, color: project.color } : null,
        }
        setTodaySessions(prev => [tempSession, ...prev])

        const newSession = await logCompletedSession(selectedProject, totalMin, notes || undefined)

        setManualMinutes(30)
        setManualHours(0)
        setNotes('')
        showToast('Session logged!', 'success')
        
        // Navigate to review page
        if (newSession && newSession.id) {
          router.push(`/review/study?sessionId=${newSession.id}`)
        }
      } catch (error) {
        setTodaySessions(previousSessions)
        showToast('Failed to log session. Please try again.', 'error')
        console.error('Manual log error:', error)
      }
    })
  }

  // Project management handlers
  function handleCreateProject() {
    setEditingProject(undefined)
    setShowProjectModal(true)
  }

  function handleEditProject(project: Project) {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  function handleProjectModalClose() {
    setShowProjectModal(false)
    setEditingProject(undefined)
  }

  async function handleProjectSuccess() {
    await refreshProjects()
    handleProjectModalClose()
  }

  async function handleArchiveProject(projectId: string) {
    const projectToArchive = activeProjects.find(p => p.id === projectId)
    if (!projectToArchive) return

    const confirmed = confirm(
      `Archive "${projectToArchive.title}"? Sessions will be preserved but the project will be hidden.`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        await archiveProject(projectId)

        if (selectedProject === projectId) {
          const remaining = activeProjects.filter(p => p.id !== projectId)
          setSelectedProject(remaining[0]?.id ?? '')
        }

        showToast('Project archived!', 'success')
      } catch (error) {
        showToast('Failed to archive project. Please try again.', 'error')
        console.error('Archive project error:', error)
      }
    })
  }

  // No projects state
  if (activeProjects.length === 0) {
    return (
      <section className="space-y-4">
        <div className="bg-zinc-900 rounded-xl p-6 text-center">
          <p className="text-body-md text-zinc-400 mb-4">No projects found. Create one to start tracking.</p>
          <button
            onClick={handleCreateProject}
            className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-6 py-3 font-semibold transition-colors"
          >
            Create Your First Project
          </button>
        </div>

        <ProjectFormModal
          isOpen={showProjectModal}
          onClose={handleProjectModalClose}
          onSuccess={handleProjectSuccess}
          editingProject={editingProject}
          mode={editingProject ? 'edit' : 'create'}
        />
      </section>
    )
  }

  return (
    <section className="space-y-4">

      <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
        <button
          onClick={() => setShowProjectManager(!showProjectManager)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-semibold">Manage Projects</span>
          <span className="text-zinc-400">{showProjectManager ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Project Manager Section */}
      {showProjectManager && (
        <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-body-sm text-zinc-400 mb-3 font-medium">ACTIVE PROJECTS</h3>
            <div className="space-y-2">
              {activeProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <p className="font-medium">{project.title}</p>
                      {project.type && (
                        <p className="text-label-sm text-zinc-500 capitalize">{project.type}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      disabled={isPending}
                      className="text-label-sm text-zinc-400 hover:text-cyan-400 disabled:opacity-50 transition-colors px-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchiveProject(project.id)}
                      disabled={isPending}
                      className="text-label-sm text-zinc-400 hover:text-red-400 disabled:opacity-50 transition-colors px-2"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateProject}
            className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 font-semibold transition-colors"
          >
            + Create New Project
          </button>
        </div>
      )}

      <ProjectFormModal
        isOpen={showProjectModal}
        onClose={handleProjectModalClose}
        onSuccess={handleProjectSuccess}
        editingProject={editingProject}
        mode={editingProject ? 'edit' : 'create'}
      />

      <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
        <ToggleButton
          options={[
            { value: 'timer', label: 'Timer' },
            { value: 'manual', label: 'Manual' },
          ]}
          selectedValue={mode}
          onChange={(value) => setMode(value as 'timer' | 'manual')}
          className={`${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Main Interface - Timer Mode */}
      {mode === 'timer' && (
        <>
          {/* Project selector */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-body-sm text-zinc-400 block mb-2">
              {isRunning ? 'Current Project' : 'Select Project'}
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={isRunning}
              className="w-full bg-zinc-800 rounded-lg p-4 text-title-md font-medium disabled:opacity-50"
            >
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Timer display */}
          <div className="bg-zinc-900 rounded-xl p-8 text-center">
            <p className={`text-6xl font-mono font-bold ${isRunning ? 'text-blue-400' : 'text-white'}`}>
              {formatTime(seconds)}
            </p>
            <p className="text-zinc-500 text-body-sm mt-3">
              {isRunning ? '🔴 Recording...' : 'Ready to start'}
            </p>
          </div>

          {/* Notes input */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-body-sm text-zinc-400 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you working on?"
              className="w-full bg-zinc-800 rounded-lg p-3 text-body-md resize-none"
              rows={2}
              maxLength={500}
              disabled={isPending}
            />
            {notes.length > 400 && (
              <p className="text-label-sm text-zinc-500 mt-1">{notes.length}/500</p>
            )}
          </div>

          {/* Timer controls */}
          <div className="grid grid-cols-2 gap-3">
            {!isRunning ? (
              <button
                onClick={handleStartTimer}
                disabled={isPending || !selectedProject}
                className="col-span-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-xl p-5 text-title-lg font-bold transition-colors"
              >
                {isPending ? 'Starting...' : 'Start Session'}
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                disabled={isPending}
                className="col-span-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 rounded-xl p-5 text-title-lg font-bold transition-colors"
              >
                {isPending ? 'Stopping...' : 'Stop Session'}
              </button>
            )}
            <button
              onClick={handleResetTimer}
              disabled={isRunning}
              className="col-span-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-50 rounded-xl p-4 text-title-md font-semibold transition-colors"
            >
              Reset
            </button>
          </div>
        </>
      )}

      {/* Main Interface - Manual Mode */}
      {mode === 'manual' && (
        <>
          {/* Project selector */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-body-sm text-zinc-400 block mb-2">Select Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg p-4 text-title-md font-medium"
            >
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Duration slider */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-body-sm text-zinc-400 block mb-2">
              Duration: {formatMinutes(manualMinutes + manualHours * 60)}
            </label>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={manualMinutes + manualHours * 60}
              onChange={(e) => {
                const total = Number(e.target.value)
                setManualHours(Math.floor(total / 60))
                setManualMinutes(total % 60)
              }}
              className="w-full accent-emerald-500"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[15, 30, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setManualHours(Math.floor(mins / 60))
                    setManualMinutes(mins % 60)
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-body-sm text-zinc-400 transition-colors"
                >
                  {formatMinutes(mins)}
                </button>
              ))}
            </div>

            {/* Manual input */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-label-sm text-zinc-500 mb-2">Or enter manually:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label-sm text-zinc-500 block mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={manualHours}
                    onChange={(e) => setManualHours(Math.max(0, Math.min(12, Number(e.target.value))))}
                    className="w-full bg-zinc-800 rounded-lg p-2 text-center"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-zinc-500 block mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full bg-zinc-800 rounded-lg p-2 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes input */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <label className="text-body-sm text-zinc-400 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              className="w-full bg-zinc-800 rounded-lg p-3 text-body-md resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Log button */}
          <button
            onClick={handleManualLog}
            disabled={isPending || !selectedProject}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-xl p-5 text-title-lg font-bold transition-colors"
          >
            {isPending ? 'Logging...' : 'Log Session'}
          </button>
        </>
      )}

      {/* Today's Summary */}
      {(Object.keys(todayByProject).length > 0 || isRunning) && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body-sm text-zinc-400 font-medium">TODAY'S PROGRESS</h3>
            <span className="text-headline-md font-bold text-emerald-400">
              {formatMinutes(adjustedTotal)}
              {isRunning && <span className="text-body-sm text-zinc-500 ml-1">(+{formatMinutes(currentSessionMinutes)})</span>}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(todayByProject).map(([name, data]) => {
              const percentage = totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="text-body-sm">{name}</span>
                    </div>
                    <span className="text-body-sm text-emerald-400 font-semibold">
                      {formatMinutes(data.minutes)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: data.color,
                      }}
                    />
                  </div>
                  <p className="text-label-sm text-zinc-600 mt-1">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
