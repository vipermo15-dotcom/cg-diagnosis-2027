// Supabase 서비스 스텁
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않으면 isSupabaseConfigured=false 이며
// 모든 함수는 실제 네트워크 호출 없이 콘솔 로그만 남기고 조용히 넘어간다.
// → 이 앱은 Supabase 없이도 완전히 로컬에서 동작한다.
//
// 실제 연동 시 해야 할 일 (README 참고):
//   1) Supabase 프로젝트 생성
//   2) supabase/schema.md 의 SQL 실행
//   3) .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 설정
//   4) RLS 정책은 schema.md 에 정의되어 있지 않음 — 기관 개인정보 정책에 맞춰 별도 설계 필요

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AnswerMap, ConsultationRequest, DiagnosisResult } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null

function stubLog(action: string, payload?: unknown) {
  // eslint-disable-next-line no-console
  console.info(`[stub] Supabase not configured, skipping persist: ${action}`, payload)
}

// 테이블 직접 접근 대신 SECURITY DEFINER RPC만 호출한다 (supabase/rls_and_rpc.sql 참고).
// anon 키는 테이블 SELECT/INSERT 권한이 전혀 없고, 이 4개 함수 실행 권한만 가진다.

export async function createSession(): Promise<{ sessionId: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    stubLog('createSession')
    return { sessionId: null }
  }
  const { data, error } = await supabase.rpc('create_diagnosis_session')
  if (error) {
    console.error('createSession failed', error)
    return { sessionId: null }
  }
  return { sessionId: (data as string) ?? null }
}

export async function saveAnswer(
  sessionId: string | null,
  questionId: string,
  value: unknown,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !sessionId) {
    stubLog('saveAnswer', { questionId, value })
    return
  }
  const { error } = await supabase.rpc('save_diagnosis_answer', {
    p_session_id: sessionId,
    p_question_id: questionId,
    p_answer_value: value,
  })
  if (error) console.error('saveAnswer failed', error)
}

export async function saveResult(
  sessionId: string | null,
  result: DiagnosisResult,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !sessionId) {
    stubLog('saveResult', result)
    return
  }
  const { error } = await supabase.rpc('save_diagnosis_result', {
    p_session_id: sessionId,
    p_life_stage: result.lifeStage,
    p_course_direction: result.courseDirection,
    p_primary_track: result.jobTrack.primary,
    p_secondary_track: result.jobTrack.secondary ?? null,
    p_night_career_track: result.nightCareer?.primary ?? null,
    p_result_title: result.resultTitle,
    p_result_summary: result.resultSummary,
    p_ai_profile: result.aiProfile,
    p_roadmap: result.roadmap,
  })
  if (error) console.error('saveResult failed', error)
}

export async function submitConsultation(
  sessionId: string | null,
  request: ConsultationRequest,
): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    stubLog('submitConsultation', { sessionId, ...request })
    return { ok: true }
  }
  const { error } = await supabase.rpc('submit_consultation', {
    p_session_id: sessionId,
    p_preferred_course: request.preferredCourse,
    p_preferred_time: request.preferredTime,
    p_message: request.message,
  })
  if (error) {
    console.error('submitConsultation failed', error)
    return { ok: false }
  }
  return { ok: true }
}

// 사용하지 않는 타입 임포트 방지용 재노출(문서/타입 참고용)
export type { AnswerMap }
