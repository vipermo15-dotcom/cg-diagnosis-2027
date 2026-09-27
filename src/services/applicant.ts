// 예비 지원자 "내 결과 다시 보기" 전용 서비스
// admin과 동일한 Supabase Auth 매직링크를 쓰지만, 권한은 완전히 분리된다
// (admin_users가 아니라 applicants.user_id로 연결, RPC도 별도).

import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import type { AiProfileResult, CourseComparisonEntry, RoadmapStepWithOverlay } from '../types'

export { isSupabaseConfigured as isMyPortalConfigured }

export interface StoredResult {
  sessionId: string
  lifeStage: string
  courseDirection: string
  primaryTrack: string
  secondaryTrack: string | null
  nightCareerTrack: string | null
  resultTitle: string
  resultSummary: string
  aiProfile: AiProfileResult
  roadmap: RoadmapStepWithOverlay[]
  courseComparison: CourseComparisonEntry[]
  createdAt: string
}

// 관리자(/#admin) 매직링크와 콜백이 섞이지 않도록 portal=my 마커를 붙인다.
function myRedirectTo(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?portal=my`
}

export async function sendMyMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: myRedirectTo() },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getMySession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export function onMyAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function signOutMy(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.auth.signOut()
}

export async function claimAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { error } = await supabase.rpc('claim_applicant_account')
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getMyResult(): Promise<{ result: StoredResult | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { result: null, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { data, error } = await supabase.rpc('get_my_results')
  if (error) return { result: null, error: error.message }
  const rows = (data ?? []) as Record<string, unknown>[]
  if (rows.length === 0) return { result: null }
  const r = rows[0]
  return {
    result: {
      sessionId: r.session_id as string,
      lifeStage: r.life_stage as string,
      courseDirection: r.course_direction as string,
      primaryTrack: r.primary_track as string,
      secondaryTrack: (r.secondary_track as string) ?? null,
      nightCareerTrack: (r.night_career_track as string) ?? null,
      resultTitle: r.result_title as string,
      resultSummary: r.result_summary as string,
      aiProfile: (r.ai_profile as AiProfileResult) ?? { dimensions: [], interests: [] },
      roadmap: (r.roadmap as RoadmapStepWithOverlay[]) ?? [],
      courseComparison: (r.course_comparison as CourseComparisonEntry[]) ?? [],
      createdAt: r.created_at as string,
    },
  }
}
