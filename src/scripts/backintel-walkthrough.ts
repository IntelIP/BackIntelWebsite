const stages = [
  [
    "01 / Original report",
    "A customer cannot access their account.",
    "The customer still receives an error after resetting their password. BackIntel retains that message alongside the queue load, source identity, and availability time.",
    "Collect and check · Python / PostgreSQL",
    "Original evidence",
    "“Login failed.”",
    "70 tickets in the recorded queue. Source text and measurements remain separate from model judgments.",
    "Synthetic customer report · No customer data",
  ],
  [
    "02 / Interpretation",
    "Turn a report into a defined observation.",
    "Jev answers whether the message reports a service failure. The typed answer is retained with the question, original text, model, and request identity.",
    "Interpret · Jev / TypeSafe / OpenRouter",
    "Recorded model observation",
    "Service failure reported",
    "The Access message received an actual Jev response. This describes what the message says; it does not establish the cause of a failure.",
    "Actual provider response · Human correction remains possible",
  ],
  [
    "03 / Comparison",
    "Compare before choosing a prediction.",
    "CatBoost and TabICLv2 ran on measurements alone and on measurements plus Jev. The same six later synthetic cases were used to select a method, alongside a baseline.",
    "Compare · CatBoost / TabICLv2 / baseline",
    "Selected in this synthetic run",
    "CatBoost + Jev",
    "Probability error: 0.1086. Baseline: 0.2531. Lower was better on this validation set. Eighteen earlier records were used for training.",
    "Six selection cases · Customer accuracy is unproven",
  ],
  [
    "04 / Changed information",
    "A corrected report changes the packet.",
    "The Accounts report was corrected to say that the service works. The workflow retained the source change, refreshed the result, and removed the authority of the older prediction.",
    "Refresh · Versioned sources / durable background jobs",
    "Current experimental estimates",
    "Accounts 26.4% · Access 78.7%",
    "Accounts reflects the corrected report. Access still reports a login failure. These are estimates from the synthetic run, not observed customer outcomes.",
    "Three Support source updates · Earlier versions remain traceable",
  ],
  [
    "05 / Human review",
    "The reviewer keeps the final call.",
    "A synthetic Access review was saved in the React workspace and read through the Python interface. Both use the same local review API. Replaying the completed run reused all 90 jobs.",
    "Review · React / Reflex / shared local API",
    "Recorded review outcome",
    "Decision saved locally",
    "The packet keeps the finding, source evidence, experimental prediction, limitations, and human review together. No action was taken on customers.",
    "Recorded synthetic review · This page does not save decisions",
  ],
];
const root = document.querySelector<HTMLElement>("[data-walkthrough]");
if (root) {
  const fields = [
    "stage-label",
    "stage-title",
    "stage-copy",
    "stage-tech",
    "detail-label",
    "detail-value",
    "detail-copy",
    "detail-note",
  ];
  const buttons = root.querySelectorAll<HTMLButtonElement>("button[data-step]");
  const select = root.querySelector<HTMLSelectElement>("[data-stage-select]");
  const result = root.querySelector<HTMLElement>("#demo-result");
  let motion: Animation | undefined;

  function showStage(index: number) {
    const stage = stages[index];
    if (!stage) return;
    fields.forEach((field, i) => {
      const target = root?.querySelector<HTMLElement>(`[data-${field}]`);
      if (target) target.textContent = stage[i];
    });
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.step) === index),
      ),
    );
    if (select) select.value = String(index);
    motion?.cancel();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      motion = result?.animate(
        [{ transform: "translateY(4px)" }, { transform: "translateY(0)" }],
        { duration: 180, easing: "ease-out" },
      );
    }
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      showStage(Number(button.dataset.step)),
    ),
  );
  select?.addEventListener("change", () => showStage(Number(select.value)));
}
