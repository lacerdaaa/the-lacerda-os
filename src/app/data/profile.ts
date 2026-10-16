import { Localized } from '../core/i18n';

export interface SkillBadge {
  label: string;
  src: string;
}

export const PROFILE = {
  name: 'Eduardo Lacerda',
  role: { 'en-US': 'Associate Developer · Thoughtworks', 'pt-BR': 'Associate Developer · Thoughtworks' } as Localized<string>,
  location: { 'en-US': 'Campinas, São Paulo, Brazil', 'pt-BR': 'Campinas, São Paulo, Brasil' } as Localized<string>,
  githubUrl: 'https://github.com/lacerdaaa',
  githubLabel: 'github.com/lacerdaaa',
  mediumUrl: 'https://medium.com/@edulacerdaaa',
  mediumLabel: 'medium.com/@edulacerdaaa',
  githubUser: 'lacerdaaa',
  /** Repositories shown first in Projects, in this order. */
  pinnedRepos: ['pressum-core-service', 'fynansee-core', 'auto-trace']
} as const;

export const PROFILE_PARAGRAPHS: Localized<string[]> = {
  'en-US': [
    'I live in Campinas, São Paulo, Brazil. I am a software developer focused on building real-world products with strong engineering fundamentals.',
    "I started my professional journey in technology in 2024. Today, I work mainly with TypeScript, Angular, Node.js, and NestJS, and I also have hands-on experience with React, .NET, and Python.",
    'In April 2026, I joined Thoughtworks as an Associate Developer, part of the 95th batch of Thoughtworks University, the company\'s global immersive training program. I work remotely from Chicago, Illinois, as a Consulting Developer. Previously, I was at Moderna Tecnologia from February 2025 to March 2026, growing from intern to Software Developer.',
    "I have a technician degree and I am preparing to pursue a bachelor's degree in Computer Science or Information Systems at USP or UNICAMP. I care deeply about software engineering practices such as Domain-Driven Design (DDD), Test-Driven Development (TDD), and maintainable architecture.",
    'Outside software, I love cooking and learning history through food, finance, geopolitics, and economics. I also enjoy reading and listening to music.'
  ],
  'pt-BR': [
    'Moro em Campinas, São Paulo, Brasil. Sou desenvolvedor de software com foco em construir produtos reais com fundamentos sólidos de engenharia.',
    'Comecei minha jornada profissional em tecnologia em 2024. Hoje trabalho principalmente com TypeScript, Angular, Node.js e NestJS, e também tenho experiência prática com React, .NET e Python.',
    'Em abril de 2026, ingressei na Thoughtworks como Associate Developer, fazendo parte da 95ª turma da Thoughtworks University, o programa global de treinamento imersivo da empresa. Atuo remotamente de Chicago, Illinois, como Consulting Developer. Antes, estive na Moderna Tecnologia de fevereiro de 2025 a março de 2026, evoluindo de estagiário a desenvolvedor de software.',
    'Tenho formação técnica e estou me preparando para cursar Ciência da Computação ou Sistemas de Informação na USP ou na UNICAMP. Dou muita importância a práticas de engenharia de software como DDD, TDD e arquitetura sustentável.',
    'Fora de software, gosto de cozinhar e de aprender história por meio da comida, além de acompanhar finanças, geopolítica e economia. Também gosto de ler e ouvir música.'
  ]
};

export const SKILLS: SkillBadge[] = [
  { label: 'Angular', src: '/skills/angular.svg' },
  { label: 'TypeScript', src: '/skills/typescript.svg' },
  { label: 'JavaScript', src: '/skills/javascript.svg' },
  { label: '.NET', src: '/skills/dotnet.svg' },
  { label: 'NestJS', src: '/skills/nestjs.svg' },
  { label: 'Docker', src: '/skills/docker.svg' },
  { label: 'Kubernetes', src: '/skills/kubernetes.svg' },
  { label: 'Terraform', src: '/skills/terraform.svg' },
  { label: 'Jest', src: '/skills/jest.svg' }
];
