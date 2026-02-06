-- Seed Data: Actions and Achievements

INSERT INTO public.actions (key, name, category, xp_base, coin_base, cooldown_hours, max_per_day, is_negative) VALUES
('gym_workout', 'Gym Workout', 'health', 50, 5, 4, 2, false),
('run_5k', 'Run 5km', 'health', 60, 6, 12, 1, false),
('pushups_20', '20 Pushups', 'health', 10, 1, 1, 5, false),
('drink_water', 'Drink Water (500ml)', 'health', 5, 0, 1, 8, false),
('cold_shower', 'Cold Shower', 'health', 25, 3, 6, 2, false),
('meditate_10m', 'Meditate 10m', 'mind', 20, 2, 4, 3, false),
('read_10p', 'Read 10 Pages', 'mind', 15, 2, 1, 10, false),
('learn_code', 'Code Session (1h)', 'hustle', 40, 5, 2, 4, false),
('deep_work', 'Deep Work (1h)', 'hustle', 50, 5, 2, 4, false),
('journal', 'Journaling', 'mind', 15, 1, 12, 1, false),
('smoke', 'Smoke Cigarette', 'health', -20, 0, 0, NULL, true),
('alcohol', 'Drink Alcohol', 'health', -30, 0, 0, NULL, true),
('junk_food', 'Eat Junk Food', 'health', -25, 0, 0, NULL, true),
('doomscroll', 'Doomscroll (>30m)', 'mind', -15, 0, 0, NULL, true),
('skip_workout', 'Skip Planned Workout', 'health', -40, 0, 0, NULL, true),
('procrastinate', 'Procrastinate', 'hustle', -20, 0, 0, NULL, true),
('stay_up_late', 'Stay Up Late (>1am)', 'health', -30, 0, 0, NULL, true)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  xp_base = EXCLUDED.xp_base,
  coin_base = EXCLUDED.coin_base,
  cooldown_hours = EXCLUDED.cooldown_hours,
  max_per_day = EXCLUDED.max_per_day,
  is_negative = EXCLUDED.is_negative;

INSERT INTO public.achievements (key, name, description, icon, reward_xp, reward_coin, rules) VALUES
('first_step', 'First Step', 'Log your first action.', '👣', 50, 10, '{"type": "count", "target": 1}'),
('consistent_3', 'Consistent', 'Maintain a 3-day streak.', '🔥', 100, 20, '{"type": "streak", "target": 3}'),
('disciplined_7', 'Disciplined', 'Maintain a 7-day streak.', '🛡️', 500, 100, '{"type": "streak", "target": 7}'),
('hustler_level_1', 'Starting Hustle', 'Reach Level 5.', '💼', 200, 40, '{"type": "level", "target": 5}')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  reward_xp = EXCLUDED.reward_xp,
  reward_coin = EXCLUDED.reward_coin,
  rules = EXCLUDED.rules;
