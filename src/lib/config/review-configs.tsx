import type { RatingOption } from '@/components/widgets'
import type { ReactNode } from 'react'

export interface SessionReviewConfig {
  // Database
  tableName: 'workouts' | 'study_sessions'
  field1Name: string
  field2Name: string
  
  // UI Content
  pageTitle: string
  rating1Title: string
  rating1Color: string
  rating1Description: string
  rating1Icon: ReactNode
  rating1IconFilled: ReactNode
  rating1Options: RatingOption[]
  
  rating2Title: string
  rating2Color: string
  rating2Description: string
  rating2Icon: ReactNode
  rating2IconFilled: ReactNode
  rating2Options: RatingOption[]
  
  failureTags: string[]
  notesPlaceholder: string
  returnPath: string
}

// Gym Icons
const DumbbellIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10V3a1 1 0 011-1h1a1 1 0 011 1v7M8 10V3a1 1 0 00-1-1H6a1 1 0 00-1 1v7M8 14v7a1 1 0 001 1h1a1 1 0 001-1v-7M14 14v7a1 1 0 01-1 1h-1a1 1 0 01-1-1v-7M8 10h8M8 14h8" />
  </svg>
)

const DumbbellFilledIcon = () => (
  <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 10V3a1 1 0 011-1h1a1 1 0 011 1v7M8 10V3a1 1 0 00-1-1H6a1 1 0 00-1 1v7M8 14v7a1 1 0 001 1h1a1 1 0 001-1v-7M14 14v7a1 1 0 01-1 1h-1a1 1 0 01-1-1v-7M8 10h8M8 14h8" />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const HeartFilledIcon = () => (
  <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
)

// Study Icons
const FireIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
)

const FireFilledIcon = () => (
  <svg className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
  </svg>
)

const BrainIcon = () => (
  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const BrainFilledIcon = () => (
  <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1 .75.75 0 01-.152 1.485h-1.918l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 0118.75 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 01-.262 1.453h-8.37a.75.75 0 01-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 015.25 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84L4.168 6.241H2.25a.75.75 0 01-.152-1.485 49.105 49.105 0 019.152-1V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
)

// Rating Options
const INTENSITY_LEVELS: RatingOption[] = [
  { value: 1, label: 'Very Light', description: 'Barely challenging', color: 'text-red-400' },
  { value: 2, label: 'Light', description: 'Could do much more', color: 'text-orange-400' },
  { value: 3, label: 'Moderate', description: 'Challenging but manageable', color: 'text-yellow-400' },
  { value: 4, label: 'Hard', description: 'Near limit, difficult to complete', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Maximum', description: 'All-out effort, at absolute limit', color: 'text-green-400' },
]

const FEELING_LEVELS: RatingOption[] = [
  { value: 1, label: 'Terrible', description: 'Felt awful, no energy', color: 'text-red-400' },
  { value: 2, label: 'Poor', description: 'Low energy, struggled through', color: 'text-orange-400' },
  { value: 3, label: 'Okay', description: 'Average, nothing special', color: 'text-yellow-400' },
  { value: 4, label: 'Good', description: 'Felt strong, energized', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Excellent', description: 'Peak condition, felt amazing', color: 'text-green-400' },
]

const EFFORT_LEVELS: RatingOption[] = [
  { value: 1, label: 'Minimal', description: 'Passive consumption, no deep work', color: 'text-red-400' },
  { value: 2, label: 'Light', description: 'Some active engagement, easily distracted', color: 'text-orange-400' },
  { value: 3, label: 'Moderate', description: 'Focused work with occasional breaks', color: 'text-yellow-400' },
  { value: 4, label: 'High', description: 'Deep focus, minimal distractions', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Maximum', description: 'Peak flow state, completely immersed', color: 'text-green-400' },
]

const FOCUS_LEVELS: RatingOption[] = [
  { value: 1, label: 'Scattered', description: 'Constant interruptions', color: 'text-red-400' },
  { value: 2, label: 'Fragmented', description: 'Frequent context switching', color: 'text-orange-400' },
  { value: 3, label: 'Decent', description: 'Maintained attention most of the time', color: 'text-yellow-400' },
  { value: 4, label: 'Sharp', description: 'Clear thinking, good comprehension', color: 'text-emerald-400', recommended: true },
  { value: 5, label: 'Crystal', description: 'Peak mental clarity, exceptional retention', color: 'text-green-400' },
]

// Failure Tags
const GYM_FAILURE_TAGS = [
  'Low Energy',
  'Bad Sleep',
  'Injury/Pain',
  'Short on Time',
]

const STUDY_FAILURE_TAGS = [
  'Brain Fog',
  'Social Distraction',
  'Phone',
  'Poor Planning',
  'Boredom',
]

// Gym Review Configuration
export const GYM_REVIEW_CONFIG: SessionReviewConfig = {
  tableName: 'workouts',
  field1Name: 'effort_rating',
  field2Name: 'feeling_rating',
  pageTitle: 'Workout Review',
  rating1Title: 'Intensity (RPE)',
  rating1Color: 'text-red-400',
  rating1Description: 'How hard was this workout?',
  rating1Icon: <DumbbellIcon />,
  rating1IconFilled: <DumbbellFilledIcon />,
  rating1Options: INTENSITY_LEVELS,
  rating2Title: 'How You Felt',
  rating2Color: 'text-emerald-400',
  rating2Description: 'How did you feel during the workout?',
  rating2Icon: <HeartIcon />,
  rating2IconFilled: <HeartFilledIcon />,
  rating2Options: FEELING_LEVELS,
  failureTags: GYM_FAILURE_TAGS,
  notesPlaceholder: 'Any additional thoughts about this workout...',
  returnPath: '/m/gym',
}

// Study Review Configuration
export const STUDY_REVIEW_CONFIG: SessionReviewConfig = {
  tableName: 'study_sessions',
  field1Name: 'effort_rating',
  field2Name: 'focus_rating',
  pageTitle: 'Study Session Review',
  rating1Title: 'Effort Level',
  rating1Color: 'text-orange-400',
  rating1Description: 'How much effort did you put into this session?',
  rating1Icon: <FireIcon />,
  rating1IconFilled: <FireFilledIcon />,
  rating1Options: EFFORT_LEVELS,
  rating2Title: 'Focus Quality',
  rating2Color: 'text-blue-400',
  rating2Description: 'How was your mental clarity and focus?',
  rating2Icon: <BrainIcon />,
  rating2IconFilled: <BrainFilledIcon />,
  rating2Options: FOCUS_LEVELS,
  failureTags: STUDY_FAILURE_TAGS,
  notesPlaceholder: 'Any additional thoughts about this session...',
  returnPath: '/m/study',
}
