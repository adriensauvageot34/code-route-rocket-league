export type HomePlayerStage = "needs_placement" | "building_profile" | "active";
export type HomeModeId = "training" | "competitive";
export type HomeViewId = "statistics" | HomeModeId;
export type HomeFeatureState = "available" | "locked" | "coming_soon";
export type WeeklyFocusState = "pending" | "choice_required" | "active" | "renewal_due";

export type HomeFeatureAvailability = {
  placement: boolean;
  competitive: boolean;
  targetedSessions: boolean;
};

export type HomeViewAvailability = {
  id: HomeViewId;
  title: string;
  description: string;
  state: HomeFeatureState;
  lockReason?: string;
};

export type HomeAction = {
  label: string;
  href?: string;
  disabled?: boolean;
  feedback?: string;
  ariaLabel?: string;
};

export type HomeModePreview = {
  mode: HomeModeId;
  title: string;
  description: string;
  bullets: string[];
  action: HomeAction;
};

export type WeeklyFocus = {
  state: WeeklyFocusState;
  title: string;
  statusLabel: string;
  description: string;
  skill?: string;
};

export type SkillInsight = {
  skill: string;
  status?: string;
  cognitiveCause?: string;
};

export type TargetedSessionsSummary = {
  state: HomeFeatureState;
  title: string;
  description: string;
  href?: string;
};

export type HomeSessionSummary = {
  id: string;
  title: string;
  dateLabel?: string;
  scoreLabel?: string;
  href?: string;
};

export type HomeStatisticsSummary = {
  weeklyFocus: WeeklyFocus;
  strengths: SkillInsight[];
  weaknesses: SkillInsight[];
  targetedSessions: TargetedSessionsSummary;
  recentSessions: HomeSessionSummary[];
  allSessionsHref?: string;
};

export type HomeDashboardViewModel = {
  playerStage: HomePlayerStage;
  selectedView: HomeViewId;
  permitProgress: number;
  featureAvailability: HomeFeatureAvailability;
  viewAvailability: HomeViewAvailability[];
  hero: {
    title: string;
    accentTitle: string;
    description: string;
  };
  modePreviews: Record<HomeModeId, HomeModePreview>;
  statistics: HomeStatisticsSummary;
};

export type HomeDashboardViewModelInput = Partial<{
  playerStage: HomePlayerStage;
  selectedView: HomeViewId;
  permitProgress: number;
  featureAvailability: Partial<HomeFeatureAvailability>;
  weeklyFocus: Partial<WeeklyFocus>;
  strengths: SkillInsight[];
  weaknesses: SkillInsight[];
  targetedSessions: Partial<TargetedSessionsSummary>;
  recentSessions: HomeSessionSummary[];
  allSessionsHref: string;
}>;
