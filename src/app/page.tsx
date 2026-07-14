import { AppFrame } from "@/components/AppFrame";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { getHomeDashboardViewModel } from "@/lib/home/getHomeDashboardViewModel";

export default function Home() {
  const viewModel = getHomeDashboardViewModel();

  return (
    <AppFrame variant="home">
      <HomeDashboard viewModel={viewModel} />
    </AppFrame>
  );
}
