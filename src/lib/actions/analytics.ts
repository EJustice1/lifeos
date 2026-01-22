'use server'

import { createClient } from '@/lib/supabase/server'

// Get aggregated daily data for the spike chart (last 30 days)
export async function getSpikeChartData(days = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Fetch all data sources in parallel
  const [workouts, sessions, reviews] = await Promise.all([
    supabase
      .from('workouts')
      .select('date, total_volume')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date'),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date'),
    supabase
      .from('daily_reviews')
      .select('date, mood')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date'),
  ])

  // Create a map of all dates in range
  const dateMap: Record<string, {
    gymVolume: number
    studyMinutes: number
    mood: number | null
  }> = {}

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const dateStr = date.toISOString().split('T')[0]
    dateMap[dateStr] = { gymVolume: 0, studyMinutes: 0, mood: null }
  }

  // Aggregate gym volume by date
  workouts.data?.forEach(w => {
    if (dateMap[w.date]) {
      dateMap[w.date].gymVolume += w.total_volume || 0
    }
  })

  // Aggregate study minutes by date
  sessions.data?.forEach(s => {
    if (dateMap[s.date]) {
      dateMap[s.date].studyMinutes += s.duration_minutes || 0
    }
  })

  // Add mood data
  reviews.data?.forEach(r => {
    if (dateMap[r.date]) {
      dateMap[r.date].mood = r.mood
    }
  })

  // Find max values for normalization
  const allVolumes = Object.values(dateMap).map(d => d.gymVolume)
  const allStudy = Object.values(dateMap).map(d => d.studyMinutes)
  const maxVolume = Math.max(...allVolumes, 1)
  const maxStudy = Math.max(...allStudy, 1)

  // Convert to array with normalized values (0-100 scale)
  return Object.entries(dateMap).map(([date, data]) => ({
    date,
    gymVolume: data.gymVolume,
    gymNormalized: Math.round((data.gymVolume / maxVolume) * 100),
    studyMinutes: data.studyMinutes,
    studyNormalized: Math.round((data.studyMinutes / maxStudy) * 100),
    mood: data.mood,
    moodNormalized: data.mood ? data.mood * 10 : null, // 1-10 scale to 10-100
  }))
}

// Calculate life balance scores (0-100) for each domain
export async function getLifeBalanceData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]

  // Fetch recent activity from all domains
  const [workouts, sessions, screenTime, reviews] = await Promise.all([
    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('screen_time')
      .select('productive_minutes, distracted_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('daily_reviews')
      .select('mood, energy, tags')
      .eq('user_id', user.id)
      .gte('date', startDate),
  ])

  // Gym score - workouts per week (target: 4/week over 4 weeks = 16)
  const workoutCount = workouts.data?.length ?? 0
  const gymScore = Math.min(100, (workoutCount / 16) * 100)

  // Career score - study hours per week (target: 25hrs/week = 1500 min over 4 weeks)
  const totalStudyMinutes = sessions.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) ?? 0
  const careerScore = Math.min(100, (totalStudyMinutes / 1500) * 100)

  // Digital score - productivity rate
  const totalProductive = screenTime.data?.reduce((sum, s) => sum + s.productive_minutes, 0) ?? 0
  const totalDistracted = screenTime.data?.reduce((sum, s) => sum + s.distracted_minutes, 0) ?? 0
  const totalScreen = totalProductive + totalDistracted
  const digitalScore = totalScreen > 0 ? Math.round((totalProductive / totalScreen) * 100) : 50

  // Social score - based on "Social" tag in reviews
  const socialTags = reviews.data?.filter(r => r.tags?.includes('Social')).length ?? 0
  const totalReviews = reviews.data?.length ?? 1
  const socialScore = Math.min(100, (socialTags / totalReviews) * 150 + 30)

  // Health score - average mood and energy
  const avgMood = reviews.data && reviews.data.length > 0
    ? reviews.data.reduce((sum, r) => sum + r.mood, 0) / reviews.data.length
    : 5
  const avgEnergy = reviews.data && reviews.data.length > 0
    ? reviews.data.reduce((sum, r) => sum + r.energy, 0) / reviews.data.length
    : 5
  const healthScore = ((avgMood + avgEnergy) / 2) * 10

  return {
    gym: Math.round(gymScore),
    career: Math.round(careerScore),
    digital: Math.round(digitalScore),
    social: Math.round(socialScore),
    health: Math.round(healthScore),
  }
}

// Calculate detailed correlations between different metrics
export async function getDetailedCorrelations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]

  // Fetch all data sources
  const [reviews, workouts, sessions, screenTime] = await Promise.all([
    supabase
      .from('daily_reviews')
      .select('date, mood, energy, perceived_success')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('workouts')
      .select('date, total_volume')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('study_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate),
    supabase
      .from('screen_time')
      .select('date, productive_minutes, distracted_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate),
  ])

  // Build daily aggregates
  const dailyData: Record<string, {
    mood?: number
    energy?: number
    success?: number
    workedOut: boolean
    gymVolume: number
    studyMinutes: number
    productiveMinutes: number
    distractedMinutes: number
  }> = {}

  reviews.data?.forEach(r => {
    if (!dailyData[r.date]) {
      dailyData[r.date] = {
        workedOut: false, gymVolume: 0, studyMinutes: 0,
        productiveMinutes: 0, distractedMinutes: 0
      }
    }
    dailyData[r.date].mood = r.mood
    dailyData[r.date].energy = r.energy
    dailyData[r.date].success = r.perceived_success
  })

  workouts.data?.forEach(w => {
    if (!dailyData[w.date]) {
      dailyData[w.date] = {
        workedOut: false, gymVolume: 0, studyMinutes: 0,
        productiveMinutes: 0, distractedMinutes: 0
      }
    }
    dailyData[w.date].workedOut = true
    dailyData[w.date].gymVolume += w.total_volume || 0
  })

  sessions.data?.forEach(s => {
    if (!dailyData[s.date]) {
      dailyData[s.date] = {
        workedOut: false, gymVolume: 0, studyMinutes: 0,
        productiveMinutes: 0, distractedMinutes: 0
      }
    }
    dailyData[s.date].studyMinutes += s.duration_minutes || 0
  })

  screenTime.data?.forEach(st => {
    if (!dailyData[st.date]) {
      dailyData[st.date] = {
        workedOut: false, gymVolume: 0, studyMinutes: 0,
        productiveMinutes: 0, distractedMinutes: 0
      }
    }
    dailyData[st.date].productiveMinutes = st.productive_minutes
    dailyData[st.date].distractedMinutes = st.distracted_minutes
  })

  const daysWithMood = Object.values(dailyData).filter(d => d.mood !== undefined)

  if (daysWithMood.length < 5) {
    return [] // Not enough data
  }

  const correlations: Array<{
    insight: string
    strength: 'Strong' | 'Moderate' | 'Weak'
    correlation: number
  }> = []

  // 1. Gym days vs mood
  const gymDaysMood = daysWithMood.filter(d => d.workedOut).map(d => d.mood!)
  const restDaysMood = daysWithMood.filter(d => !d.workedOut).map(d => d.mood!)
  if (gymDaysMood.length > 0 && restDaysMood.length > 0) {
    const avgGymMood = gymDaysMood.reduce((a, b) => a + b, 0) / gymDaysMood.length
    const avgRestMood = restDaysMood.reduce((a, b) => a + b, 0) / restDaysMood.length
    const moodDiff = avgGymMood - avgRestMood
    const normalizedCorr = Math.min(1, Math.max(-1, moodDiff / 3))

    if (Math.abs(normalizedCorr) > 0.1) {
      correlations.push({
        insight: normalizedCorr > 0
          ? 'Gym days correlate with higher mood scores'
          : 'Gym days correlate with lower mood scores',
        strength: Math.abs(normalizedCorr) > 0.5 ? 'Strong' : Math.abs(normalizedCorr) > 0.25 ? 'Moderate' : 'Weak',
        correlation: Math.round(normalizedCorr * 100) / 100,
      })
    }
  }

  // 2. Screen time vs study hours
  const daysWithScreen = Object.values(dailyData).filter(d => d.distractedMinutes > 0 || d.productiveMinutes > 0)
  if (daysWithScreen.length > 5) {
    const highDistraction = daysWithScreen.filter(d => d.distractedMinutes > 120)
    const lowDistraction = daysWithScreen.filter(d => d.distractedMinutes <= 120)

    if (highDistraction.length > 0 && lowDistraction.length > 0) {
      const avgStudyHigh = highDistraction.reduce((a, d) => a + d.studyMinutes, 0) / highDistraction.length
      const avgStudyLow = lowDistraction.reduce((a, d) => a + d.studyMinutes, 0) / lowDistraction.length
      const diff = avgStudyLow - avgStudyHigh
      const normalizedCorr = Math.min(1, Math.max(-1, -diff / 60))

      if (Math.abs(normalizedCorr) > 0.1) {
        correlations.push({
          insight: 'High phone usage correlates with lower study hours',
          strength: Math.abs(normalizedCorr) > 0.5 ? 'Strong' : Math.abs(normalizedCorr) > 0.25 ? 'Moderate' : 'Weak',
          correlation: Math.round(normalizedCorr * 100) / 100,
        })
      }
    }
  }

  // 3. Study hours vs perceived success
  const daysWithStudyAndSuccess = daysWithMood.filter(d => d.success !== undefined && d.studyMinutes > 0)
  if (daysWithStudyAndSuccess.length > 5) {
    const highStudy = daysWithStudyAndSuccess.filter(d => d.studyMinutes > 60)
    const lowStudy = daysWithStudyAndSuccess.filter(d => d.studyMinutes <= 60)

    if (highStudy.length > 0 && lowStudy.length > 0) {
      const avgSuccessHigh = highStudy.reduce((a, d) => a + d.success!, 0) / highStudy.length
      const avgSuccessLow = lowStudy.reduce((a, d) => a + d.success!, 0) / lowStudy.length
      const diff = avgSuccessHigh - avgSuccessLow
      const normalizedCorr = Math.min(1, Math.max(-1, diff / 3))

      if (Math.abs(normalizedCorr) > 0.1) {
        correlations.push({
          insight: 'Study hours correlate with perceived success',
          strength: Math.abs(normalizedCorr) > 0.5 ? 'Strong' : Math.abs(normalizedCorr) > 0.25 ? 'Moderate' : 'Weak',
          correlation: Math.round(normalizedCorr * 100) / 100,
        })
      }
    }
  }

  // 4. Productive screen time vs energy
  const daysWithEnergy = Object.values(dailyData).filter(d => d.energy !== undefined && (d.productiveMinutes > 0 || d.distractedMinutes > 0))
  if (daysWithEnergy.length > 5) {
    const highProductivity = daysWithEnergy.filter(d => {
      const total = d.productiveMinutes + d.distractedMinutes
      return total > 0 && (d.productiveMinutes / total) > 0.5
    })
    const lowProductivity = daysWithEnergy.filter(d => {
      const total = d.productiveMinutes + d.distractedMinutes
      return total > 0 && (d.productiveMinutes / total) <= 0.5
    })

    if (highProductivity.length > 0 && lowProductivity.length > 0) {
      const avgEnergyHigh = highProductivity.reduce((a, d) => a + d.energy!, 0) / highProductivity.length
      const avgEnergyLow = lowProductivity.reduce((a, d) => a + d.energy!, 0) / lowProductivity.length
      const diff = avgEnergyHigh - avgEnergyLow
      const normalizedCorr = Math.min(1, Math.max(-1, diff / 3))

      if (Math.abs(normalizedCorr) > 0.1) {
        correlations.push({
          insight: 'Productive screen time correlates with higher energy',
          strength: Math.abs(normalizedCorr) > 0.5 ? 'Strong' : Math.abs(normalizedCorr) > 0.25 ? 'Moderate' : 'Weak',
          correlation: Math.round(normalizedCorr * 100) / 100,
        })
      }
    }
  }

  // Sort by absolute correlation strength
  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

// Get growth trends data for net worth and strength
export async function getGrowthTrends(months = 12) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Fetch net worth history and PR history
  const [netWorthHistory, prHistory] = await Promise.all([
    supabase
      .from('net_worth_snapshots')
      .select('date, total_assets')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date'),
    supabase
      .from('personal_records')
      .select('date, weight, exercise:exercises(name)')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date'),
  ])

  // Process net worth by month
  const netWorthByMonth: Record<string, number> = {}
  netWorthHistory.data?.forEach(snapshot => {
    const month = snapshot.date.substring(0, 7) // YYYY-MM
    netWorthByMonth[month] = snapshot.total_assets
  })

  // Generate all months in range
  const netWorthData: Array<{ month: string; value: number }> = []
  let lastValue = 0
  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - 1 - i))
    const month = date.toISOString().substring(0, 7)
    const value = netWorthByMonth[month] ?? lastValue
    lastValue = value
    netWorthData.push({ month, value })
  }

  // Calculate net worth YoY change
  const firstNetWorth = netWorthData[0]?.value || 0
  const lastNetWorth = netWorthData[netWorthData.length - 1]?.value || 0
  const netWorthChange = firstNetWorth > 0
    ? Math.round(((lastNetWorth - firstNetWorth) / firstNetWorth) * 100)
    : 0

  // Process PRs - calculate total for all lifts by month
  const prsByMonth: Record<string, Record<string, number>> = {}

  prHistory.data?.forEach(pr => {
    const month = pr.date.substring(0, 7)
    // Supabase returns joined data - exercise could be object or array
    const exercise = pr.exercise as { name: string } | { name: string }[] | null
    const exerciseName = (Array.isArray(exercise) ? exercise[0]?.name : exercise?.name) || 'Unknown'

    if (!prsByMonth[month]) prsByMonth[month] = {}
    // Use the exercise name as the key to track all lifts
    const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '_')
    prsByMonth[month][exerciseKey] = Math.max(prsByMonth[month][exerciseKey] || 0, pr.weight)
  })

  // Generate strength data by month - sum all lifts
  const strengthData: Array<{ month: string; total: number }> = []
  const runningTotal: Record<string, number> = {}

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - 1 - i))
    const month = date.toISOString().substring(0, 7)

    if (prsByMonth[month]) {
      // Update running total with all lifts from this month
      Object.entries(prsByMonth[month]).forEach(([exerciseKey, weight]) => {
        runningTotal[exerciseKey] = Math.max(runningTotal[exerciseKey] || 0, weight)
      })
    }

    strengthData.push({
      month,
      total: Object.values(runningTotal).reduce((sum, weight) => sum + weight, 0)
    })
  }

  // Calculate strength change
  const firstStrength = strengthData[0]?.total || 0
  const lastStrength = strengthData[strengthData.length - 1]?.total || 0
  const strengthChange = lastStrength - firstStrength

  return {
    netWorth: {
      data: netWorthData,
      change: netWorthChange,
      current: lastNetWorth,
    },
    strength: {
      data: strengthData,
      change: strengthChange,
      current: lastStrength,
    },
  }
}
