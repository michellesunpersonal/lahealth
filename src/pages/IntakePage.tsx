import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../data/SessionContext";
import { store } from "../data/storage";
import { strings, t } from "../i18n/strings";
import { useIntakeFlow } from "../conversation/useIntakeFlow";
import { createBlankVisit, FALLBACK_PROFILE } from "../data/blank";

export default function IntakePage() {
  const { visitId } = useParams<{ visitId: string }>();
  const { profile } = useSession();
  const navigate = useNavigate();

  const storedVisit = visitId ? store.getVisit(visitId) : null;
  const isValid = !!profile && !!storedVisit && storedVisit.patientProfileId === profile.id;
  const lang = isValid ? storedVisit!.languageUsed : "en";

  // useIntakeFlow must be called unconditionally (rules of hooks); when the
  // route doesn't resolve to a real visit yet, feed it an inert placeholder
  // and bail out of rendering below instead.
  const flow = useIntakeFlow(
    isValid ? storedVisit! : createBlankVisit("", "", "en"),
    profile ?? FALLBACK_PROFILE,
    lang
  );
  const [textInput, setTextInput] = useState("");

  if (!profile) return null;
  if (!isValid) return <Navigate to="/dashboard" replace />;
  const visit = storedVisit!;

  function handleSend() {
    if (!textInput.trim()) return;
    flow.submitText(textInput);
    setTextInput("");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="text-xs text-slate-400">{t(strings.intake.forClinic, lang)}</div>
          <div className="font-semibold text-slate-900">{visit.intendedProvider.clinicName}</div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-4 overflow-y-auto">
        {flow.visit.conversation.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] text-sm text-slate-800">
                {turn.questionTextShown}
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-teal-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm">
                {turn.answerVerbatim}
              </div>
            </div>
          </div>
        ))}

        {!flow.isDone && flow.currentStep && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] text-sm text-slate-800">
              {flow.currentStep.prompt[lang]}
            </div>
          </div>
        )}

        {flow.isDone && (
          <div className="text-center py-10">
            <div className="text-2xl mb-2">✓</div>
            <div className="font-medium text-slate-800 mb-4">{t(strings.intake.done, lang)}</div>
            <button
              onClick={() => navigate(`/visit/${visit.id}/briefing`)}
              className="px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
            >
              {t(strings.intake.seeOutputs, lang)}
            </button>
          </div>
        )}
      </main>

      {!flow.isDone && flow.currentStep && (
        <footer className="bg-white border-t border-slate-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {flow.currentStep.kind === "choice" && flow.currentStep.options && (
              <div className="flex flex-wrap gap-2">
                {flow.currentStep.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => flow.submitChoice(opt.value, opt.label[lang])}
                    className="px-3 py-2 rounded-full border border-slate-300 text-sm hover:border-teal-500 hover:bg-teal-50"
                  >
                    {opt.label[lang]}
                  </button>
                ))}
              </div>
            )}

            {flow.currentStep.kind === "yesno" && (
              <div className="flex gap-2">
                <button
                  onClick={() => flow.submitYesNo(true)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                >
                  {t(strings.intake.yes, lang)}
                </button>
                <button
                  onClick={() => flow.submitYesNo(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
                >
                  {t(strings.intake.no, lang)}
                </button>
              </div>
            )}

            {flow.currentStep.kind === "text" && (
              <div className="flex gap-2">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={t(strings.intake.yourAnswer, lang)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                >
                  {t(strings.intake.send, lang)}
                </button>
                {flow.currentStep.optional && (
                  <button
                    onClick={() => flow.skip()}
                    className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-500 hover:bg-slate-50"
                  >
                    {t(strings.intake.skip, lang)}
                  </button>
                )}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
