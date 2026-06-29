// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = window.ENV_API_URL || "https://web-production-acc31.up.railway.app";

// ─── Estado de autenticação ───────────────────────────────────────────────────
const auth = {
  token: localStorage.getItem("ca_token"),
  user: JSON.parse(localStorage.getItem("ca_user") || "null"),

  save(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem("ca_token", token);
    localStorage.setItem("ca_user", JSON.stringify(user));
  },

  clear() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("ca_token");
    localStorage.removeItem("ca_user");
  },

  isPremium() {
    return this.user && this.user.plan !== "free";
  },

  headers() {
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  },
};

// ─── Helpers de UI ────────────────────────────────────────────────────────────
function updateText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[c]);
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ─── Barra de usuário (topbar) ────────────────────────────────────────────────
function renderAuthArea() {
  const area = document.getElementById("auth-area");
  const used = auth.user?.analyses_used ?? 0;
  const limit = 3;

  if (!auth.token) {
    const btn = document.getElementById("btn-open-login");
    if (btn) {
      btn.addEventListener("click", () => openModal("modal-auth"));
    }
    document.getElementById("usage-info").textContent = "";
    return;
  }

  const planLabel = auth.isPremium() ? auth.user.plan : "free";
  const premiumClass = auth.isPremium() ? "premium" : "";

  area.innerHTML = `
    <div class="user-bar">
      <span style="font-size:13px;color:rgba(24,32,27,0.62);">${escapeHtml(auth.user.email)}</span>
      <span class="plan-badge ${premiumClass}">${planLabel.toUpperCase()}</span>
      ${!auth.isPremium() ? `<button class="btn-upgrade" id="btn-open-upgrade-top">Upgrade</button>` : ""}
      <button class="btn-logout" id="btn-logout">Sair</button>
    </div>`;

  document.getElementById("btn-logout").addEventListener("click", () => {
    auth.clear();
    renderAuthArea();
    document.getElementById("paywall-banner").classList.remove("show");
  });

  if (!auth.isPremium()) {
    document.getElementById("btn-open-upgrade-top")?.addEventListener("click", () => openModal("modal-upgrade"));
    document.getElementById("usage-info").textContent = `${used} de ${limit} análises gratuitas usadas`;
  } else {
    document.getElementById("usage-info").textContent = "Plano Pro — análises ilimitadas";
  }
}

// ─── Fetch do perfil do usuário ───────────────────────────────────────────────
async function fetchMe() {
  if (!auth.token) return;
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: auth.headers() });
    if (res.ok) {
      const user = await res.json();
      auth.user = user;
      localStorage.setItem("ca_user", JSON.stringify(user));
    } else {
      auth.clear();
    }
  } catch (_) {
    // sem conexão — mantém estado local
  }
  renderAuthArea();
}

// ─── Auth modal ───────────────────────────────────────────────────────────────
let authMode = "login"; // "login" | "register"

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  updateText("auth-modal-title", isRegister ? "Criar conta grátis" : "Entrar");
  updateText("auth-submit", isRegister ? "Cadastrar" : "Entrar");
  document.getElementById("auth-form-name").style.display = isRegister ? "block" : "none";
  document.getElementById("auth-switch").innerHTML = isRegister
    ? `Já tem conta? <a id="auth-toggle">Entrar</a>`
    : `Não tem conta? <a id="auth-toggle">Cadastre-se grátis</a>`;
  document.getElementById("auth-toggle").addEventListener("click", () =>
    setAuthMode(isRegister ? "login" : "register")
  );
  showError("auth-error", "");
}

document.getElementById("modal-auth-close").addEventListener("click", () => closeModal("modal-auth"));
document.getElementById("auth-toggle").addEventListener("click", () =>
  setAuthMode(authMode === "login" ? "register" : "login")
);

document.getElementById("auth-submit").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const fullName = document.getElementById("auth-name").value.trim();

  if (!email || !password) { showError("auth-error", "Preencha e-mail e senha."); return; }

  const btn = document.getElementById("auth-submit");
  btn.classList.add("loading");
  showError("auth-error", "");

  try {
    let res, data;

    if (authMode === "register") {
      res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName || null }),
      });
      data = await res.json();
      if (!res.ok) { showError("auth-error", data.detail || "Erro ao cadastrar."); return; }
      auth.save(data.access_token, { email, plan: "free", analyses_used: 0 });
    } else {
      res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      data = await res.json();
      if (!res.ok) { showError("auth-error", data.detail || "E-mail ou senha incorretos."); return; }
      auth.save(data.access_token, { email, plan: "free", analyses_used: 0 });
    }

    closeModal("modal-auth");
    await fetchMe();
  } catch (_) {
    showError("auth-error", "Erro de conexão. Tente novamente.");
  } finally {
    btn.classList.remove("loading");
  }
});

// ─── Upgrade modal ────────────────────────────────────────────────────────────
let selectedPlan = "trimestral";

document.querySelectorAll(".plan-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".plan-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPlan = card.dataset.plan;
  });
});

document.getElementById("modal-upgrade-close").addEventListener("click", () => closeModal("modal-upgrade"));
document.getElementById("btn-open-upgrade").addEventListener("click", () => openModal("modal-upgrade"));

document.getElementById("btn-checkout").addEventListener("click", () => {
  // Abre MercadoPago externamente (evita taxa da Play Store)
  // Em produção, gere um link de checkout via sua API e redirecione
  const mpLinks = {
  mensal:      "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=4489b4dc33ca444eabda7fb422fafca0",
  trimestral:  "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=24210aa3f0014edc99c540ab2d260cb3",
  anual:       "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=ec6038c9da4b4ff3983213a58526b6e6",
};
  window.open(mpLinks[selectedPlan], "_blank");
});

// ─── Scoring local (mantido como fallback offline) ────────────────────────────
const keywords = {
  experience: ["anos", "lideranca", "liderança", "gestao", "gestão", "operacao", "operação", "operacoes", "operações", "time", "equipe", "fornecedor"],
  education: ["mba", "graduacao", "graduação", "engenharia", "administracao", "administração", "pos", "pós", "formacao", "formação"],
  skills: ["sap", "analytics", "sql", "python", "produto", "processos", "indicadores", "negociacao", "negociação"],
  languages: ["ingles", "inglês", "english", "espanhol", "fluente", "avancado", "avançado"],
  certifications: ["pmp", "scrum", "agile", "itil", "certificacao", "certificação", "certificado"],
};

function normalize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasTerm(text, term) {
  return normalize(text).includes(normalize(term));
}

function categoryScore(resume, job, category) {
  const requested = keywords[category].filter((term) => hasTerm(job, term));
  const baseline = category === "certifications" ? 60 : 72;
  if (requested.length === 0) return baseline;
  const matched = requested.filter((term) => hasTerm(resume, term)).length;
  return Math.max(35, Math.round((matched / requested.length) * 100));
}

function setBar(category, score) {
  const el = document.querySelector(`[data-category="${category}"]`);
  if (!el) return;
  el.style.setProperty("--v", `${score}%`);
  const value = el.querySelector("i");
  if (value) value.textContent = `${score}%`;
}

function findGaps(resume, job) {
  const requested = Object.values(keywords).flat().filter((t) => hasTerm(job, t));
  return [...new Set(requested.filter((t) => !hasTerm(resume, t)))].slice(0, 7);
}

function inferRole(job) {
  const m = job.match(/(?:vaga para|cargo de|posição de)\s+([^,.]+)/i);
  return m ? m[1].trim() : "Vaga analisada";
}

function riskLevel(score) {
  if (score < 55) return "Risco alto";
  if (score < 78) return "Risco médio";
  return "Risco baixo";
}

function updateObjections(gaps, scores) {
  const list = document.getElementById("objections-list");
  const coreGaps = gaps.length ? gaps.slice(0, 3) : ["clareza de resultados", "escopo de liderança"];
  list.innerHTML = coreGaps.map((gap) => `
    <article>
      <strong>${escapeHtml(`O currículo não comprova ${gap}.`)}</strong>
      <span>${riskLevel(Math.min(scores.skills, scores.certifications, scores.experience))}</span>
      <p>${escapeHtml(`Prepare um exemplo STAR mostrando contexto, ação, métrica e aprendizado ligado a ${gap}.`)}</p>
    </article>`).join("");
}

function updateAtsPlan(gaps, scores) {
  const plan = document.getElementById("ats-plan");
  const actions = [
    scores.skills < 80 ? "Repetir as skills críticas da vaga no resumo e em cada experiência relevante." : "Manter as skills técnicas visíveis no primeiro terço do currículo.",
    scores.certifications < 80 ? "Adicionar certificações, cursos equivalentes ou trilha de obtenção com data prevista." : "Destacar certificações na seção superior e no LinkedIn.",
    gaps.length ? `Criar bullets com evidências para: ${gaps.slice(0, 4).join(", ")}.` : "Trocar descrições genéricas por resultados com número, escopo e prazo.",
    "Gerar uma versão ATS sem colunas, gráficos ou elementos que dificultem leitura automática.",
  ];
  plan.innerHTML = actions.map((a) => `<span>${escapeHtml(a)}</span>`).join("");
}

// ─── Histórico ────────────────────────────────────────────────────────────────
let currentReport = null;

function saveHistory(report) {
  const history = JSON.parse(localStorage.getItem("elaratalent-history") || "[]");
  const next = [report, ...history].slice(0, 5);
  localStorage.setItem("elaratalent-history", JSON.stringify(next));
  renderHistory(next);
}

function renderHistory(history = JSON.parse(localStorage.getItem("elaratalent-history") || "[]")) {
  const list = document.getElementById("history-list");
  const entries = history.length
    ? history
    : [{ role: "Head de Operações", match: 82, interview: 78, date: "Exemplo" }];
  list.innerHTML = entries.map((item) => `
    <article>
      <strong>${escapeHtml(item.role)}</strong>
      <span>Match ${item.match}% · entrevista ${item.interview}% · ${escapeHtml(item.date)}</span>
    </article>`).join("");
}

// ─── Análise principal ────────────────────────────────────────────────────────
async function analyze() {
  // Exige login
  if (!auth.token) {
    openModal("modal-auth");
    return;
  }

  const resume = document.getElementById("resume-input").value;
  const job = document.getElementById("job-input").value;

  const btn = document.getElementById("analyze-button");
  btn.classList.add("loading");
  btn.textContent = "Analisando...";
// Extrai anos de experiência do texto
    const yearsMatch = resume.match(/(\d+)\s*anos?\s*de\s*experi[eê]ncia/i);
    const yearsExp = yearsMatch ? parseInt(yearsMatch[1]) : 5;

    // Detecta senioridade
    const senioridade = /s[eê]nior|coordenador|gerente|diretor|head/i.test(resume)
      ? "Sênior" : /pl[eê]no|analista/i.test(resume) ? "Pleno" : "Júnior";

    // Chama a API
    const res = await fetch(`${API_URL}/match`, {
      method: "POST",
      headers: auth.headers(),
      body: JSON.stringify({
        profile: {
          name: "Candidato",
          seniority: senioridade,
          years_experience: yearsExp,
          education: extractTerms(resume, keywords.education),
          certifications: extractTerms(resume, keywords.certifications),
          languages: extractTerms(resume, keywords.languages),
          hard_skills: extractTerms(resume, keywords.skills),
          soft_skills: [],
          achievements: [],
        },
        job: {
  title: inferRole(job),
  description: `CURRÍCULO:\n${resume}\n\nVAGA:\n${job}`,
  required_skills: extractTerms(job, keywords.skills),
  required_certifications: extractTerms(job, keywords.certifications),
  languages: extractTerms(job, keywords.languages),
},
      }),
    });
      }),
    });

    // Limite free atingido
    if (res.status === 402) {
      document.getElementById("paywall-banner").classList.add("show");
      openModal("modal-upgrade");
      return;
    }

    // Token expirado
    if (res.status === 401) {
      auth.clear();
      renderAuthArea();
      openModal("modal-auth");
      return;
    }

    if (res.ok) {
      const data = await res.json();
      renderFromApi(data, resume, job);
      await fetchMe(); // atualiza contador
      return;
    }
  } catch (_) {
    // sem conexão — roda scoring local como fallback
  }

  // Fallback: scoring local
  runLocalScoring(resume, job);
}

function extractTerms(text, termList) {
  return termList.filter((t) => hasTerm(text, t));
}

function renderFromApi(data, resume, job) {
  const { match_score, category_scores, probabilities, critical_gaps, objections, interview_questions, optimized_summary } = data;

  updateText("match-score", `${match_score}%`);
  updateText("match-caption",
    match_score >= 84 ? "Aderência alta, com ajustes finos para entrevista."
    : match_score >= 70 ? "Boa aderência, mas há gaps que precisam de resposta."
    : "Aderência moderada, revise requisitos críticos antes de aplicar."
  );
  updateText("screening-score", `${probabilities.screening}%`);
  updateText("interview-score", `${probabilities.interview}%`);
  updateText("offer-score", `${probabilities.offer}%`);
  updateText("screening-reason", probabilities.explanations[0] || "");
  updateText("interview-reason", probabilities.explanations[1] || "");
  updateText("offer-reason", probabilities.explanations[2] || "");
  updateText("critical-gaps", critical_gaps.length
    ? `Para chegar mais perto de 100%, evidencie: ${critical_gaps.join(", ")}.`
    : "Poucos gaps críticos detectados. Reforce métricas e resultados.");

  const catMap = { "Experiência": "experience", "Formação": "education", "Skills técnicas": "skills", "Idiomas": "languages", "Certificações": "certifications" };
  category_scores.forEach(({ category, score }) => {
    if (catMap[category]) setBar(catMap[category], score);
  });
// Atualiza pontos fortes
    const strengthsList = document.querySelector("#diagnostico .panel:nth-child(1) ul");
    if (strengthsList && data.strengths?.length) {
      strengthsList.innerHTML = data.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("");
    }

    // Atualiza pontos fracos
    const weaknessesList = document.querySelector("#diagnostico .panel:nth-child(2) ul");
    if (weaknessesList && data.weaknesses?.length) {
      weaknessesList.innerHTML = data.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join("");
    }
  const list = document.getElementById("interview-list");
  list.innerHTML = interview_questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("");

  document.getElementById("objections-list").innerHTML = (objections || []).map((o) => `
    <article>
      <strong>${escapeHtml(o.objection)}</strong>
      <span>${escapeHtml(o.risk_level)}</span>
      <p>${escapeHtml(o.best_response)}</p>
    </article>`).join("");

  updateRing(match_score);
  finishAnalysis(match_score, probabilities.screening, probabilities.interview, probabilities.offer, critical_gaps, interview_questions, inferRole(job));
}

function runLocalScoring(resume, job) {
  const scores = Object.keys(keywords).reduce((acc, cat) => {
    acc[cat] = categoryScore(resume, job, cat);
    setBar(cat, acc[cat]);
    return acc;
  }, {});

  const match = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / Object.keys(scores).length);
  const screening = Math.min(96, match + 6);
  const interview = Math.max(24, match - 4);
  const offer = Math.max(12, Math.round(match * 0.64));
  const gaps = findGaps(resume, job);
  const role = inferRole(job);

  updateText("match-score", `${match}%`);
  updateText("match-caption", match >= 84 ? "Aderência alta." : match >= 70 ? "Boa aderência, mas há gaps." : "Aderência moderada.");
  updateText("screening-score", `${screening}%`);
  updateText("interview-score", `${interview}%`);
  updateText("offer-score", `${offer}%`);
  updateText("screening-reason", "Triagem pondera ATS, senioridade e palavras-chave da vaga.");
  updateText("interview-reason", "Entrevista depende de exemplos STAR.");
  updateText("offer-reason", "Oferta considera competição, salário e fit cultural.");
  updateText("critical-gaps", gaps.length ? `Evidencie: ${gaps.join(", ")}.` : "Reforce métricas e resultados.");

  const questions = [
    `Conte uma situação em que você demonstrou ${gaps[0] || "o requisito mais estratégico"}.`,
    "Qual resultado mensurável prova sua aderência para esta vaga?",
    "Que gap você resolveria nos primeiros 30 dias?",
    "Por que sua trajetória faz sentido para este momento da empresa?",
  ];
  document.getElementById("interview-list").innerHTML = questions.map((q) => `<li>${q}</li>`).join("");

  updateObjections(gaps, scores);
  updateAtsPlan(gaps, scores);
  updateRing(match);
  finishAnalysis(match, screening, interview, offer, gaps, questions, role);
}

function updateRing(match) {
  const first = Math.min(match, Math.round(match * 0.34));
  const second = Math.min(match, Math.round(match * 0.70));
  document.querySelector(".ring").style.background = `
    radial-gradient(circle at center, var(--chalk) 0 57%, transparent 58%),
    conic-gradient(var(--blue) 0 ${first}%, var(--moss) ${first}% ${second}%, var(--mint) ${second}% ${match}%, var(--line) ${match}% 100%)`;
}

function finishAnalysis(match, screening, interview, offer, gaps, questions, role) {
  currentReport = { role, match, screening, interview, offer, gaps, questions, date: new Date().toLocaleDateString("pt-BR") };
  saveHistory(currentReport);
}

// ─── Gerar materiais ──────────────────────────────────────────────────────────
function generateMaterials() {
  if (!auth.token) { openModal("modal-auth"); return; }

  const job = document.getElementById("job-input").value;
  const m = job.match(/(?:vaga para|cargo de|posição de)\s+([^,.]+)/i);
  const role = escapeHtml(m ? m[1].trim() : "esta oportunidade");
  const materials = document.getElementById("materials");

  materials.hidden = false;
  materials.innerHTML = `
    <article>
      <strong>Carta de apresentação</strong>
      <p>Olá, tenho interesse em ${role}. Minha experiência em operações, liderança e melhoria de processos conversa diretamente com os desafios descritos.</p>
    </article>
    <article>
      <strong>Mensagem para LinkedIn</strong>
      <p>Olá! Vi a vaga de ${role} e acredito ter forte aderência ao escopo. Posso compartilhar um resumo objetivo da minha experiência?</p>
    </article>
    <article>
      <strong>E-mail ao recrutador</strong>
      <p>Assunto: Candidatura para ${role}. Envio meu interesse na posição e destaco minha experiência com liderança, processos e indicadores.</p>
    </article>`;
}

// ─── Exportar relatório ───────────────────────────────────────────────────────
function exportReport() {
  if (!currentReport) analyze();
  if (!currentReport) return;

  const r = currentReport;
  const content = [
    "Elara Talent - Relatório de candidatura", "",
    `Vaga: ${r.role}`,
    `Match geral: ${r.match}%`,
    `Probabilidade de triagem: ${r.screening}%`,
    `Probabilidade de entrevista: ${r.interview}%`,
    `Probabilidade de proposta: ${r.offer}%`, "",
    "Gaps críticos:",
    ...(r.gaps?.length ? r.gaps.map((g) => `- ${g}`) : ["- Reforçar métricas e resultados."]), "",
    "Perguntas de entrevista:",
    ...(r.questions || []).map((q) => `- ${q}`),
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "elaratalent-relatorio.txt";
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.getElementById("analyze-button").addEventListener("click", async () => {
  const btn = document.getElementById("analyze-button");
  await analyze();
  btn.classList.remove("loading");
  btn.textContent = "Analisar match";
});

document.getElementById("export-report-button").addEventListener("click", exportReport);
document.getElementById("generate-kit-button").addEventListener("click", generateMaterials);
document.getElementById("top-copilot-button")?.addEventListener("click", () =>
  document.getElementById("copilot").scrollIntoView({ behavior: "smooth" })
);
document.getElementById("paste-job-button").addEventListener("click", () =>
  document.getElementById("job-input").focus()
);

// Fecha modais clicando fora
["modal-auth", "modal-upgrade"].forEach((id) => {
  document.getElementById(id).addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal(id);
  });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHistory();
renderAuthArea();
if (auth.token) fetchMe();
