import type { CSSProperties } from "react";
import {
  TRAINING_ANALYSIS_CYCLE_MS,
  trainingAnalysisZones,
} from "@/lib/home/trainingAnalysisZones";

type AnalysisZoneStyle = CSSProperties & {
  "--analysis-cycle": string;
  "--analysis-delay": string;
};

export function TrainingAnalysisOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="training-analysis-overlay"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1672 941"
    >
      {trainingAnalysisZones.map((zone) => {
        const style: AnalysisZoneStyle = {
          "--analysis-cycle": `${TRAINING_ANALYSIS_CYCLE_MS}ms`,
          "--analysis-delay": `${zone.delayMs}ms`,
        };

        return (
          <g
            className="training-analysis-zone"
            data-analysis-zone={zone.id}
            key={zone.id}
            style={style}
          >
            <ellipse
              className="training-analysis-zone-guide"
              cx={zone.cx}
              cy={zone.cy}
              rx={zone.rx}
              ry={zone.ry}
            />
            <ellipse
              className="training-analysis-zone-core"
              cx={zone.cx}
              cy={zone.cy}
              rx={zone.rx * 0.86}
              ry={zone.ry * 0.86}
            />
          </g>
        );
      })}
    </svg>
  );
}
