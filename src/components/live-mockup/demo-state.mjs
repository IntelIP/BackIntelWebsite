export const EDITABLE_STATUSES = ["queued", "active", "closed"];

export const STATUS_LABELS = {
  queued: "Queued",
  active: "Active",
  closed: "Closed",
};

export const INITIAL_RECORDS = Object.freeze([
  Object.freeze({
    id: "signal-001",
    title: "Candidate ledger review",
    type: "Evidence",
    owner: "Avery",
    status: "active",
    updated: "2m ago",
  }),
  Object.freeze({
    id: "signal-002",
    title: "Release packet assembled",
    type: "Delivery",
    owner: "Mina",
    status: "queued",
    updated: "18m ago",
  }),
  Object.freeze({
    id: "signal-003",
    title: "Source link verified",
    type: "Research",
    owner: "Jon",
    status: "closed",
    updated: "1h ago",
  }),
  Object.freeze({
    id: "signal-004",
    title: "Acceptance brief updated",
    type: "Product",
    owner: "Avery",
    status: "active",
    updated: "2h ago",
  }),
]);

function cloneRecords(records) {
  return records.map((record) => ({ ...record }));
}

function nextId(records) {
  let suffix = records.length + 1;
  let id = `signal-${String(suffix).padStart(3, "0")}`;
  while (records.some((record) => record.id === id)) {
    suffix += 1;
    id = `signal-${String(suffix).padStart(3, "0")}`;
  }
  return id;
}

function normalizeStatus(status) {
  return EDITABLE_STATUSES.includes(status) ? status : "queued";
}

export function createDemoState(records = INITIAL_RECORDS) {
  return { records: cloneRecords(records), filter: "all", query: "" };
}

export function resetDemo(records = INITIAL_RECORDS) {
  return createDemoState(records);
}

export function createRecord(state, input) {
  const title = String(input.title ?? "").trim();
  if (!title) return state;

  const record = {
    id: nextId(state.records),
    title,
    type: String(input.type ?? "Signal").trim() || "Signal",
    owner: String(input.owner ?? "Unassigned").trim() || "Unassigned",
    status: normalizeStatus(input.status),
    updated: "now",
  };
  return { ...state, records: [...state.records, record] };
}

export function updateRecord(state, id, patch) {
  return {
    ...state,
    records: state.records.map((record) =>
      record.id === id
        ? {
            ...record,
            ...(patch.title === undefined ? {} : { title: String(patch.title).trim() || record.title }),
            ...(patch.type === undefined ? {} : { type: String(patch.type).trim() || record.type }),
            ...(patch.owner === undefined ? {} : { owner: String(patch.owner).trim() || record.owner }),
            ...(patch.status === undefined ? {} : { status: normalizeStatus(patch.status) }),
            updated: "now",
          }
        : record,
    ),
  };
}

export function updateStatus(state, id, status) {
  return updateRecord(state, id, { status });
}

export function deleteRecord(state, id) {
  return { ...state, records: state.records.filter((record) => record.id !== id) };
}

export function setFilter(state, filter) {
  return { ...state, filter: ["all", ...EDITABLE_STATUSES].includes(filter) ? filter : "all" };
}

export function setQuery(state, query) {
  return { ...state, query: String(query ?? "") };
}

export function visibleRecords(state) {
  const query = state.query.trim().toLowerCase();
  return state.records.filter((record) => {
    const matchesFilter = state.filter === "all" || record.status === state.filter;
    const matchesQuery = !query || [record.title, record.type, record.owner, record.status].some((value) =>
      value.toLowerCase().includes(query),
    );
    return matchesFilter && matchesQuery;
  });
}

export function summarize(state) {
  return {
    total: state.records.length,
    queued: state.records.filter((record) => record.status === "queued").length,
    active: state.records.filter((record) => record.status === "active").length,
    closed: state.records.filter((record) => record.status === "closed").length,
  };
}
