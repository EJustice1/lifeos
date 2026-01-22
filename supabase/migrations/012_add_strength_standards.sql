-- Migration to seed initial strength standards data
-- This migration populates the gym_strength_standards table with baseline data

-- Seed strength standards for all major exercises
INSERT INTO gym_strength_standards (
  exercise_id, gender, weight_class, beginner, intermediate, advanced, elite
)
VALUES
  -- Bench Press Standards
  (1, 'male', 'light', 115, 165, 225, 315),
  (1, 'male', 'medium', 135, 195, 275, 365),
  (1, 'male', 'heavy', 155, 225, 315, 405),
  (1, 'female', 'light', 65, 95, 135, 185),
  (1, 'female', 'medium', 75, 115, 165, 225),
  (1, 'female', 'heavy', 85, 135, 195, 275),

  -- Incline Dumbbell Press Standards
  (2, 'male', 'light', 85, 115, 150, 185),
  (2, 'male', 'medium', 95, 135, 175, 225),
  (2, 'male', 'heavy', 115, 155, 200, 250),
  (2, 'female', 'light', 35, 50, 75, 100),
  (2, 'female', 'medium', 45, 65, 95, 125),
  (2, 'female', 'heavy', 55, 85, 115, 150),

  -- Overhead Press Standards
  (3, 'male', 'light', 85, 115, 145, 185),
  (3, 'male', 'medium', 95, 135, 175, 225),
  (3, 'male', 'heavy', 115, 155, 205, 255),
  (3, 'female', 'light', 35, 50, 70, 95),
  (3, 'female', 'medium', 45, 65, 85, 115),
  (3, 'female', 'heavy', 55, 85, 105, 135),

  -- Deadlift Standards
  (6, 'male', 'light', 225, 315, 405, 500),
  (6, 'male', 'medium', 275, 365, 455, 550),
  (6, 'male', 'heavy', 315, 405, 500, 600),
  (6, 'female', 'light', 135, 185, 225, 275),
  (6, 'female', 'medium', 165, 225, 275, 315),
  (6, 'female', 'heavy', 185, 275, 315, 365),

  -- Barbell Row Standards
  (7, 'male', 'light', 135, 185, 225, 275),
  (7, 'male', 'medium', 155, 205, 255, 315),
  (7, 'male', 'heavy', 175, 235, 295, 365),
  (7, 'female', 'light', 75, 105, 135, 165),
  (7, 'female', 'medium', 85, 125, 165, 205),
  (7, 'female', 'heavy', 95, 145, 195, 245),

  -- Pull-up Standards (weight in lbs added to bodyweight)
  (8, 'male', 'light', 0, 25, 50, 75),
  (8, 'male', 'medium', 0, 35, 65, 95),
  (8, 'male', 'heavy', 0, 45, 85, 115),
  (8, 'female', 'light', 0, 0, 15, 35),
  (8, 'female', 'medium', 0, 0, 25, 55),
  (8, 'female', 'heavy', 0, 0, 35, 75),

  -- Squat Standards
  (11, 'male', 'light', 155, 225, 315, 405),
  (11, 'male', 'medium', 185, 275, 365, 455),
  (11, 'male', 'heavy', 225, 315, 405, 500),
  (11, 'female', 'light', 95, 135, 185, 225),
  (11, 'female', 'medium', 115, 165, 225, 275),
  (11, 'female', 'heavy', 135, 185, 275, 315),

  -- Leg Press Standards
  (12, 'male', 'light', 275, 365, 455, 550),
  (12, 'male', 'medium', 315, 405, 500, 600),
  (12, 'male', 'heavy', 365, 455, 550, 650),
  (12, 'female', 'light', 135, 185, 225, 275),
  (12, 'female', 'medium', 165, 225, 275, 315),
  (12, 'female', 'heavy', 185, 275, 315, 365),

  -- Romanian Deadlift Standards
  (13, 'male', 'light', 185, 225, 275, 315),
  (13, 'male', 'medium', 205, 255, 315, 365),
  (13, 'male', 'heavy', 225, 295, 365, 425),
  (13, 'female', 'light', 95, 135, 165, 185),
  (13, 'female', 'medium', 115, 165, 195, 225),
  (13, 'female', 'heavy', 135, 185, 225, 255),

  -- Plank Standards (in seconds)
  (23, 'male', 'light', 60, 120, 180, 240),
  (23, 'male', 'medium', 90, 150, 210, 270),
  (23, 'male', 'heavy', 120, 180, 240, 300),
  (23, 'female', 'light', 60, 120, 180, 240),
  (23, 'female', 'medium', 90, 150, 210, 270),
  (23, 'female', 'heavy', 120, 180, 240, 300),

  -- Cable Crunch Standards (weight in lbs)
  (24, 'male', 'light', 50, 75, 100, 125),
  (24, 'male', 'medium', 60, 90, 120, 150),
  (24, 'male', 'heavy', 70, 105, 140, 175),
  (24, 'female', 'light', 25, 40, 55, 70),
  (24, 'female', 'medium', 30, 45, 65, 85),
  (24, 'female', 'heavy', 35, 55, 75, 95)

-- Handle conflicts by doing nothing (keep existing data)
ON CONFLICT (exercise_id, gender, weight_class) DO NOTHING;