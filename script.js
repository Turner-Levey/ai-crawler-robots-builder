const AGENTS = [
  {
    token: "OAI-SearchBot",
    group: "OpenAI",
    role: "Search visibility",
    searchMode: "allow",
    strictMode: "block"
  },
  {
    token: "GPTBot",
    group: "OpenAI",
    role: "Model training",
    searchMode: "block",
    strictMode: "block"
  },
  {
    token: "ChatGPT-User",
    group: "OpenAI",
    role: "User-triggered fetch",
    searchMode: "allow",
    strictMode: "block"
  },
  {
    token: "Claude-SearchBot",
    group: "Anthropic",
    role: "Search quality",
    searchMode: "allow",
    strictMode: "block"
  },
  {
    token: "ClaudeBot",
    group: "Anthropic",
    role: "Model training",
    searchMode: "block",
    strictMode: "block"
  },
  {
    token: "Claude-User",
    group: "Anthropic",
    role: "User-triggered fetch",
    searchMode: "allow",
    strictMode: "block"
  },
  {
    token: "Google-Extended",
    group: "Google",
    role: "Gemini control token",
    searchMode: "block",
    strictMode: "block"
  },
  {
    token: "PerplexityBot",
    group: "Perplexity",
    role: "Search index",
    searchMode: "allow",
    strictMode: "block"
  }
];

const state = {
  actions: new Map(AGENTS.map((agent) => [agent.token, agent.searchMode]))
};

const els = {
  agentList: document.querySelector("#agent-list"),
  agentCount: document.querySelector("#agent-count"),
  modeInputs: [...document.querySelectorAll('input[name="mode"]')],
  disallowPaths: document.querySelector("#disallow-paths"),
  allowPaths: document.querySelector("#allow-paths"),
  customAgents: document.querySelector("#custom-agents"),
  output: document.querySelector("#robots-output"),
  summary: document.querySelector("#policy-summary"),
  copy: document.querySelector("#copy-output"),
  download: document.querySelector("#download-output"),
  auditInput: document.querySelector("#audit-input"),
  auditResults: document.querySelector("#audit-results"),
  auditSummary: document.querySelector("#audit-summary"),
  sample: document.querySelector("#load-sample")
};

function linesFrom(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeToken(value) {
  return value.trim().replace(/\s+/g, "");
}

function getMode() {
  return els.modeInputs.find((input) => input.checked)?.value || "search";
}

function setMode(mode) {
  if (mode === "custom") return;
  for (const agent of AGENTS) {
    state.actions.set(agent.token, mode === "strict" ? agent.strictMode : agent.searchMode);
  }
}

function buildAgentControls() {
  els.agentList.textContent = "";
  for (const agent of AGENTS) {
    const label = document.createElement("label");
    label.className = "agent";
    label.innerHTML = `
      <input type="checkbox" data-token="${agent.token}">
      <span>
        <strong>${agent.token}</strong>
        <small>${agent.group} - ${agent.role}</small>
      </span>
    `;
    const checkbox = label.querySelector("input");
    checkbox.checked = state.actions.get(agent.token) === "block";
    checkbox.addEventListener("change", () => {
      state.actions.set(agent.token, checkbox.checked ? "block" : "allow");
      document.querySelector('input[name="mode"][value="custom"]').checked = true;
      render();
    });
    els.agentList.append(label);
  }
}

function selectedAgents() {
  const custom = els.customAgents.value
    .split(",")
    .map(normalizeToken)
    .filter(Boolean)
    .map((token) => ({ token, action: "block", custom: true }));

  const known = AGENTS.map((agent) => ({
    token: agent.token,
    action: state.actions.get(agent.token) || "allow",
    custom: false
  }));

  const seen = new Set();
  return [...known, ...custom].filter((item) => {
    const key = item.token.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupText(token, action, allowPaths, disallowPaths) {
  const lines = [`User-agent: ${token}`];
  if (action === "allow") {
    if (allowPaths.length) {
      for (const item of allowPaths) lines.push(`Allow: ${item}`);
    } else {
      lines.push("Allow: /");
    }
    if (disallowPaths.length) {
      for (const item of disallowPaths) lines.push(`Disallow: ${item}`);
    }
  } else {
    lines.push("Disallow: /");
  }
  return lines.join("\n");
}

function buildRobotsText() {
  const allowPaths = linesFrom(els.allowPaths.value);
  const disallowPaths = linesFrom(els.disallowPaths.value);
  const groups = selectedAgents().map((agent) => groupText(agent.token, agent.action, allowPaths, disallowPaths));
  const blocked = selectedAgents().filter((agent) => agent.action === "block").length;
  const allowed = selectedAgents().filter((agent) => agent.action === "allow").length;
  const header = [
    "# AI crawler robots.txt generator draft",
    "# Review with current crawler documentation and your server logs before publishing.",
    `# Generated: ${new Date().toISOString().slice(0, 10)}`,
    ""
  ].join("\n");
  return {
    text: `${header}${groups.join("\n\n")}\n`,
    blocked,
    allowed
  };
}

function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const parts = line.split(":");
    if (parts.length < 2) continue;
    const key = parts.shift().trim().toLowerCase();
    const value = parts.join(":").trim();
    if (key === "user-agent") {
      current = { token: value, directives: [] };
      groups.push(current);
    } else if (current) {
      current.directives.push({ key, value });
    }
  }
  return groups;
}

function auditRobots() {
  const text = els.auditInput.value.trim();
  els.auditResults.textContent = "";
  if (!text) {
    els.auditSummary.textContent = "Waiting";
    return;
  }

  const groups = parseRobots(text);
  const known = AGENTS.map((agent) => agent.token.toLowerCase());
  const found = new Set();
  let blockedCount = 0;

  for (const group of groups) {
    const key = group.token.toLowerCase();
    if (!known.includes(key)) continue;
    found.add(key);
    const blocked = group.directives.some((directive) => directive.key === "disallow" && directive.value === "/");
    const allowsRoot = group.directives.some((directive) => directive.key === "allow" && directive.value === "/");
    if (blocked) blockedCount += 1;
    addFinding(
      blocked ? "warn" : "good",
      group.token,
      blocked ? "Root disallow is present." : allowsRoot ? "Root allow is present." : "Found without a root-level decision."
    );
  }

  for (const agent of AGENTS) {
    if (!found.has(agent.token.toLowerCase())) {
      addFinding("miss", agent.token, `${agent.group} token not found in pasted robots.txt.`);
    }
  }

  const starGroup = groups.find((group) => group.token === "*");
  if (starGroup) {
    const starBlock = starGroup.directives.some((directive) => directive.key === "disallow" && directive.value === "/");
    addFinding(starBlock ? "warn" : "good", "Wildcard group", starBlock ? "All crawlers are blocked at root." : "Wildcard group is present.");
  }

  els.auditSummary.textContent = `${found.size}/${AGENTS.length} tokens found`;
}

function addFinding(kind, title, message) {
  const item = document.createElement("div");
  item.className = `finding ${kind}`;
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = message;
  item.append(strong, span);
  els.auditResults.append(item);
}

function render() {
  buildAgentControls();
  const { text, blocked, allowed } = buildRobotsText();
  els.output.textContent = text;
  els.agentCount.textContent = `${AGENTS.length} presets`;
  els.summary.textContent = `${blocked} blocked, ${allowed} allowed`;
  auditRobots();
}

async function copyOutput() {
  await navigator.clipboard.writeText(els.output.textContent);
  els.summary.textContent = "Copied";
  window.setTimeout(render, 900);
}

function downloadOutput() {
  const blob = new Blob([els.output.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "robots.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function loadSample() {
  els.auditInput.value = [
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: GPTBot",
    "Disallow: /",
    "",
    "User-agent: ClaudeBot",
    "Disallow: /",
    "",
    "User-agent: Google-Extended",
    "Disallow: /"
  ].join("\n");
  auditRobots();
}

for (const input of els.modeInputs) {
  input.addEventListener("change", () => {
    setMode(getMode());
    render();
  });
}

for (const input of [els.disallowPaths, els.allowPaths, els.customAgents]) {
  input.addEventListener("input", render);
}

els.auditInput.addEventListener("input", auditRobots);
els.copy.addEventListener("click", copyOutput);
els.download.addEventListener("click", downloadOutput);
els.sample.addEventListener("click", loadSample);

setMode("search");
render();
