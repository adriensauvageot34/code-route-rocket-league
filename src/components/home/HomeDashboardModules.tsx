import { HistoryCard } from "@/components/home/HistoryCard";
import { LockedFeatureCard } from "@/components/home/LockedFeatureCard";
import { PermitCard } from "@/components/home/PermitCard";
import { RecentSessionCard } from "@/components/home/RecentSessionCard";
import { ResourceCard } from "@/components/home/ResourceCard";
import { SkillProgressCard } from "@/components/home/SkillProgressCard";
import { WeaknessSummaryCard } from "@/components/home/WeaknessSummaryCard";
import { WeeklyPriorityCard } from "@/components/home/WeeklyPriorityCard";
import type { HomeDashboardModules as HomeDashboardModulesModel } from "@/types/home";

type HomeDashboardModulesProps = {
  modules: HomeDashboardModulesModel;
};

export function HomeDashboardModules({ modules }: HomeDashboardModulesProps) {
  return (
    <section className="dashboard-modules" aria-label="Tableau de bord pedagogique">
      <WeeklyPriorityCard weeklyPriority={modules.weeklyPriority} />
      <RecentSessionCard recentSession={modules.recentSession} />
      <WeaknessSummaryCard weaknesses={modules.weaknesses} />
      <SkillProgressCard skills={modules.skills} />
      <PermitCard permit={modules.permit} />
      <HistoryCard history={modules.history} />
      <ResourceCard resources={modules.resources} />
      <LockedFeatureCard />
    </section>
  );
}
