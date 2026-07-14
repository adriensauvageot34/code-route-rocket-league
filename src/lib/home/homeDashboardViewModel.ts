import type {
  HomeDashboardModules,
  HomeDashboardViewModel,
  HomeDashboardViewModelInput,
  HomeFeatureAvailability,
  HomeMode,
  HomeModePreview
} from "@/types/home";

const defaultFeatures: HomeFeatureAvailability = {
  placement: false,
  competitive: false,
  targetedSessions: false,
  accounts: false,
  advancedResources: false
};

export function createHomeDashboardViewModel(
  input: HomeDashboardViewModelInput = {}
): HomeDashboardViewModel {
  const featureAvailability = { ...defaultFeatures, ...input.featureAvailability };
  const playerStage = input.playerStage ?? "building_profile";

  const modeAvailability: HomeMode[] = [
    {
      id: "training",
      title: "Entrainement",
      description: "Travaille tes decisions 2v2 avec correction immediate.",
      status: "available"
    },
    {
      id: "competitive",
      title: "Competitif",
      description: "Challenge-toi en condition de match.",
      status: featureAvailability.competitive ? "available" : "locked",
      lockReason: "Obtiens ton permis de match."
    }
  ];

  const trainingAction = featureAvailability.placement
    ? { label: "Commencer mon placement", disabled: true, feedback: "Placement bientot disponible." }
    : { label: "Lancer une session", href: "/session" };

  const previews: Record<"training" | "competitive", HomeModePreview> = {
    training: {
      mode: "training",
      title: "Lis le jeu. Decide mieux.",
      description: "Des situations realistes, une correction claire et un bilan pour construire tes automatismes.",
      bullets: ["Decisions 2v2", "Corrections immediates", "Profil en construction"],
      action: trainingAction
    },
    competitive: {
      mode: "competitive",
      title: "Challenge-toi en condition de match.",
      description: "Le mode competitif restera verrouille tant que le permis de match n'est pas pret.",
      bullets: ["Apercu verrouille", "Pas de faux classement", "Deblocage futur par les bases"],
      action: {
        label: "Mode verrouille",
        disabled: true,
        feedback: "Debloque ce mode en validant tes bases."
      }
    }
  };

  return {
    playerStage,
    selectedMode: input.selectedMode ?? "training",
    featureAvailability,
    modeAvailability,
    hero: {
      title: "Lis le jeu.",
      accentTitle: "Decide mieux.",
      description: "Un cockpit d'entrainement pour travailler tes decisions Rocket League sans inventer de statistiques."
    },
    previews,
    modules: createModules(input)
  };
}

function createModules(input: HomeDashboardViewModelInput): HomeDashboardModules {
  return {
    weeklyPriority: {
      state: "none",
      title: "Priorite hebdomadaire",
      instruction: "Fais une premiere session pour proposer une priorite fiable.",
      ...input.weeklyPriority
    },
    recentSession: {
      state: "none",
      title: "Derniere session",
      description: "Fais une premiere session pour debloquer ton bilan.",
      ...input.recentSession
    },
    weaknesses: (input.weaknesses ?? []).slice(0, 3),
    skills:
      input.skills ??
      [
        { skill: "Positionnement", state: "not_evaluated", label: "Non evalue" },
        { skill: "Defense", state: "not_evaluated", label: "Non evalue" },
        { skill: "Gestion du boost", state: "not_evaluated", label: "Non evalue" }
      ],
    permit: {
      state: "locked",
      label: "Permis verrouille",
      description: "Ton permis se debloquera quand les donnees seront suffisantes.",
      ...input.permit
    },
    history: {
      state: "none",
      title: "Historique",
      description: "Aucune session enregistree pour le moment."
    },
    resources: input.resources ?? []
  };
}
