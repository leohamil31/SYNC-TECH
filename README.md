# SyncTech

Plataforma de cursos em vídeo com área do aluno (catálogo, player de aulas e progresso salvo automaticamente) e área administrativa (usuários, cursos, módulos, aulas e relatórios).

- **API**: Node.js 20+, Express 5, Knex (migrations e seeds), PostgreSQL, Zod. Autenticação JWT HS256 em cookie httpOnly + controle de acesso por papel (`student` / `admin`).
- **Web**: React 18, React Router, Vite, Framer Motion. Design system preto e roxo com superfícies de vidro (`GlassView`), PT-BR e EN.
- **Docs**: OpenAPI 3 / Swagger UI em `/api/docs` (botão **Authorize** aceita o token do login).
- **Infra**: Docker multi-stage, Docker Compose, Heroku (container stack), GitHub Actions.

## Início rápido (Docker)

```bash
docker compose up --build
```

| URL | O quê |
| --- | --- |
| http://localhost:3333 | Aplicação web |
| http://localhost:3333/api/docs | Swagger UI |

O container roda migrations e seeds ao subir. Os seeds **apagam todas as tabelas**; use `RUN_SEEDS=false docker compose up` para manter seus dados.

### Contas de exemplo

Todas usam a senha `SyncTech@2026` (variável `SEED_PASSWORD`).

| E-mail | Papel |
| --- | --- |
| alice@example.com | admin |
| bruno@example.com, carla@example.com, daniel@example.com | aluno |
| eva@example.com | aluno inativo (não consegue entrar) |

## Desenvolvimento local

Requisitos: Node.js 20+ e PostgreSQL 14+ (ou só o banco do Compose: `docker compose up db`).

```bash
cd backend
cp .env.example .env
npm install
npm run migrate && npm run seed
npm run dev          # http://localhost:3333
```

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxy de /api para :3333)
```

Em desenvolvimento a tela de login mostra atalhos para as contas de exemplo.

## Variáveis de ambiente (backend)

| Variável | Padrão | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/courses` | Conexão |
| `DATABASE_SSL` | `false` | `true` no Heroku Postgres |
| `JWT_SECRET` | segredo de dev | **Obrigatório em produção, mín. 32 caracteres.** A API não sobe sem ele. |
| `JWT_TTL_SECONDS` | `28800` (8 h) | Duração da sessão |
| `ALLOW_SIGNUP` | `true` | `false` desativa o cadastro público (admins continuam criando contas) |
| `COOKIE_SECURE` | `true` em produção | `false` apenas em HTTP puro (Docker local) |
| `TRUST_PROXY` | `1` em produção | Número de proxies na frente da app (para IP correto no rate limit) |
| `SEED_PASSWORD` | `SyncTech@2026` | Senha das contas criadas pelo seed |

## Arquitetura

### Controle de acesso

| Rotas | Quem acessa |
| --- | --- |
| `POST /api/auth/login`, `/register`, `/logout` | Público (login e cadastro com limite de 10 tentativas / 15 min por IP) |
| `GET /api/auth/me`, `/api/me/**` | Qualquer usuário autenticado (área do aluno) |
| `/api/users`, `/courses`, `/modules`, `/contents`, `/reports/**` | Somente `admin` |

- O token vai em cookie `httpOnly; SameSite=Strict` (o JavaScript nunca o lê, e o SameSite bloqueia CSRF). Clientes de API podem usar `Authorization: Bearer <token>`, também retornado no login.
- Papel e status são relidos do banco a cada requisição: rebaixar ou desativar alguém vale na hora.
- O cadastro público sempre cria `student`. Um admin não pode excluir, desativar ou rebaixar a própria conta.
- Cursos com `published = false` não aparecem para alunos (respondem 404) e podem ser pré-visualizados por admins.
- No frontend, `RequireAuth` e `RequireRole` protegem as rotas `/app/**` e `/admin/**`. O código do painel admin é carregado sob demanda (lazy).

### Progresso do aluno

`content_views` guarda uma linha por aluno e aula: `watched_at` (primeiro acesso), `position_seconds` (ponto de retomada) e `completed_at`.

O player usa a YouTube IFrame Player API e salva a posição a cada 10 s de reprodução, ao pausar, ao sair da página e ao esconder a aba (com `fetch keepalive`). A aula é concluída ao chegar a 90% do vídeo, ao terminar ou pelo botão "Marcar como concluída". Se o script do YouTube não carregar, um embed simples é exibido.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/me/summary` | Totais e a aula para retomar |
| GET | `/me/courses?search=` | Catálogo com progresso |
| GET | `/me/courses/:id` | Módulos, aulas, status e próxima aula |
| GET | `/me/lessons/:id` | Dados do player, posição, anterior e próxima |
| PUT | `/me/lessons/:id/progress` | `{ position_seconds?, completed? }` |
| DELETE | `/me/lessons/:id/progress` | Reinicia a aula |

### Banco de dados

Diagrama e decisões: **[docs/DER.md](docs/DER.md)**. As três migrations de 2026-11-04 são aditivas (não alteram as originais), então bancos existentes migram com `npm run migrate`. Registros antigos de `content_views` são marcados como concluídos.

O seed cria 5 cursos, 10 módulos e **18 aulas com vídeos reais do YouTube** sobre o tema de cada aula (Fireship, Curso em Vídeo, Willian Justen, Code Bootcamp, JSConf). A lista com os IDs está em `backend/src/db/seeds/01_initial_data.js`.

### Relatórios SQL

Em **[backend/sql/reports.sql](backend/sql/reports.sql)**, expostos em `/api/reports/*` e na Visão geral do admin (cada um com o botão "Ver SQL"): autores com mais cursos, curso com mais aulas (com empates), módulos e aulas por curso, aulas com o curso, quem concluiu uma aula e conclusão por curso.

## Estrutura

```text
backend/src/
  config/env.js               variáveis e validação do JWT_SECRET
  db/migrations, db/seeds
  middlewares/                auth (authenticate/authorize), rate-limit, validate, error-handler
  services/                   CRUD genérico, auth, learner (progresso), relatórios
  routes/index.js             mapa de rotas e guardas por papel
  utils/                      jwt (HS256), password (scrypt), youtube
  validators/schemas.js       Zod
  docs/openapi.yaml

frontend/src/
  app/                        App (rotas) e guards
  design-system/
    styles/tokens.css         cores, tipografia, espaçamento, raios, motion
    styles/base.css, components.css
    GlassView.jsx             vidro fosco com a API do expo-glass-effect
    Modal, Toast, Confirm, Progress, Feedback, Icon, Avatar
    motion/                   variantes e componentes de animação
    brand/                    logo 3D e splash
  shell/                      AppShell responsivo (sidebar / top bar + tab bar), navegação
  features/
    auth/                     AuthProvider, login, cadastro
    learner/                  início, catálogo, curso, player (YouTubePlayer, CourseOutline)
    admin/                    visão geral, CRUD genérico, editor de curso, detalhes da aula
  shared/                     cliente HTTP, hooks, i18n, utilitários
```

Para mudar a identidade visual, edite `design-system/styles/tokens.css`. Cada feature importa apenas o próprio CSS.

### Animações

| Onde | O quê | Arquivo |
| --- | --- | --- |
| Todo o app | Luzes roxas em movimento lento e brilho que segue o cursor (desktop) | `design-system/AmbientBackground.jsx` |
| Títulos das páginas iniciais | Palavras que se montam uma a uma | `design-system/motion/TextReveal.jsx` |
| Início do aluno | Card "continuar assistindo" com zoom da miniatura, botão de play com pulso e textos em sequência | `features/learner/pages/HomePage.jsx` |
| Cards de curso e KPIs | Inclinação 3D seguindo o mouse, zoom da miniatura, entrada ao rolar | `design-system/motion/useTilt.js`, `Reveal.jsx` |
| Player | Explosão de partículas ao concluir uma aula | `design-system/motion/Burst.jsx` |
| Botões primários | Reflexo de luz ao passar o mouse | `styles/components.css` |
| Navegação | Transição com desfoque entre páginas, indicador de aba com mola | `motion/variants.js`, `shell/AppShell.jsx` |

Tudo respeita a configuração "reduzir movimento" do sistema operacional (`MotionConfig reducedMotion="user"` e a regra global em `base.css`).

### Dashboards iniciais

- **Aluno (`/app`)**: saudação, card para continuar a aula, três números e até três cursos em andamento (ou sugestões, para quem ainda não começou).
- **Admin (`/admin`)**: quatro indicadores, conclusão por curso em barras e acessos recentes. Os relatórios SQL completos ficam na aba **Relatórios** (`/admin/reports`).

### Sobre `expo-glass-effect`

`expo-glass-effect` é um módulo nativo do Expo (React Native, iOS 26) e não roda em uma aplicação web Vite. O efeito é implementado por `GlassView` com `backdrop-filter`, mantendo as mesmas props (`glassEffectStyle: 'regular' | 'clear'`, `tintColor`, `isInteractive`) e o helper `isGlassEffectAPIAvailable()`. Um futuro app Expo pode trocar o import sem mudar as chamadas. Navegadores sem `backdrop-filter` recebem uma superfície sólida.

## Testes

Testes de integração (Node test runner + Supertest) contra PostgreSQL real (`TEST_DATABASE_URL`):

```bash
cd backend && npm test
```

Cobrem login, cookie, token adulterado, permissões por papel, proteção contra auto-bloqueio, CRUD, normalização de URL do YouTube, publicação, progresso e todos os relatórios.

## Deploy gratuito (Render + Neon)

O app inteiro (API e site) roda de graça no plano free do [Render](https://render.com), com o banco no plano free do [Neon](https://neon.com).

1. No Neon, crie um projeto e copie a *connection string* (`postgresql://...?sslmode=require`).
2. Abra https://render.com/deploy?repo=https://github.com/leohamil31/SYNC-TECH, cole a string em `DATABASE_URL` e confirme. O `render.yaml` cria o serviço com `JWT_SECRET` aleatório.
3. Para carregar os cursos de exemplo: em **Environment**, mude `RUN_SEEDS` para `true`, espere o deploy terminar e **volte para `false`**. Caso contrário, os dados são apagados a cada reinício.

Limites do plano free: o serviço dorme após 15 minutos sem acesso e leva cerca de um minuto para acordar no próximo acesso.

## Deploy no Heroku

```bash
heroku create <app>
heroku stack:set container
heroku addons:create heroku-postgresql:essential-0
heroku config:set DATABASE_SSL=true JWT_SECRET="$(openssl rand -base64 48)"
git push heroku main
heroku run ./node_modules/.bin/knex seed:run   # opcional: dados de exemplo
```

## GitHub Pages (demo estática)

Demo: https://leohamil31.github.io/SYNC-TECH/

O GitHub Pages só serve arquivos estáticos, então não roda Node.js nem PostgreSQL. O workflow `.github/workflows/pages.yml` gera o frontend com `VITE_DEMO=true`. Nesse modo, as chamadas à API são atendidas por `frontend/src/shared/api/demo/server.js`, uma reimplementação da API no navegador (login, papéis, catálogo, progresso, CRUD e relatórios) com os mesmos dados do seed, salva no `localStorage`. Use as contas de exemplo pelos atalhos da tela de login; o botão "Restaurar dados" volta ao estado inicial.

É uma demonstração: tudo roda no navegador de quem acessa, sem segurança real. O build normal não inclui esse código (ele é carregado com `import()` dinâmico só quando `VITE_DEMO=true`).

Configuração única: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Cada push na `main` publica de novo.

## Mudanças em relação à versão anterior

- A coleção Postman foi removida porque não cobria autenticação. Use o Swagger (`/api/docs`) com o botão Authorize.
- O tema claro foi removido; a identidade é escura por definição.
