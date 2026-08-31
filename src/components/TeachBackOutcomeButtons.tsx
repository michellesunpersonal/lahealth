import type { TeachBackOutcome } from "../types/consent";

const TEACH_BACK_OUTCOME_LABEL: Record<TeachBackOutcome, string> = {
  not_yet_tried: "Not yet tried",
  understood: "Understood",
  partially_understood: "Partially understood",
  misunderstood: "Misunderstood",
};

const OUTCOME_BADGE_CLASS: Record<TeachBackOutcome, string> = {
  not_yet_tried: "bg-slate-100 text-slate-500",
  understood: "bg-emerald-100 text-emerald-700",
  partially_understood: "bg-amber-100 text-amber-700",
  misunderstood: "bg-red-100 text-red-700",
};

interface Props {
  value: TeachBackOutcome;
  onChange: (outcome: TeachBackOutcome) => void;
}

/** Shared outcome picker for a teach-back comprehension check — used by both the consent translator and the after-visit recap. */
export default function TeachBackOutcomeButtons({ value, onChange }: Props) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {(Object.keys(TEACH_BACK_OUTCOME_LABEL) as TeachBackOutcome[]).map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`text-xs px-2 py-1 rounded-full ${
            value === o ? OUTCOME_BADGE_CLASS[o] : "bg-slate-50 text-slate-400 hover:bg-slate-100"
          }`}
        >
          {TEACH_BACK_OUTCOME_LABEL[o]}
        </button>
      ))}
    </div>
  );
}
