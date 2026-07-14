export type HomePlayerStage = "needs_placement" | "building_profile" | "active";
export type HomeModeId = "training" | "competitive";
export type HomeFeatureId = "placement" | "competitive" | "targetedSessions" | "accounts" | "advancedResources";
export type WeeklyPriorityState = "none" | "choice_required" | "active" | "renewal_due";
export type RecentSessionState = "none" | "available";
export type SkillState = "not_evaluated" | "fragile" | "learning" | "acquired" | "automated" | "reinforce";
export type PermitState = "locked" | "in_progress" | "obtained" | "obtained_with_alerts";

export type HomeFeatureAvailability = Record<HomeFeatureId, boolean>;

export type HomeMode = {
  id: HomeModeId;
  title: string;
  description: string;
  status: "available" | "locked";
  lockReason?: string;
};

export type HomeAction = {
  label: string;
  href?: string;
  disabled?: boolean;
  feedback?: string;
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
  reflexPhrase?: string;
  instruction?: string;
};

export type RecentSession = {
  state: RecentSessionState;
  title: string;
  description: string;
  href?: string;
};

export type WeaknessSummary = {
  title: string;
  status: string;
  cognitiveCause?: string;
};

export type SkillSummary = {
  skill: string;
  state: SkillState;
  label: string;
};

export type PermitStatus = {
  state: PermitState;
  label: string;
  description: string;
};

export type HomeDashboardModules = {
  weeklyPriority: WeeklyPriority;
  recentSession: RecentSession;
  weaknesses: WeaknessSummary[];
  skills: SkillSummary[];
  permit: PermitStatus;
  history: RecentSession;
  resources: { title: string; description: string; href?: string }[];
};

export type HomeDashboardViewModel = {
  playerStage: HomePlayerStage;
  selectedMode: HomeModeId;
  featureAvailability: HomeFeatureAvailability;
  modeAvailability: HomeMode[];
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
  weaknesses: WeaknessSummary[];
  skills: SkillSummary[];
  permit: Partial<PermitStatus>;
  resources: HomeDashboardModules["resources"];
}>;
