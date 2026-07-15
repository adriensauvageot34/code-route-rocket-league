import type {
  HomeDashboardViewModel,
  HomeDashboardViewModelInput,
  HomeFeatureAvailability,
  HomeModePreview,
  HomeStatisticsSummary,
  HomeViewAvailability,
  TargetedSessionsSummary,
  WeeklyFocus,
} from "@/types/home";

const defaultFeatures: HomeFeatureAvailability = {
  placement: false,
  competitive: false,
  targetedSessions: false,
};

const defaultWeeklyFocus: WeeklyFocus = {
  state: "pending",
  title: "Axe de travail de la semaine",
  statusLabel: "\u00c0 confirmer",
  description: "Fais des sessions pour identifier une priorite fiable.",
};

const defaultTargetedSessions: TargetedSessionsSummary = {
  state: "locked",
  title: "Sessions ciblees",
  description: "Plusieurs sessions sont necessaires pour construire ton profil et proposer un travail cible.",
};

export function createHomeDashboardViewModel(
  input: HomeDashboardViewModelInput = {},
): HomeDashboardViewModel {
  const featureAvailability = { ...defaultFeatures, ...input.featureAvailability };
  const playerStage = input.playerStage ?? "building_profile";
  const selectedView = input.selectedView ?? "statistics";

  const viewAvailability: HomeViewAvailability[] = [
    {
      id: "statistics",
      title: "Statistiques",
      description: "Suis ta progression et retrouve tes sessions.",
      state: "available",
    },
    {
      id: "training",
      title: "Entrainement",
      description: "Travaille tes decisions 2v2 avec correction et bilan.",
      state: "available",
    },
    {
      id: "competitive",
      title: "Competitif",
      description: "Challenge-toi en condition de match.",
      state: featureAvailability.competitive ? "available" : "locked",
      lockReason: "Permis n\u00e9cessaire",
    },
  ];

  return {
    playerStage,
    selectedView,
    permitProgress: clampPercentage(input.permitProgress ?? 0),
    featureAvailability,
    viewAvailability,
    hero: {
      title: "Lis le jeu.",
      accentTitle: "Decide mieux.",
      description:
        "Un cockpit d'entrainement Rocket League centre sur tes decisions, avec des etats honnetes tant que le profil se construit.",
    },
    modePreviews: createModePreviews(featureAvailability),
    statistics: createStatisticsSummary(input, featureAvailability),
  };
}

function createModePreviews(
  featureAvailability: HomeFeatureAvailability,
): Record<"training" | "competitive", HomeModePreview> {
  const trainingAction = featureAvailability.placement
    ? {
        label: "Commencer mon placement",
        disabled: true,
        feedback: "Le placement est prepare, mais pas encore relie a une route jouable.",
      }
    : {
        label: "Lancer une session",
        href: "/session",
        ariaLabel: "Lancer une session d'entrainement",
      };

  return {
    training: {
      mode: "training",
      title: "Lis le jeu. Decide mieux.",
      description:
        "Enchaine des situations 2v2 realistes, lis les roles, puis consolide tes choix avec une correction et un bilan.",
      bullets: ["Decisions 2v2", "Situations realistes", "Correction et bilan"],
      action: trainingAction,
    },
    competitive: {
      mode: "competitive",
      title: "Challenge-toi en condition de match.",
      description: "Decouvre l'apercu competitif pendant que ton permis se construit.",
      bullets: ["Apercu selectionnable", "Permis de match requis", "Progression sans classement"],
      action: {
        label: "Permis n\u00e9cessaire",
        disabled: true,
        feedback: "Ma\u00eetrise les bases pour obtenir le permis.",
        ariaLabel: "Permis n\u00e9cessaire pour le mode competitif",
      },
    },
  };
}

function createStatisticsSummary(
  input: HomeDashboardViewModelInput,
  featureAvailability: HomeFeatureAvailability,
): HomeStatisticsSummary {
  return {
    weeklyFocus: {
      ...defaultWeeklyFocus,
      ...input.weeklyFocus,
    },
    strengths: (input.strengths ?? []).slice(0, 3),
    weaknesses: (input.weaknesses ?? []).slice(0, 3),
    targetedSessions: {
      ...defaultTargetedSessions,
      state: featureAvailability.targetedSessions ? "available" : "locked",
      ...input.targetedSessions,
    },
    recentSessions: (input.recentSessions ?? []).slice(0, 3),
    allSessionsHref: input.allSessionsHref,
  };
}

function clampPercentage(value: number): number {
  const normalizedValue = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.min(100, Math.max(0, normalizedValue));
}
