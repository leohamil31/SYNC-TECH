const { hashPassword } = require('../../utils/password');
const { watchUrl } = require('../../utils/youtube');

/**
 * Deterministic sample data:
 *   - 5 users (1 admin, 3 active students, 1 inactive student), all with SEED_PASSWORD
 *   - 5 published courses, 10 modules, 18 video lessons
 *   - learner progress (completed and in-progress lessons)
 *
 * Every lesson points to a real public YouTube video on the lesson topic.
 * Durations come from the video pages; null means "unknown" (the player reads it at runtime).
 *
 * @param {import('knex').Knex} knex
 */

const CATALOG = [
  {
    code: 'NODE-101',
    title: 'Node.js: do runtime à API',
    description: 'Entenda como o Node.js executa JavaScript no servidor, domine o modelo assíncrono e construa uma API REST com Express.',
    author: 'alice',
    modules: [
      {
        title: 'Fundamentos do runtime',
        description: 'O que é o Node.js, módulos, npm e o event loop.',
        lessons: [
          ['Node.js em 7 passos', 'ENrzD9HAZK4', 980, 'Instalação com nvm, o runtime, módulos, npm e uma aplicação completa construída passo a passo. Vídeo em inglês (Fireship).'],
          ['Como o event loop funciona', '8aGhZQkoFbQ', null, 'Call stack, Web APIs, fila de callbacks e por que não bloquear a thread principal. Palestra clássica de Philip Roberts na JSConf EU, em inglês.'],
          ['Async/await sem mistério', 'vn3tm0quoqE', 724, 'Callbacks, promises e async/await, incluindo o erro mais comum: aguardar em série o que poderia rodar em paralelo. Vídeo em inglês (Fireship).'],
        ],
      },
      {
        title: 'APIs REST com Express',
        description: 'Verbos HTTP, recursos, códigos de status e uma API construída do zero.',
        lessons: [
          ['APIs RESTful e Express na prática', '-MTSQjw5DrM', 679, 'Os princípios do REST e a construção de uma API com Express, finalizando com OpenAPI. Vídeo em inglês (Fireship).'],
        ],
      },
    ],
  },
  {
    code: 'REACT-101',
    title: 'React moderno',
    description: 'Componentes, JSX, estado e hooks: a base para construir interfaces declarativas com React.',
    author: 'bruno',
    modules: [
      {
        title: 'Fundamentos',
        description: 'Componentes, JSX, props e estado.',
        lessons: [
          ['React em 100 segundos', 'Tn6-PIqc4UM', 128, 'Visão geral relâmpago de componentes, JSX, estado e o ecossistema React. Vídeo em inglês (Fireship).'],
          ['Todos os conceitos do React', 'wIyHSOugGGw', 713, 'Os conceitos centrais do React, de componentes e JSX a estado e hooks, explicados em sequência. Vídeo em inglês (Code Bootcamp).'],
        ],
      },
      {
        title: 'Visão crítica',
        description: 'Os pontos fracos do React e quando eles importam.',
        lessons: [
          ['React e seus críticos', 'HyWYpM_S-2c', 153, 'As críticas mais comuns ao React apresentadas com humor, para entender trade-offs antes de escolher uma stack. Vídeo em inglês (Fireship).'],
        ],
      },
    ],
  },
  {
    code: 'SQL-101',
    title: 'SQL e PostgreSQL essencial',
    description: 'Modelagem relacional, consultas SQL e os recursos que tornam o PostgreSQL o banco relacional mais versátil.',
    author: 'alice',
    modules: [
      {
        title: 'Linguagem SQL',
        description: 'Tabelas, chaves, joins e CRUD.',
        lessons: [
          ['SQL em 100 segundos', 'zsjvFFKOm3c', 142, 'Tabelas, chaves primárias e estrangeiras, SELECT e JOIN em menos de três minutos. Vídeo em inglês (Fireship).'],
          ['SQL em 23 passos', 'Cz3WcZLRaWc', 1037, 'Criação de banco e tabelas, tipos de dados, normalização, CRUD e joins usando MySQL. Os comandos valem para o PostgreSQL. Vídeo em inglês (Fireship).'],
        ],
      },
      {
        title: 'PostgreSQL',
        description: 'O que diferencia o Postgres e como aproveitar seus recursos.',
        lessons: [
          ['PostgreSQL em 100 segundos', 'n2Fluyr3lbc', 156, 'Banco objeto-relacional, MVCC, tipos customizados e JSON. Vídeo em inglês (Fireship).'],
          ['Postgres para (quase) tudo', '3JW732GrMdg', 493, 'Dez usos pouco convencionais do PostgreSQL para montar uma aplicação full stack sem adicionar novos serviços. Vídeo em inglês (Fireship).'],
        ],
      },
    ],
  },
  {
    code: 'DOCKER-101',
    title: 'Docker para desenvolvedores',
    description: 'Imagens, containers e Compose para criar ambientes reproduzíveis do notebook à produção.',
    author: 'alice',
    modules: [
      {
        title: 'Conceitos',
        description: 'Dockerfile, imagem e container.',
        lessons: [
          ['Docker em 100 segundos', 'Gjnup-PuquQ', 127, 'Por que containers existem e a relação entre Dockerfile, imagem e container. Vídeo em inglês (Fireship).'],
          ['100+ conceitos de Docker', 'rIrNIzy6U_g', 508, 'Panorama de containerização: kernel compartilhado, Dockerfile, imagens, containers e como tudo escala na nuvem. Vídeo em inglês (Fireship).'],
        ],
      },
      {
        title: 'Na prática',
        description: 'Containerizando uma aplicação Node.js.',
        lessons: [
          ['Docker em 7 passos', 'gAkwW2tuIqE', 661, 'Containerize uma aplicação Node.js: Dockerfile, build, run, depuração, Compose e volumes. Vídeo em inglês (Fireship).'],
        ],
      },
    ],
  },
  {
    code: 'GIT-101',
    title: 'Git e GitHub',
    description: 'Versionamento do zero ao fluxo profissional: commits, branches, GitHub e técnicas avançadas.',
    author: 'carla',
    modules: [
      {
        title: 'Primeiros passos',
        description: 'O que é versionamento e como o Git funciona.',
        lessons: [
          ['O que é Git e versionamento?', 'xEKo29OWILE', 1826, 'Aula inaugural do Curso de Git e GitHub do Curso em Vídeo, com Gustavo Guanabara. Em português.'],
          ['Git em 100 segundos', 'hwP7WQkmECE', 117, 'Repositório, stage, commit, branch e merge em menos de dois minutos. Vídeo em inglês (Fireship).'],
        ],
      },
      {
        title: 'Fluxo profissional',
        description: 'Git no dia a dia e atalhos de quem usa muito.',
        lessons: [
          ['Git e GitHub na vida real: aula 1', '_Why5uCCrXc', null, 'Primeira aula da série "Git e GitHub na vida real", de Willian Justen, focada no uso do Git dentro do VS Code. Em português.'],
          ['13 técnicas avançadas de Git', 'ecK3EnyGD8o', 486, 'Commit --amend, stash, log em grafo e outros atalhos que aceleram o trabalho diário. Vídeo em inglês (Fireship).'],
        ],
      },
    ],
  },
];

exports.seed = async (knex) => {
  await knex.raw('TRUNCATE TABLE content_views, contents, modules, courses, users RESTART IDENTITY CASCADE');

  const passwordHash = await hashPassword(process.env.SEED_PASSWORD || 'SyncTech@2026');

  const people = [
    ['alice', 'Alice Johnson', 'alice@example.com', 'active', 'admin'],
    ['bruno', 'Bruno Silva', 'bruno@example.com', 'active', 'student'],
    ['carla', 'Carla Souza', 'carla@example.com', 'active', 'student'],
    ['daniel', 'Daniel Costa', 'daniel@example.com', 'active', 'student'],
    ['eva', 'Eva Martins', 'eva@example.com', 'inactive', 'student'],
  ];
  const users = {};
  // Inserted sequentially (not in parallel) so generated ids are predictable.
  for (const [key, name, email, status, role] of people) {
    const [{ id }] = await knex('users').insert({ name, email, status, role, password_hash: passwordHash }).returning('id');
    users[key] = id;
  }

  for (const course of CATALOG) {
    const [{ id: courseId }] = await knex('courses')
      .insert({ code: course.code, title: course.title, description: course.description, user_id: users[course.author] })
      .returning('id');

    for (const mod of course.modules) {
      const [{ id: moduleId }] = await knex('modules')
        .insert({ course_id: courseId, user_id: users[course.author], title: mod.title, description: mod.description })
        .returning('id');

      for (const [position, [title, videoId, duration, content]] of mod.lessons.entries()) {
        await knex('contents').insert({
          module_id: moduleId,
          title,
          content,
          video_url: watchUrl(videoId),
          duration_seconds: duration,
          position,
        });
      }
    }
  }

  // Lesson ids follow catalog order: 1-4 Node, 5-7 React, 8-11 SQL, 12-14 Docker, 15-18 Git.
  const done = (user, contentId) => ({ user_id: users[user], content_id: contentId, completed_at: knex.fn.now() });
  const started = (user, contentId, position) => ({ user_id: users[user], content_id: contentId, position_seconds: position });

  await knex('content_views').insert([
    done('alice', 1),
    done('alice', 2),
    done('bruno', 1),
    done('bruno', 5),
    started('bruno', 6, 400),
    done('carla', 2),
    done('carla', 15),
    started('carla', 16, 60),
    done('daniel', 2),
    done('eva', 12),
  ]);
};
