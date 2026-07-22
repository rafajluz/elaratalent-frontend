# Elara Talent — Frontend

Site estático (HTML/CSS/JS vanilla, sem framework/build step) que consome a API do backend (`careerai-backend`, repo separado). Landing page + app de análise de currículo x vaga, em uma única página (`index.html`).

- **Deploy:** Vercel, deploy automático a cada push em `main`.
- **URL produção:** `https://www.elaratalent.com.br` (domínio próprio; também acessível em `https://elaratalent-frontend.vercel.app`).
- **Backend:** `https://web-production-acc31.up.railway.app` — configurado em `app.js` (`API_URL`, topo do arquivo).

## Arquitetura

```
index.html         # Página única do app (landing + análise + resultado + kit de materiais)
app.js              # Toda a lógica: auth, chamadas à API, renderização, PII, histórico local
styles.css           # Todo o CSS — inclui tema claro (padrão) e escuro (@media prefers-color-scheme)
termos.html            # Termos de Uso (página separada, fora do rewrite do SPA — ver vercel.json)
privacidade.html        # Política de Privacidade (idem)
legal/                    # Fontes .md dos documentos legais — NUNCA linkado/publicado, só referência local
manifest.json              # PWA — instalável em Android/iOS
sw.js                        # Service Worker (estratégia network-first)
icons/                        # Ícones do PWA (192/512/512-maskable/apple-touch)
vercel.json                    # Rewrites (SPA fallback) + headers de segurança
```

## Convenções importantes

**Sem build step.** É só abrir/servir os arquivos direto — sem npm, sem bundler. Para testar localmente, servir com qualquer HTTP server estático (ex: `py -m http.server`); abrir via `file://` direto tem limitações (Service Worker e alguns fetch não funcionam).

**Autenticação:** token JWT fica em `localStorage` (`ca_token`) e o objeto do usuário em `ca_user` — ver objeto `auth` no topo de `app.js` (`auth.token`, `auth.user`, `auth.save()`, `auth.clear()`, `auth.hasCredits()`, `auth.headers()`). Toda chamada autenticada usa `auth.headers()`.

**Escapar HTML sempre.** Qualquer dado dinâmico (resposta da API/Claude, resultado de busca de vaga da Adzuna, conteúdo do `localStorage`) que for inserido via `innerHTML` **precisa passar por `escapeHtml()`** (definida perto do topo de `app.js`) — é o padrão consistente usado em todo o arquivo hoje; não quebrar isso ao adicionar renderização nova. Revisão de segurança (2026-07-22) conferiu isso a fundo e não achou furo — manter assim.

**Detecção de PII é 100% client-side**, antes de qualquer envio ao backend — `detectSensitiveInfo()`/`redactSensitiveInfo()`/`checkPiiBanner()` em `app.js`. Roda no upload de arquivo e no `blur` do textarea de currículo.

**Histórico de análises** (`localStorage.getItem("elaratalent-history")`) é só local ao navegador — não sincroniza entre dispositivos (decisão explícita, ver memória do projeto: não vale a pena implementar um dashboard cross-device sem necessidade real comprovada ainda).

**`spellcheck="false"`** nos textareas de currículo/vaga (`#resume-input`, `#job-input`) — proposital, evita sublinhado vermelho do corretor do navegador em texto colado.

## Identidade visual — "dossiê/veredito" (redesign 2026-07-21)

Paleta e tipografia vivem inteiramente em `:root` (`styles.css`) como CSS custom properties — reaproveitar os tokens existentes em vez de hardcodar cor nova:

- `--ink` (quase preto, texto/headline), `--paper` (bege claro, fundo), `--chalk` (branco, cartões), `--plum`/`--blue` (cobalto, cor de destaque/CTA), `--copper` (vermelho-tijolo, alertas/PII), `--line` (bordas finas de 1px).
- Tipografia: **IBM Plex Mono** (headlines/labels/dados) + **IBM Plex Sans** (corpo), carregadas via Google Fonts `<link>` no `<head>` de cada página HTML.
- Border-radius pequeno (3-4px), sem sombra suave — bordas finas de 1px no lugar. Pílulas (`999px`) são exceção proposital.
- **Elemento-assinatura:** `.ring` (o "carimbo" de match score) é um retângulo rotacionado (-3deg) com borda grossa e sombra dura deslocada, fundo **branco puro fixo** (não usa `var(--chalk)`, nem no modo escuro) com o número em cobalto — é o único elemento com esse tratamento, não replicar em outro lugar sem necessidade.

**Modo escuro** é real (`@media (prefers-color-scheme: dark)` redefinindo os tokens do `:root`), segue a preferência do sistema automaticamente — não é toggle manual. Ao adicionar uma cor nova, sempre checar se ela precisa de uma variante dentro desse media query (usar `rgba(var(--ink-rgb), X)` etc. para opacidade variável, não hex/rgba hardcoded, senão a cor não muda de tema).

Ao mexer em qualquer coisa visual, considerar carregar a skill `frontend-design` primeiro se for uma mudança de direção (não apenas ajuste pontual).

## Testando visualmente

Este projeto normalmente não é o diretório de trabalho primário de sessões do Claude Code aqui (`careerai-backend-v2` costuma ser) — o Browser pane (`preview_start`) só lê `.claude/launch.json` do diretório primário. Se precisar prever este site no navegador integrado, adicionar (ou confirmar que já existe) uma config tipo:

```json
{ "name": "elaratalent", "runtimeExecutable": "py", "runtimeArgs": ["-m", "http.server", "8081", "--directory", "<caminho-absoluto-para-este-repo>"], "port": 8081 }
```

no `.claude/launch.json` do diretório de trabalho primário da sessão.

## Armadilhas conhecidas

- **`vercel.json`:** o rewrite do SPA fallback precisa excluir `termos.html`/`privacidade.html` explicitamente (negative lookahead) — um catch-all `"/(.*)" → "/index.html"` simples faz essas páginas nunca serem servidas de verdade mesmo com deploy OK.
- **Instagram (perfil `@elaratalent`, não é este repo mas gerado a partir dele):** ícones do PWA (`icons/icon-512.png`) foram reaproveitados como foto de perfil.
