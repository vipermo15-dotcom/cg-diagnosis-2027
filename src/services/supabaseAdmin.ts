// 관리자(상담 신청 조회) 전용 서비스
// Supabase Auth 매직링크 로그인 + supabase/admin_rls.sql 의 RPC 3개만 사용한다.
// 관리자 등록(admin_users insert)은 기관 담당자가 Supabase 대시보드에서 1회 수행 — DEPLOY.md 참고.

import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

export { isSupabaseConfigured }

export interface ConsultationRow {
  id: string
  sessionId: string | null
  preferredCourse: string | null
  preferredTime: string | null
  message: string | null
  status: string
  requestedAt: string
  courseDirection: string | null
  resultTitle: string | null
  primaryTrack: string | null
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.auth.signOut()
}

export async function listConsultations(): Promise<{
  rows: ConsultationRow[]
  error?: string
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { rows: [], error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { data, error } = await supabase.rpc('admin_list_consultations')
  if (error) return { rows: [], error: error.message }
  const rows: ConsultationRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    sessionId: (r.session_id as string) ?? null,
    preferredCourse: (r.preferred_course as string) ?? null,
    preferredTime: (r.preferred_time as string) ?? null,
    message: (r.message as string) ?? null,
    status: r.status as string,
    requestedAt: r.requested_at as string,
    courseDirection: (r.course_direction as string) ?? null,
    resultTitle: (r.result_title as string) ?? null,
    primaryTrack: (r.primary_track as string) ?? null,
  }))
  return { rows }
}

export async function updateConsultationStatus(
  id: string,
  status: 'new' | 'contacted' | 'done',
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { error } = await supabase.rpc('admin_update_consultation_status', {
    p_id: id,
    p_status: status,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
