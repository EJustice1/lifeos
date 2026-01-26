'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { LifeGoal } from '@/types/database'
import {
  getLifeGoals as getLifeGoalsAction,
  createLifeGoal as createLifeGoalAction,
  updateLifeGoal as updateLifeGoalAction,
  deleteLifeGoal as deleteLifeGoalAction,
} from '@/lib/actions/tasks'

interface GoalContextValue {
  goals: LifeGoal[]
  loading: boolean
  error: Error | null

  // Goal operations
  createGoal: (data: CreateGoalData) => Promise<LifeGoal>
  updateGoal: (id: string, updates: Partial<LifeGoal>) => Promise<LifeGoal>
  deleteGoal: (id: string) => Promise<void>

  // Filtering
  getGoalsByCategory: (category: LifeGoal['category']) => LifeGoal[]
  getActiveGoals: () => LifeGoal[]

  // Refresh
  refreshGoals: () => Promise<void>
}

interface CreateGoalData {
  title: string
  description?: string
  category?: LifeGoal['category']
  target_date?: string
}

const GoalContext = createContext<GoalContextValue | undefined>(undefined)

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<LifeGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load goals on mount
  useEffect(() => {
    refreshGoals()
  }, [])

  const refreshGoals = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedGoals = await getLifeGoalsAction(false)
      setGoals(fetchedGoals)
      setError(null)
    } catch (err) {
      console.error('Failed to load goals:', err)
      setError(err instanceof Error ? err : new Error('Failed to load goals'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimistic update pattern
  const createGoal = useCallback(async (data: CreateGoalData): Promise<LifeGoal> => {
    const tempId = `temp-${Date.now()}`
    const optimisticGoal: LifeGoal = {
      id: tempId,
      user_id: '', // Will be set by server
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      status: 'active',
      target_date: data.target_date || null,
      completed_at: null,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setGoals(prev => [...prev, optimisticGoal])

    try {
      const newGoal = await createLifeGoalAction(data)
      setGoals(prev => prev.map(g => (g.id === tempId ? newGoal : g)))
      return newGoal
    } catch (err) {
      setGoals(prev => prev.filter(g => g.id !== tempId))
      throw err
    }
  }, [])

  const updateGoal = useCallback(async (id: string, updates: Partial<LifeGoal>): Promise<LifeGoal> => {
    const oldGoal = goals.find(g => g.id === id)
    if (!oldGoal) throw new Error('Goal not found')

    // Optimistic update
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)))

    try {
      const updatedGoal = await updateLifeGoalAction(id, updates)
      setGoals(prev => prev.map(g => (g.id === id ? updatedGoal : g)))
      return updatedGoal
    } catch (err) {
      // Rollback
      setGoals(prev => prev.map(g => (g.id === id ? oldGoal : g)))
      throw err
    }
  }, [goals])

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    const oldGoals = goals

    // Optimistic delete
    setGoals(prev => prev.filter(g => g.id !== id))

    try {
      await deleteLifeGoalAction(id)
    } catch (err) {
      // Rollback
      setGoals(oldGoals)
      throw err
    }
  }, [goals])

  // Filtering helpers
  const getGoalsByCategory = useCallback((category: LifeGoal['category']): LifeGoal[] => {
    return goals.filter(g => g.category === category)
  }, [goals])

  const getActiveGoals = useCallback((): LifeGoal[] => {
    return goals.filter(g => g.status === 'active' && !g.archived)
  }, [goals])

  const value: GoalContextValue = {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalsByCategory,
    getActiveGoals,
    refreshGoals,
  }

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}

export function useGoals() {
  const context = useContext(GoalContext)
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider')
  }
  return context
}
