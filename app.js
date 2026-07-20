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

  hasCredits() {
    return this.user && this.user.credits > 0;
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
  const limit = 2;

  if (!auth.token) {
    area.innerHTML = `<button id="btn-open-login">Entrar / Cadastrar</button>`;
    document.getElementById("btn-open-login").addEventListener("click", () => openModal("modal-auth"));
    document.getElementById("usage-info").textContent = "";
    return;
  }

  const credits = auth.user?.credits ?? 0;
  const creditsLabel = `${credits} crédito${credits === 1 ? "" : "s"}`;

  area.innerHTML = `
    <div class="user-bar">
      <span style="font-size:13px;color:rgba(24,32,27,0.62);">${escapeHtml(auth.user.email)}</span>
      <span class="plan-badge ${auth.hasCredits() ? "premium" : ""}">${creditsLabel.toUpperCase()}</span>
      <button class="btn-upgrade" id="btn-open-upgrade-top">Comprar créditos</button>
      <button class="btn-logout" id="btn-logout">Sair</button>
    </div>`;

  document.getElementById("btn-logout").addEventListener("click", () => {
    auth.clear();
    renderAuthArea();
    document.getElementById("paywall-banner").classList.remove("show");
  });

  document.getElementById("btn-open-upgrade-top")?.addEventListener("click", () => openModal("modal-upgrade"));

  if (used < limit) {
    document.getElementById("usage-info").textContent = `${used} de ${limit} análises gratuitas usadas · ${creditsLabel} disponíve${credits === 1 ? "l" : "is"}`;
  } else {
    document.getElementById("usage-info").textContent = auth.hasCredits()
      ? `Análises gratuitas esgotadas · ${creditsLabel} disponíve${credits === 1 ? "l" : "is"}`
      : `Análises gratuitas esgotadas · sem créditos`;
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
  renderMetrics();
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

// ─── Esqueceu a senha ─────────────────────────────────────────────────────────
function showForgotForm(show) {
  document.getElementById("auth-login-form").style.display = show ? "none" : "block";
  document.getElementById("auth-forgot-form").style.display = show ? "block" : "none";
  document.getElementById("auth-modal-title").textContent = show ? "Recuperar senha" : (authMode === "register" ? "Criar conta grátis" : "Entrar");
  showError("auth-error", "");
}

document.getElementById("auth-forgot").addEventListener("click", () => showForgotForm(true));
document.getElementById("forgot-back").addEventListener("click", () => showForgotForm(false));

document.getElementById("forgot-submit").addEventListener("click", async () => {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) { showError("auth-error", "Indica o teu e-mail."); return; }

  const btn = document.getElementById("forgot-submit");
  btn.classList.add("loading");
  showError("auth-error", "");

  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    showError("auth-error", data.message || "Link enviado.");
    document.getElementById("auth-error").style.color = "#4f6a56";
  } catch (_) {
    showError("auth-error", "Erro de conexão. Tenta de novo.");
  } finally {
    btn.classList.remove("loading");
  }
});

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
      auth.save(data.access_token, { email, credits: 0, analyses_used: 0 });
    } else {
      res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      data = await res.json();
      if (!res.ok) { showError("auth-error", data.detail || "E-mail ou senha incorretos."); return; }
      auth.save(data.access_token, { email, credits: 0, analyses_used: 0 });
    }

    closeModal("modal-auth");
    await fetchMe();
  } catch (_) {
    showError("auth-error", "Erro de conexão. Tente novamente.");
  } finally {
    btn.classList.remove("loading");
  }
});

// ─── Compra de créditos ───────────────────────────────────────────────────────
let selectedPack = 10;

document.querySelectorAll(".plan-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".plan-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPack = Number(card.dataset.credits);
  });
});

document.getElementById("modal-upgrade-close").addEventListener("click", () => closeModal("modal-upgrade"));
document.getElementById("btn-open-upgrade").addEventListener("click", () => openModal("modal-upgrade"));

document.getElementById("btn-checkout").addEventListener("click", async () => {
  if (!auth.token) { openModal("modal-auth"); return; }

  const btn = document.getElementById("btn-checkout");
  btn.disabled = true;
  btn.textContent = "Redirecionando...";

  try {
    const res = await fetch(`${API_URL}/billing/buy-credits`, {
      method: "POST",
      headers: auth.headers(),
      body: JSON.stringify({ credits: selectedPack }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Erro ao iniciar pagamento.");
      return;
    }
    window.location.href = data.checkout_url;
  } catch (err) {
    alert("Erro de conexão ao iniciar pagamento: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Comprar agora";
  }
});

// ─── Retorno de pagamento (via back_urls do MercadoPago) ──────────────────────
const paymentStatus = new URLSearchParams(window.location.search).get("payment");
if (paymentStatus) {
  history.replaceState({}, "", window.location.pathname);
  if (auth.token) {
    fetchMe().then(() => {
      if (paymentStatus === "success") {
        alert("Pagamento aprovado! Seus créditos foram adicionados.");
      } else if (paymentStatus === "pending") {
        alert("Pagamento pendente. Assim que for aprovado, seus créditos aparecerão automaticamente.");
      } else if (paymentStatus === "failure") {
        alert("Pagamento não concluído. Tente novamente quando quiser.");
      }
    });
  }
}

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
let lastApiData = null;

function saveHistory(report) {
  const history = JSON.parse(localStorage.getItem("elaratalent-history") || "[]");
  const next = [report, ...history].slice(0, 5);
  localStorage.setItem("elaratalent-history", JSON.stringify(next));
  renderHistory(next);
  renderMetrics();
}

function renderMetrics() {
  const history = JSON.parse(localStorage.getItem("elaratalent-history") || "[]");

  // Contador vem do servidor (analyses_used) para ser preciso em qualquer dispositivo
  const count = auth.user?.analyses_used ?? history.length;
  if (!count && !history.length) return;

  updateText("metric-count", count);
  updateText("metric-count-sub", count === 1 ? "análise realizada" : "análises realizadas");

  if (!history.length) return;

  const best = history.reduce((b, h) => h.match > b.match ? h : b, history[0]);
  const bestInterview = Math.max(...history.map((h) => h.interview));
  const newest = history[0];
  const oldest = history[history.length - 1];
  const atsEvolution = newest.match - oldest.match;

  updateText("metric-best-match", `${best.match}%`);
  updateText("metric-best-role", best.role);
  updateText("metric-interview", `${bestInterview}%`);
  updateText("metric-interview-sub", "melhor probabilidade");
  updateText("metric-ats", history.length > 1 ? (atsEvolution >= 0 ? `+${atsEvolution}` : `${atsEvolution}`) : `${newest.match}%`);
  updateText("metric-ats-sub", history.length > 1 ? "vs. primeira análise" : "match mais recente");
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

// ─── Busca de vagas compatíveis (Adzuna) ──────────────────────────────────────
let lastJobResults = [];

async function searchJobs() {
  if (!auth.token) {
    openModal("modal-auth");
    return;
  }

  const resume = document.getElementById("resume-input").value.trim();
  if (!resume) {
    alert("Cole o texto do currículo antes de buscar vagas.");
    return;
  }

  const btn = document.getElementById("search-jobs-button");
  btn.textContent = "Buscando...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/search-jobs`, {
      method: "POST",
      headers: auth.headers(),
      body: JSON.stringify({ resume_text: resume }),
    });

    if (res.status === 401) {
      auth.clear();
      renderAuthArea();
      openModal("modal-auth");
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || `Erro ao buscar vagas (status ${res.status}).`);
      return;
    }

    const data = await res.json();
    renderJobResults(data.jobs);
  } catch (err) {
    alert("Erro de conexão ao buscar vagas: " + err.message);
  } finally {
    btn.textContent = "Buscar vagas compatíveis";
    btn.disabled = false;
  }
}

function renderJobResults(jobs = []) {
  lastJobResults = jobs;
  const panel = document.getElementById("job-results-panel");
  const list = document.getElementById("job-results-list");

  if (!jobs.length) {
    list.innerHTML = `<p>Nenhuma vaga encontrada agora. Tente novamente mais tarde ou ajuste o currículo.</p>`;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth" });
    return;
  }

  list.innerHTML = jobs.map((job, i) => `
    <article>
      <strong>${escapeHtml(job.title)}</strong>
      <span class="job-meta">${escapeHtml(job.company || "Empresa não informada")} · ${escapeHtml(job.location || "Local não informado")}</span>
      <span class="job-score">Match estimado ${job.match_score}%</span>
      <p>${escapeHtml(job.description_snippet)}</p>
      <div class="job-actions">
        <button class="secondary" data-job-index="${i}" data-action="view">Ver vaga</button>
        <button data-job-index="${i}" data-action="analyze">Analisar em detalhe</button>
      </div>
    </article>`).join("");

  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth" });
}

document.getElementById("job-results-list")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const job = lastJobResults[Number(btn.dataset.jobIndex)];
  if (!job) return;

  if (btn.dataset.action === "view") {
    window.open(job.url, "_blank", "noopener");
  } else if (btn.dataset.action === "analyze") {
    // "Vaga para X" no início ajuda o inferRole() a extrair o cargo real,
    // em vez de cair no fallback "Vaga analisada" (a Adzuna não escreve nesse formato).
    document.getElementById("job-input").value = `Vaga para ${job.title}\n\n${job.description_snippet}`;
    document.getElementById("job-input").scrollIntoView({ behavior: "smooth" });
    document.getElementById("analyze-button").click();
  }
});

document.getElementById("search-jobs-button")?.addEventListener("click", searchJobs);

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

  try {
    // Tenta chamar a API
    const res = await fetch(`${API_URL}/match`, {
      method: "POST",
      headers: auth.headers(),
      body: JSON.stringify({
        profile: {
          name: "Candidato",
          seniority: "Sênior",
          years_experience: 10,
          education: [],
          certifications: extractTerms(resume, keywords.certifications),
          languages: extractTerms(resume, keywords.languages),
          hard_skills: extractTerms(resume, keywords.skills),
          soft_skills: [],
          achievements: [],
          resume_text: resume,
        },
        job: {
          title: inferRole(job),
          description: job,
          required_skills: extractTerms(job, keywords.skills),
          required_certifications: extractTerms(job, keywords.certifications),
          languages: extractTerms(job, keywords.languages),
        },
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

    const errorBody = await res.json().catch(() => ({}));
    console.error(`/match falhou com status ${res.status}:`, errorBody);
    alert(`Erro ao analisar (status ${res.status}): ${JSON.stringify(errorBody.detail || errorBody)}`);
    return;
  } catch (err) {
    console.error("Erro de conexão ao chamar /match:", err);
    alert(`Erro de conexão com a API: ${err.message}`);
  }

  // Fallback: scoring local
  runLocalScoring(resume, job);
}

function extractTerms(text, termList) {
  return termList.filter((t) => hasTerm(text, t));
}

function renderFromApi(data, resume, job) {
  lastApiData = data;
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
  const strengthsList = document.getElementById("strengths-list");
  if (strengthsList && data.strengths?.length) {
    strengthsList.innerHTML = data.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  }

  const weaknessesList = document.getElementById("weaknesses-list");
  if (weaknessesList && data.weaknesses?.length) {
    weaknessesList.innerHTML = data.weaknesses.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
  }

  const gapsList = document.getElementById("critical-gaps-list");
  if (gapsList) {
    gapsList.innerHTML = critical_gaps.length
      ? critical_gaps.map((g) => `<li>${escapeHtml(g)}</li>`).join("")
      : "<li>Poucos gaps críticos detectados. Reforce métricas e resultados.</li>";
  }

  const catMap = { "Experiência": "experience", "Formação": "education", "Skills técnicas": "skills", "Idiomas": "languages", "Certificações": "certifications" };
  category_scores.forEach(({ category, score }) => {
    if (catMap[category]) setBar(catMap[category], score);
  });

  const list = document.getElementById("interview-list");
  list.innerHTML = interview_questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("");

  document.getElementById("objections-list").innerHTML = (objections || []).map((o) => `
    <article>
      <strong>${escapeHtml(o.objection)}</strong>
      <span>${escapeHtml(o.risk_level)}</span>
      <p>${escapeHtml(o.best_response)}</p>
    </article>`).join("");

  if (optimized_summary) updateText("pitch-text", optimized_summary);

  const atsPlan = document.getElementById("ats-plan");
  if (atsPlan && data.ats_tips?.length) {
    atsPlan.innerHTML = data.ats_tips.map((t) => `<span>${escapeHtml(t)}</span>`).join("");
  }

  updateRing(match_score);
  finishAnalysis(match_score, probabilities.screening, probabilities.interview, probabilities.offer, critical_gaps, interview_questions, data.job_title || inferRole(job));
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
  const gapsListLocal = document.getElementById("critical-gaps-list");
  if (gapsListLocal) {
    gapsListLocal.innerHTML = gaps.length
      ? gaps.map((g) => `<li>${escapeHtml(g)}</li>`).join("")
      : "<li>Reforce métricas e resultados.</li>";
  }

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
  document.querySelectorAll(".example-badge").forEach((el) => el.remove());
}

// ─── Gerar materiais ──────────────────────────────────────────────────────────
function generateMaterials() {
  if (!auth.token) { openModal("modal-auth"); return; }

  const job = document.getElementById("job-input").value;
  const role = escapeHtml(lastApiData?.job_title || inferRole(job));
  const materials = document.getElementById("materials");

  const pitch = lastApiData?.optimized_summary || "";
  const strengths = lastApiData?.strengths || [];
  const s1 = strengths[0] ? escapeHtml(strengths[0]) : "";
  const s2 = strengths[1] ? escapeHtml(strengths[1]) : "";
  const topStrengths = [s1, s2].filter(Boolean).join(" e ");

  const coverLetter = pitch
    ? escapeHtml(pitch)
    : `Tenho interesse em ${role} e acredito que minha trajetória está alinhada com os desafios descritos na vaga.`;

  const linkedInMsg = s1
    ? `Vi a vaga de ${role} e acredito ter forte aderência. Meu principal diferencial: ${s1}. Podemos conversar?`
    : `Vi a vaga de ${role} e acredito ter forte aderência ao escopo. Posso compartilhar um resumo objetivo?`;

  const emailMsg = pitch
    ? escapeHtml(pitch)
    : `Tenho interesse na posição de ${role} e destaco${topStrengths ? `: ${topStrengths}` : " minha experiência na área"}.`;

  const atsTips = lastApiData?.ats_tips || [];
  const gaps = lastApiData?.critical_gaps || [];
  const cvAts = atsTips.length
    ? `<ul>${atsTips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
    : gaps.length
    ? `<ul>${gaps.slice(0, 3).map((g) => `<li>Acrescentar evidências de: ${escapeHtml(g)}</li>`).join("")}</ul>`
    : `<p>Corre a análise para gerar o plano personalizado.</p>`;

  const networking = `<ol>
    <li>Pesquisa pessoas que trabalham ou trabalharam em ${role} no LinkedIn.</li>
    <li>Envia pedido de ligação com nota: <em>"Vi a vaga de ${role} e a vossa área é muito alinhada com o meu percurso — posso partilhar um resumo?"</em></li>
    <li>Se aceite, envia mensagem curta com o teu diferencial principal${s1 ? `: ${s1}` : ""}.</li>
    <li>Pede 15 minutos de conversa informal antes de aplicares formalmente.</li>
    <li>Após a conversa, aplica referenciando o nome do contacto na candidatura.</li>
  </ol>`;

  materials.hidden = false;
  materials.innerHTML = `
    <article>
      <strong>Carta de apresentação</strong>
      <p>${coverLetter}</p>
    </article>
    <article>
      <strong>Currículo adaptado para ATS</strong>
      ${cvAts}
    </article>
    <article>
      <strong>Mensagem para LinkedIn</strong>
      <p>${linkedInMsg}</p>
    </article>
    <article>
      <strong>E-mail ao recrutador</strong>
      <p>Assunto: Candidatura para ${role}.</p>
      <p>${emailMsg}</p>
    </article>
    <article>
      <strong>Roteiro de networking</strong>
      ${networking}
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
document.getElementById("paste-job-button").addEventListener("click", () => {
  const jobInput = document.getElementById("job-input");
  jobInput.scrollIntoView({ behavior: "smooth" });
  jobInput.focus();
});

document.getElementById("fetch-job-button")?.addEventListener("click", async () => {
  const url = document.getElementById("job-url-input").value.trim();
  if (!url) return;

  const btn = document.getElementById("fetch-job-button");
  btn.textContent = "Buscando...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/fetch-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById("job-input").value = data.text;
      document.getElementById("job-input").scrollIntoView({ behavior: "smooth" });
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || "Não foi possível extrair o texto da vaga. Cola manualmente.");
    }
  } catch (err) {
    alert("Erro ao buscar a vaga: " + err.message);
  } finally {
    btn.textContent = "Buscar";
    btn.disabled = false;
  }
});

// ─── Deteção de dados pessoais sensíveis no currículo ────────────────────────
function isValidCPF(digits) {
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i], 10) * (len + 1 - i);
    const rev = (sum * 10) % 11;
    return rev === 10 ? 0 : rev;
  };
  return calc(9) === parseInt(digits[9], 10) && calc(10) === parseInt(digits[10], 10);
}

const PII_PATTERNS = [
  { label: "CPF", regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, validate: (m) => isValidCPF(m.replace(/\D/g, "")) },
  { label: "telefone", regex: /\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/g },
  { label: "e-mail", regex: /[\w.+-]+@[\w-]+\.[a-zA-Z.]{2,}/g },
  { label: "CEP", regex: /\b\d{5}-?\d{3}\b/g },
  { label: "data de nascimento", regex: /(data de nascimento|nascido[a]? em|nasc\.?)\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi },
  { label: "RG", regex: /\bRG\s*:?\s*[\d.\-xX]{5,}/gi },
  { label: "CNH", regex: /\bCNH\s*:?\s*\d{6,}/gi },
  { label: "passaporte", regex: /\bpassaporte\s*:?\s*[A-Za-z0-9]{6,}/gi },
  { label: "dados bancários", regex: /\b(ag[êe]ncia|conta corrente|conta banc[áa]ria|chave pix)\s*:?\s*[\w.\-]{3,}/gi },
];

function detectSensitiveInfo(text) {
  const found = [];
  for (const { label, regex, validate } of PII_PATTERNS) {
    const matches = text.match(regex) || [];
    const valid = validate ? matches.filter(validate) : matches;
    if (valid.length) found.push(label);
  }
  return found;
}

function redactSensitiveInfo(text) {
  let result = text;
  for (const { regex, validate } of PII_PATTERNS) {
    result = result.replace(regex, (m) => (!validate || validate(m) ? "[removido]" : m));
  }
  return result;
}

function checkPiiBanner() {
  const text = document.getElementById("resume-input").value;
  const banner = document.getElementById("pii-banner");
  if (!banner) return;
  banner.hidden = detectSensitiveInfo(text).length === 0;
}

document.getElementById("pii-remove-button")?.addEventListener("click", () => {
  const input = document.getElementById("resume-input");
  input.value = redactSensitiveInfo(input.value);
  document.getElementById("pii-banner").hidden = true;
});

document.getElementById("pii-keep-button")?.addEventListener("click", () => {
  document.getElementById("pii-banner").hidden = true;
});

document.getElementById("resume-input")?.addEventListener("blur", checkPiiBanner);

document.getElementById("resume-file")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const label = e.target.closest("label");
  const strongEl = label?.querySelector("strong");
  const smallEl = label?.querySelector("small");
  const origStrong = strongEl?.textContent;
  const origSmall = smallEl?.textContent;

  if (strongEl) strongEl.textContent = "Carregando...";
  if (smallEl) smallEl.textContent = file.name;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/parse-resume`, {
      method: "POST",
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const resumeInput = document.getElementById("resume-input");
      resumeInput.value = data.text;
      resumeInput.scrollIntoView({ behavior: "smooth" });
      checkPiiBanner();
      if (strongEl) strongEl.textContent = "Currículo carregado ✓";
      if (smallEl) smallEl.textContent = file.name;
    } else {
      const rawText = await res.text().catch(() => "");
      let detail = "";
      try { detail = JSON.parse(rawText).detail; } catch {}
      const msg = detail || (res.status === 404 ? "Endpoint não encontrado — aguarda o redeploy do servidor (~2 min) e tenta de novo." : `Erro ${res.status}: ${rawText.slice(0, 120)}`);
      alert(msg);
      if (strongEl) strongEl.textContent = origStrong;
      if (smallEl) smallEl.textContent = origSmall;
    }
  } catch (err) {
    alert("Erro ao carregar ficheiro: " + err.message);
    if (strongEl) strongEl.textContent = origStrong;
    if (smallEl) smallEl.textContent = origSmall;
  } finally {
    e.target.value = "";
  }
});

// Fecha modais clicando fora
["modal-auth", "modal-upgrade", "modal-reset"].forEach((id) => {
  document.getElementById(id).addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal(id);
  });
});

// ─── Reset de senha (via link no e-mail) ─────────────────────────────────────
const resetToken = new URLSearchParams(window.location.search).get("reset");
if (resetToken) {
  openModal("modal-reset");
  history.replaceState({}, "", window.location.pathname);
}

document.getElementById("reset-submit").addEventListener("click", async () => {
  const pwd = document.getElementById("reset-password").value;
  const confirm = document.getElementById("reset-password-confirm").value;
  if (!pwd || pwd.length < 6) { showError("reset-error", "A senha deve ter pelo menos 6 caracteres."); return; }
  if (pwd !== confirm) { showError("reset-error", "As senhas não coincidem."); return; }

  const btn = document.getElementById("reset-submit");
  btn.classList.add("loading");
  showError("reset-error", "");

  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, new_password: pwd }),
    });
    const data = await res.json();
    if (res.ok) {
      closeModal("modal-reset");
      alert(data.message);
      openModal("modal-auth");
    } else {
      showError("reset-error", data.detail || "Erro ao redefinir.");
    }
  } catch (_) {
    showError("reset-error", "Erro de conexão. Tenta de novo.");
  } finally {
    btn.classList.remove("loading");
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHistory();
renderMetrics();
renderAuthArea();
if (auth.token) fetchMe();
