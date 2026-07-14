export type HomePlayerStage = "needs_placement" | "building_profile" | "active";
export type HomeModeId = "training" | "competitive";
export type HomeFeatureId = "placement" | "competitive" | "targetedSessions" | "accounts" | "advancedResources";
export type HomeFeatureState = "available" | "locked" | "coming_soon";
export type WeeklyPriorityState = "none" | "choice_required" | "active" | "renewal_due";
export type RecentSessionState = "none" | "available" | "new_summary";
export type SkillState = "not_evaluated" | "fragile" | "learning" | "acquired" | "automated" | "reinforce";
export type PermitState = "locked" | "in_progress" | "obtained" | "obtained_with_alerts";

export type HomeFeatureAvailability = Record<HomeFeatureId, boolean>;

export type HomeModeAvailability = {
  id: HomeModeId;
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

export type WeeklyPriority = {
  state: WeeklyPriorityState;
  title: string;
  description: string;
  skill?: string;
  reflexPhrase?: string;
  instruction?: string;
  examples?: string[];
  resources?: HomeResource[];
};

export type RecentSession = {
  state: RecentSessionState;
  title: string;
  description: string;
  scoreLabel?: string;
  dateLabel?: string;
  trendLabel?: string;
  href?: string;
};

export type WeaknessSummary = {
  skill: string;
  status: string;
  cognitiveCause?: string;
  evidenceLabel?: string;
};

export type SkillSummary = {
  skill: string;
  state: SkillState;
  label: string;
  note?: string;
};

export type PermitStatus = {
  state: PermitState;
  label: string;
  description: string;
};

export type HomeResource = {
  title: string;
  description: string;
  href?: string;
};

export type LockedHomeFeature = {
  id: HomeFeatureId;
  title: string;
  description: string;
  state: HomeFeatureState;
};

export type HomeDashboardModules = {
  weeklyPriority: WeeklyPriority;
  recentSession: RecentSession;
  primaryWeakness?: WeaknessSummary;
  secondaryWeaknesses: WeaknessSummary[];
  skillSummaries: SkillSummary[];
  permitStatus: PermitStatus;
  history: RecentSession;
  resources: HomeResource[];
  targetedSessions: LockedHomeFeature;
};

export type HomeDashboardViewModel = {
  playerStage: HomePlayerStage;
  selectedMode: HomeModeId;
  featureAvailability: HomeFeatureAvailability;
  modeAvailability: HomeModeAvailability[];
  hero: {
    title: string;
    accentTitle: string;
    description: string;
  };
  previews: Record<HomeModeId, HomeModePreview>;
  modules: HomeDashboardModules;
};

export type HomeDashboardViewModelInput = Partial<{
  playerStage: HomePlayerStage;
  selectedMode: HomeModeId;
  featureAvailability: Partial<HomeFeatureAvailability>;
  weeklyPriority: Partial<WeeklyPriority>;
  recentSession: Partial<RecentSession>;
  primaryWeakness: WeaknessSummary;
  secondaryWeaknesses: WeaknessSummary[];
  skillSummaries: SkillSummary[];
  permitStatus: Partial<PermitStatus>;
  history: Partial<RecentSession>;
  resources: HomeResource[];
  targetedSessions: Partial<LockedHomeFeature>;
}>;
