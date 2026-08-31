import { Link } from "react-router-dom";

type StepKey = "check-in" | "briefing" | "after";

interface Props {
  visitId: string;
  current: StepKey;
  /** Whether the check-in questionnaire has been completed for this visit. */
  checkInDone: boolean;
}

const STEPS: { key: StepKey; label: string }[] = [
  { key: "check-in", label: "Check-in" },
  { key: "briefing", label: "Visit Briefing" },
  { key: "after", label: "After-visit recap" },
];

/**
 * Shared 3-step nav for a visit. Check-in becomes non-interactive once
 * done — re-entering IntakePage on a completed visit restarts the
 * questionnaire (a pre-existing limitation), so it's shown as a checkmark
 * instead of a link. Briefing/after-visit are only reachable once check-in
 * is done, since there's no visit data to show before that.
 */
export default function VisitStepper({ visitId, current, checkInDone }: Props) {
  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      {STEPS.map((step, i) => {
        const isCurrent = step.key === current;
        const isCheckIn = step.key === "check-in";
        const disabled = isCheckIn ? checkInDone : !checkInDone;
        const label = isCheckIn && checkInDone ? `✓ ${step.label}` : step.label;

        return (
          <div key={step.key} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300">·</span>}
            {disabled ? (
              <span className="px-2.5 py-1 text-slate-400">{label}</span>
            ) : (
              <Link
                to={`/visit/${visitId}/${step.key}`}
                className={`px-2.5 py-1 rounded-full ${
                  isCurrent ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
