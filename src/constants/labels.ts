// UI 라벨 맵
// 02_scoring.yml 의 job_tracks / ai_profile 키는 signal 목록만 정의하고 사람이 읽을 한글
// 라벨을 포함하지 않는다(night_tracks 는 title 이 있어 YAML에서 바로 읽는다).
// 이 파일은 "문항/응답 콘텐츠"가 아니라 화면 표시용 라벨만 다루므로 하드코딩 금지 원칙
// (질문 ID·텍스트를 하드코딩하지 않는다)의 대상이 아니다.

export const JOB_TRACK_LABELS: Record<string, string> = {
  bx_brand: 'BX·브랜드',
  advertising_content: '광고·콘텐츠',
  editorial_print: '편집·인쇄',
  package_goods_commerce: '패키지·굿즈·커머스',
  digital_ai_visual: '디지털·AI 비주얼',
}

export const JOB_TRACK_DESCRIPTIONS: Record<string, string> = {
  bx_brand: '로고·BI, 브랜드 가이드라인, 브랜드 콘텐츠와 연결되는 영역입니다.',
  advertising_content: 'SNS 콘텐츠, 광고 영상, 숏폼 등과 연결되는 영역입니다.',
  editorial_print: '책·잡지, 브로슈어, 브랜드북 등 편집·인쇄물과 연결되는 영역입니다.',
  package_goods_commerce: '상세페이지, 쇼핑몰 콘텐츠, 상품·굿즈 콘텐츠와 연결되는 영역입니다.',
  digital_ai_visual: 'AI 이미지·영상 제작, AI 캐릭터 등 디지털 비주얼과 연결되는 영역입니다.',
}

export const AI_PROFILE_LABELS: Record<string, string> = {
  image_generation: 'AI 이미지 생성',
  design_assistance: 'AI 디자인 보조 활용',
  ai_character: 'AI 캐릭터 제작',
  ai_content: 'AI 콘텐츠 제작',
  workflow_automation: '업무 자동화(Workflow)',
  agent: 'AI 에이전트 활용',
  certification: 'AI 관련 자격 취득',
}

export const COURSE_DIRECTION_LABELS: Record<string, { title: string; description: string }> = {
  daytime: {
    title: '주간 과정과 연결되는 응답이에요',
    description: '취업, 창업, 신기술 학습을 목표로 평일 낮 시간에 집중하는 방향과 잘 연결됩니다.',
  },
  nighttime: {
    title: '야간 과정과 연결되는 응답이에요',
    description:
      '재직 중 역량 강화, 직무전환, 경력재진입, 제2직업 준비 등과 함께 평일 저녁 시간을 활용하는 방향과 잘 연결됩니다.',
  },
  both: {
    title: '주간·야간 모두와 연결되는 응답이에요',
    description: '두 시간대 모두 가능성이 있는 응답입니다. 학습 가능한 시간대를 기준으로 선택해도 좋습니다.',
  },
  exploration: {
    title: '아직 탐색이 더 필요해요',
    description: '지금 응답만으로는 방향이 뚜렷하지 않아요. 상담을 통해 더 자세히 살펴볼 수 있습니다.',
  },
}
