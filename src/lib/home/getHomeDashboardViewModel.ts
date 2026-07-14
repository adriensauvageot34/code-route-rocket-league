import { createHomeDashboardViewModel } from "./homeDashboardViewModel";
import type { HomeDashboardViewModel } from "@/types/home";

export function getHomeDashboardViewModel(): HomeDashboardViewModel {
  return createHomeDashboardViewModel();
}
