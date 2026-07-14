import { HistoryCard } from "@/components/home/HistoryCard";
import { LockedFeatureCard } from "@/components/home/LockedFeatureCard";
import { PermitCard } from "@/components/home/PermitCard";
import { PlayerProfileCard } from "@/components/home/PlayerProfileCard";
import { RecentSessionCard } from "@/components/home/RecentSessionCard";
import { ResourceCard } from "@/components/home/ResourceCard";
import { SkillProgressCard } from "@/components/home/SkillProgressCard";
import { WeaknessSummaryCard } from "@/components/home/WeaknessSummaryCard";
import { WeeklyPriorityCard } from "@/components/home/WeeklyPriorityCard";
import type { HomeDashboardModules as HomeDashboardModulesModel, HomePlayerStage } from "@/types/home";

type HomeDashboardModulesProps = {
  modules: HomeDashboardModulesModel;
  playerStage: HomePlayerStage;
};

export function HomeDashboardModules({ modules, playerStage }: HomeDashboardModulesProps) {
  return (
    <section className="dashboard-modules" aria-label="Tableau de bord pedagogique">
      <WeeklyPriorityCard weeklyPriority={modules.weeklyPriority} />
      <PlayerProfileCard playerStage={playerStage} permitStatus={modules.permitStatus} />
      <RecentSessionCard recentSession={modules.recentSession} />
      <WeaknessSummaryCard
        primaryWeakness={modules.primaryWeakness}
        secondaryWeaknesses={modules.secondaryWeaknesses}
      />
      <SkillProgressCard skills={modules.skillSummaries} />
      <PermitCard permitStatus={modules.permitStatus} />
      <HistoryCard history={modules.history} />
      <ResourceCard resources={modules.resources} />
      <LockedFeatureCard feature={modules.targetedSessions} />
    </section>
  );
}
