import type {
  HomeDashboardModules,
  HomeDashboardViewModel,
  HomeDashboardViewModelInput,
  HomeFeatureAvailability,
  HomeModeAvailability,
  HomeModePreview,
  PermitStatus,
  RecentSession,
  WeeklyPriority
} from "@/types/home";

const defaultFeatures: HomeFeatureAvailability = {
  placement: false,
  competitive: false,
  targetedSessions: false,
  accounts: false,
  advancedResources: false
};

const defaultWeeklyPriority: WeeklyPriority = {
  state: "none",
  title: "Priorite hebdomadaire",
  description: "Fais une premiere session pour construire une priorite fiable."
};

const defaultRecentSession: RecentSession = {
  state: "none",
  title: "Derniere session",
  description: "Fais une premiere session pour debloquer ton bilan."
};

const defaultPermitStatus: PermitStatus = {
  state: "locked",
  label: "Permis verrouille",
  description: "Ton permis de match se debloquera quand les donnees seront suffisantes."
};

export function createHomeDashboardViewModel(
  input: HomeDashboardViewModelInput = {}
): HomeDashboardViewModel {
  const featureAvailability = { ...defaultFeatures, ...input.featureAvailability };
  const playerStage = input.playerStage ?? "building_profile";
  const selectedMode = input.selectedMode ?? "training";

  const modeAvailability: HomeModeAvailability[] = [
    {
      id: "training",
      title: "Entrainement",
      description: "Travaille tes decisions 2v2 avec correction et bilan.",
      state: "available"
    },
    {
      id: "competitive",
      title: "Competitif",
      description: "Challenge-toi en condition de match.",
      state: featureAvailability.competitive ? "available" : "locked",
      lockReason: "Obtiens ton permis de match."
    }
  ];

  return {
    playerStage,
    selectedMode,
    featureAvailability,
    modeAvailability,
    hero: {
      title: "Lis le jeu.",
      accentTitle: "Decide mieux.",
      description: "Un cockpit d'entrainement Rocket League centre sur tes decisions, avec des etats honnetes tant que le profil se construit."
    },
    previews: createModePreviews(featureAvailability),
    modules: createModules(input)
  };
}

function createModePreviews(featureAvailability: HomeFeatureAvailability): Record<"training" | "competitive", HomeModePreview> {
  const trainingAction = featureAvailability.placement
    ? {
        label: "Commencer mon placement",
        disabled: true,
        feedback: "Le placement est prepare, mais pas encore relie a une route jouable."
      }
    : {
        label: "Lancer une session",
        href: "/session",
        ariaLabel: "Lancer une session d'entrainement"
      };

  return {
    training: {
      mode: "training",
      title: "Lis le jeu. Decide mieux.",
      description: "Enchaine des situations 2v2 realistes, lis les roles, puis consolide tes choix avec une correction et un bilan.",
      bullets: ["Decisions 2v2", "Situations realistes", "Correction et bilan"],
      action: trainingAction
    },
    competitive: {
      mode: "competitive",
      title: "Challenge-toi en condition de match.",
      description: "Le mode competitif reste un apercu verrouille tant que le permis de match n'est pas disponible.",
      bullets: ["Apercu selectionnable", "Obtiens ton permis de match", "Aucun classement fictif"],
      action: {
        label: "Mode verrouille",
        disabled: true,
        feedback: "Debloque ce mode en validant tes bases.",
        ariaLabel: "Mode competitif verrouille"
      }
    }
  };
}

function createModules(input: HomeDashboardViewModelInput): HomeDashboardModules {
  return {
    weeklyPriority: {
      ...defaultWeeklyPriority,
      ...input.weeklyPriority
    },
    recentSession: {
      ...defaultRecentSession,
      ...input.recentSession
    },
    primaryWeakness: input.primaryWeakness,
    secondaryWeaknesses: (input.secondaryWeaknesses ?? []).slice(0, 2),
    skillSummaries:
      input.skillSummaries ??
      [
        { skill: "Positionnement", state: "not_evaluated", label: "Non evalue" },
        { skill: "Defense", state: "not_evaluated", label: "Non evalue" },
        { skill: "Gestion du boost", state: "not_evaluated", label: "Non evalue" }
      ],
    permitStatus: {
      ...defaultPermitStatus,
      ...input.permitStatus
    },
    history: {
      state: "none",
      title: "Historique",
      description: "Aucune session enregistree pour le moment.",
      ...input.history
    },
    resources: input.resources ?? [],
    targetedSessions: {
      id: "targetedSessions",
      title: "Sessions ciblees",
      description: "Cette option arrivera quand le profil disposera de suffisamment de donnees fiables.",
      state: "locked",
      ...input.targetedSessions
    }
  };
}
