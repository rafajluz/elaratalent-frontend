function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[c]);
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const STATUS_LABELS = {
  coberto: { label: "Costuma ser coberto", cls: "status-coberto" },
  coberto_condicional: { label: "Coberto com condições (DUT)", cls: "status-condicional" },
  nao_coberto: { label: "Costuma não ser coberto", cls: "status-nao-coberto" },
  controverso: { label: "Depende / controverso", cls: "status-controverso" },
};

const DATA = window.ROL_ANS_DATA || [];
const EXAMPLES_COUNT = 6;

function matches(item, query) {
  const q = normalize(query);
  if (normalize(item.nome).includes(q)) return true;
  return (item.aliases || []).some((alias) => normalize(alias).includes(q));
}

function renderResults(items, { isSearch }) {
  const container = document.getElementById("rol-results");
  const hint = document.getElementById("rol-hint");

  if (isSearch && items.length === 0) {
    hint.textContent = "Nenhum item encontrado nesta amostra — isso não significa que o tratamento não seja coberto.";
    container.innerHTML = `
      <div class="rol-empty">
        <p>Não encontramos esse termo na nossa amostra curada (que cobre só alguns casos comuns).</p>
        <p>Confirme na <a href="https://www.ans.gov.br/ROL-web/" target="_blank" rel="noopener">ferramenta oficial da ANS</a> ou fale com sua operadora.</p>
      </div>`;
    return;
  }

  hint.textContent = isSearch
    ? `${items.length} resultado${items.length === 1 ? "" : "s"} nesta amostra:`
    : "Digite ao menos 2 letras para buscar. Mostrando alguns exemplos:";

  container.innerHTML = items
    .map((item) => {
      const status = STATUS_LABELS[item.status] || STATUS_LABELS.controverso;
      return `
        <article class="rol-card">
          <div class="rol-card-head">
            <strong>${escapeHtml(item.nome)}</strong>
            <span class="rol-status-badge ${status.cls}">${escapeHtml(status.label)}</span>
          </div>
          <p class="rol-card-category">${escapeHtml(item.categoria)}</p>
          <p class="rol-card-note">${escapeHtml(item.nota)}</p>
        </article>`;
    })
    .join("");
}

function handleSearch() {
  const input = document.getElementById("rol-search-input");
  const query = input.value.trim();

  if (query.length < 2) {
    renderResults(DATA.slice(0, EXAMPLES_COUNT), { isSearch: false });
    return;
  }

  const results = DATA.filter((item) => matches(item, query));
  renderResults(results, { isSearch: true });
}

document.getElementById("rol-search-input").addEventListener("input", handleSearch);
handleSearch();
