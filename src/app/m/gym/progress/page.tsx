"use client";

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/mobile/feedback/ToastProvider';
import {
  getMuscleGroupPercentiles,
  getFeaturedPersonalRecords,
  getRecentWorkoutsWithDetails
} from '@/lib/actions/gym';
import { ClientCache, CACHE_KEYS, CACHE_DURATIONS } from '@/lib/cache-utils';

// Dynamically import chart component to reduce initial bundle size
const MuscleGroupRadarChart = dynamic(
  () => import('../MuscleGroupRadarChart').then(mod => ({ default: mod.MuscleGroupRadarChart })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-72 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-body-sm">Loading chart...</p>
        </div>
      </div>
    )
  }
);

export default function GymProgressPage() {
  const [muscleGroupData, setMuscleGroupData] = useState<any>(null);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        // Try to load from cache first for instant display
        const cachedMuscleGroups = ClientCache.get<any>(CACHE_KEYS.MUSCLE_GROUP_PERCENTILES);
        const cachedPRs = ClientCache.get<any[]>(CACHE_KEYS.PERSONAL_RECORDS);
        const cachedDates = ClientCache.get<string[]>(CACHE_KEYS.WORKOUT_DATES);

        if (cachedMuscleGroups && cachedPRs && cachedDates) {
          setMuscleGroupData(cachedMuscleGroups);
          setPersonalRecords(cachedPRs);
          setWorkoutDates(cachedDates);
          setLoading(false);
          setFromCache(true);
        } else {
          setLoading(true);
        }

        // Fetch fresh data in background
        const [muscleGroups, prs, workouts] = await Promise.all([
          getMuscleGroupPercentiles(),
          getFeaturedPersonalRecords(),
          getRecentWorkoutsWithDetails(30) // Last 30 days for calendar (current month)
        ]);

        if (!mounted) return;

        // Extract unique workout dates
        const dates = workouts.map(w => w.date).filter(Boolean);

        // Update state with fresh data
        setMuscleGroupData(muscleGroups);
        setPersonalRecords(prs || []);
        setWorkoutDates(dates);

        // Debug logging
        console.log('Muscle Group Data:', muscleGroups);
        console.log('Personal Records:', prs?.length);
        console.log('Workout Dates:', dates.length);

        // Cache the fresh data
        ClientCache.set(CACHE_KEYS.MUSCLE_GROUP_PERCENTILES, muscleGroups, CACHE_DURATIONS.MEDIUM);
        ClientCache.set(CACHE_KEYS.PERSONAL_RECORDS, prs || [], CACHE_DURATIONS.LONG);
        ClientCache.set(CACHE_KEYS.WORKOUT_DATES, dates, CACHE_DURATIONS.MEDIUM);

      } catch (error) {
        console.error('Failed to fetch progress data:', error);
        if (mounted) {
          showToast('Failed to load progress data', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setFromCache(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mobile-bg)] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--mobile-accent)] mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  const hasData = personalRecords.length > 0 || workoutDates.length > 0;

  return (
    <div className="min-h-screen bg-[var(--mobile-bg)] text-white pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-headline-md font-bold">Progress</h1>
          <Link
            href="/m/gym"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        {!hasData ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-title-md mb-2 text-zinc-300">No Data Yet</p>
            <p className="text-body-sm text-zinc-400 mb-4">Complete workouts to track progress</p>
            <Link
              href="/m/gym"
              className="inline-block px-6 py-3 bg-[var(--mobile-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start Workout
            </Link>
          </div>
        ) : (
          <>
            {/* Workout Calendar */}
            <WorkoutCalendar workoutDates={workoutDates} />

            {/* Muscle Balance Radar */}
            <div>
              <h3 className="text-title-lg font-semibold mb-4 text-white">Muscle Balance</h3>
              {muscleGroupData ? (
                <div className="h-72">
                  <MuscleGroupRadarChart percentiles={muscleGroupData} />
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center text-zinc-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-body-sm">Loading muscle data...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Records */}
            {personalRecords.length > 0 && (
              <div>
                <h3 className="text-title-lg font-semibold mb-4 text-white">Key Personal Records</h3>
                <div className="space-y-2">
                  {personalRecords.map((pr: any) => (
                    <div
                      key={pr.id}
                      className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-white">{pr.exercise?.name || 'Unknown'}</div>
                        <div className="text-label-sm text-zinc-400">
                          {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-400">
                          {pr.weight} lbs × {pr.reps}
                        </div>
                        <div className="text-label-sm text-zinc-400">
                          1RM: {pr.estimated_1rm}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Workout Calendar Component
const WorkoutCalendar = memo(({ workoutDates }: { workoutDates: string[] }) => {
  // Helper to format date in EST
  const formatDateEST = (date: Date): string => {
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { calendar, currentMonthName, todayEST } = useMemo(() => {
    // Get current date in EST
    const nowEST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const currentYear = nowEST.getFullYear();
    const currentMonth = nowEST.getMonth();

    // Get first day of current month in EST
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Get day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Build calendar grid
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Fill in empty days at start
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Fill in days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const monthName = nowEST.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });

    return { calendar: weeks, currentMonthName: monthName, todayEST: formatDateEST(new Date()) };
  }, []);

  const workoutDateSet = useMemo(() => {
    // Workout dates from DB are already in YYYY-MM-DD format (EST)
    return new Set(workoutDates);
  }, [workoutDates]);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === todayEST;
  };

  const hasWorkout = (date: Date | null) => {
    if (!date) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return workoutDateSet.has(dateStr);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-lg font-semibold text-white">Workout Calendar</h3>
        <div className="text-body-sm text-zinc-400">{currentMonthName}</div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-label-sm font-medium text-zinc-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {calendar.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map((date, dayIdx) => {
              const workout = hasWorkout(date);
              const today = isToday(date);

              return (
                <div
                  key={dayIdx}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-body-sm
                    ${!date ? 'invisible' : ''}
                    ${workout ? 'bg-[var(--mobile-accent)] text-white font-bold' : 'bg-zinc-800/50 text-zinc-400'}
                    ${today && !workout ? 'ring-2 ring-white ring-inset' : ''}
                    ${today && workout ? 'ring-2 ring-yellow-400 ring-inset' : ''}
                    transition-all
                  `}
                >
                  {date ? date.getDate() : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-label-sm text-zinc-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[var(--mobile-accent)]"></div>
          <span>Workout</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-zinc-800/50 ring-2 ring-white"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
});

WorkoutCalendar.displayName = 'WorkoutCalendar';
