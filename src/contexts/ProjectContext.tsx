'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Project } from '@/types/database'
import {
  getProjects as getProjectsAction,
  createProject as createProjectAction,
  updateProject as updateProjectAction,
  deleteProject as deleteProjectAction,
  archiveProject as archiveProjectAction,
  unarchiveProject as unarchiveProjectAction,
} from '@/lib/actions/tasks'

interface ProjectContextValue {
  projects: Project[]
  loading: boolean
  error: Error | null

  // Project operations
  createProject: (data: CreateProjectData) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  archiveProject: (id: string) => Promise<Project>
  unarchiveProject: (id: string) => Promise<Project>

  // Filtering
  getProjectsByGoal: (goalId: string) => Project[]
  getOrphanedProjects: () => Project[]
  getProjectsByType: (type: string) => Project[]
  getActiveProjects: () => Project[]

  // Refresh
  refreshProjects: () => Promise<void>
}

interface CreateProjectData {
  title: string
  description?: string
  life_goal_id?: string
  color?: string
  type?: 'class' | 'lab' | 'project' | 'work' | 'other'
  target_date?: string
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load projects on mount
  useEffect(() => {
    refreshProjects()
  }, [])

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedProjects = await getProjectsAction(undefined, false)
      setProjects(fetchedProjects)
      setError(null)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError(err instanceof Error ? err : new Error('Failed to load projects'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimistic update pattern
  const createProject = useCallback(async (data: CreateProjectData): Promise<Project> => {
    const tempId = `temp-${Date.now()}`
    const optimisticProject: Project = {
      id: tempId,
      user_id: '', // Will be set by server
      title: data.title,
      description: data.description || null,
      life_goal_id: data.life_goal_id || null,
      color: data.color || '#3b82f6',
      type: data.type || null,
      status: 'active',
      target_date: data.target_date || null,
      completed_at: null,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setProjects(prev => [...prev, optimisticProject])

    try {
      const newProject = await createProjectAction(data)
      setProjects(prev => prev.map(p => (p.id === tempId ? newProject : p)))
      return newProject
    } catch (err) {
      setProjects(prev => prev.filter(p => p.id !== tempId))
      throw err
    }
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<Project> => {
    const oldProject = projects.find(p => p.id === id)
    if (!oldProject) throw new Error('Project not found')

    // Optimistic update
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)))

    try {
      const updatedProject = await updateProjectAction(id, updates)
      setProjects(prev => prev.map(p => (p.id === id ? updatedProject : p)))
      return updatedProject
    } catch (err) {
      // Rollback
      setProjects(prev => prev.map(p => (p.id === id ? oldProject : p)))
      throw err
    }
  }, [projects])

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    const oldProjects = projects

    // Optimistic delete
    setProjects(prev => prev.filter(p => p.id !== id))

    try {
      await deleteProjectAction(id)
    } catch (err) {
      // Rollback
      setProjects(oldProjects)
      throw err
    }
  }, [projects])

  const archiveProject = useCallback(async (id: string): Promise<Project> => {
    const oldProject = projects.find(p => p.id === id)
    if (!oldProject) throw new Error('Project not found')

    // Optimistic update
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, archived: true, status: 'archived' as const } : p)))

    try {
      const archivedProject = await archiveProjectAction(id)
      setProjects(prev => prev.map(p => (p.id === id ? archivedProject : p)))
      return archivedProject
    } catch (err) {
      // Rollback
      setProjects(prev => prev.map(p => (p.id === id ? oldProject : p)))
      throw err
    }
  }, [projects])

  const unarchiveProject = useCallback(async (id: string): Promise<Project> => {
    const oldProject = projects.find(p => p.id === id)
    if (!oldProject) throw new Error('Project not found')

    // Optimistic update
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, archived: false, status: 'active' as const } : p)))

    try {
      const unarchivedProject = await unarchiveProjectAction(id)
      setProjects(prev => prev.map(p => (p.id === id ? unarchivedProject : p)))
      return unarchivedProject
    } catch (err) {
      // Rollback
      setProjects(prev => prev.map(p => (p.id === id ? oldProject : p)))
      throw err
    }
  }, [projects])

  // Filtering helpers
  const getProjectsByGoal = useCallback((goalId: string): Project[] => {
    return projects.filter(p => p.life_goal_id === goalId && !p.archived)
  }, [projects])

  const getOrphanedProjects = useCallback((): Project[] => {
    return projects.filter(p => !p.life_goal_id && !p.archived)
  }, [projects])

  const getProjectsByType = useCallback((type: string): Project[] => {
    return projects.filter(p => p.type === type && !p.archived)
  }, [projects])

  const getActiveProjects = useCallback((): Project[] => {
    return projects.filter(p => !p.archived)
  }, [projects])

  const value: ProjectContextValue = {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    getProjectsByGoal,
    getOrphanedProjects,
    getProjectsByType,
    getActiveProjects,
    refreshProjects,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}
