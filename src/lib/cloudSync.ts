import type { Goal, PressureCalibrationSnapshot, PressureHistoryRecord, Task, UserProfile } from '../types/task';
import { supabase, type SupabaseSession } from './supabaseClient';

interface JsonRow<T> {
  id: string;
  data: T;
  updated_at?: string;
}

interface ProfileRow {
  user_id: string;
  profile: UserProfile | null;
  pressure_calibration: PressureCalibrationSnapshot | null;
  onboarding_complete: boolean;
  updated_at?: string;
}

export interface CloudData {
  tasks: Task[];
  goals: Goal[];
  pressureHistory: PressureHistoryRecord[];
  profile: UserProfile | null;
  pressureCalibration: PressureCalibrationSnapshot | null;
  onboardingComplete: boolean | null;
}

const encode = (value: string) => encodeURIComponent(value).replace(/'/g, '%27');

function rowFromEntity<T extends { id: string }>(entity: T, userId: string) {
  return { id: entity.id, user_id: userId, data: entity, updated_at: new Date().toISOString() };
}

async function loadJsonRows<T>(table: 'tasks' | 'goals' | 'pressure_logs', session: SupabaseSession): Promise<T[]> {
  const rows = await supabase.rest<JsonRow<T>[]>(`${table}?select=id,data,updated_at&user_id=eq.${encode(session.user.id)}`, { method: 'GET' }, session);
  return rows.map((row) => row.data).filter(Boolean);
}

async function replaceJsonRows<T extends { id: string }>(table: 'tasks' | 'goals' | 'pressure_logs', values: T[], session: SupabaseSession): Promise<void> {
  await supabase.rest(`${table}?user_id=eq.${encode(session.user.id)}`, { method: 'DELETE' }, session);
  if (values.length === 0) return;
  await supabase.rest(table, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(values.map((value) => rowFromEntity(value, session.user.id))),
  }, session);
}

export async function loadCloudData(session: SupabaseSession): Promise<CloudData> {
  const [tasks, goals, pressureHistory, profiles] = await Promise.all([
    loadJsonRows<Task>('tasks', session),
    loadJsonRows<Goal>('goals', session),
    loadJsonRows<PressureHistoryRecord>('pressure_logs', session),
    supabase.rest<ProfileRow[]>(`profiles?select=user_id,profile,pressure_calibration,onboarding_complete&user_id=eq.${encode(session.user.id)}&limit=1`, { method: 'GET' }, session),
  ]);
  const profile = profiles[0];
  return {
    tasks,
    goals,
    pressureHistory,
    profile: profile?.profile ?? null,
    pressureCalibration: profile?.pressure_calibration ?? null,
    onboardingComplete: typeof profile?.onboarding_complete === 'boolean' ? profile.onboarding_complete : null,
  };
}

export async function saveCloudTasks(tasks: Task[], session: SupabaseSession): Promise<void> {
  await replaceJsonRows('tasks', tasks, session);
}

export async function saveCloudGoals(goals: Goal[], session: SupabaseSession): Promise<void> {
  await replaceJsonRows('goals', goals, session);
}

export async function saveCloudPressureHistory(records: PressureHistoryRecord[], session: SupabaseSession): Promise<void> {
  await replaceJsonRows('pressure_logs', records, session);
}

export async function saveCloudProfile(input: { profile: UserProfile; pressureCalibration: PressureCalibrationSnapshot; onboardingComplete: boolean }, session: SupabaseSession): Promise<void> {
  await supabase.rest('profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      user_id: session.user.id,
      email: session.user.email ?? null,
      profile: input.profile,
      pressure_calibration: input.pressureCalibration,
      onboarding_complete: input.onboardingComplete,
      updated_at: new Date().toISOString(),
    }),
  }, session);
}
