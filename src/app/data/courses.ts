import { Localized } from '../core/i18n';

export interface CourseItem {
  title: string;
  organization: string;
  logo: string;
  issuedAt: string;
  summary: string;
  skills: string;
  credentialCode?: string;
}

export const COURSES: Localized<CourseItem[]> = {
  'en-US': [
    {
      title: 'AWS Certified Cloud Practitioner (CLF-C02) – 2025',
      organization: 'Udemy',
      logo: '/udemy_logo.jpeg',
      issuedAt: 'Jul 2026',
      summary: 'Preparation course for the AWS Certified Cloud Practitioner (CLF-C02) exam, covering core AWS services, cloud concepts, security, pricing, and support models.',
      skills: 'AWS · Cloud computing'
    },
    {
      title: 'Automated Testing with Jest',
      organization: 'Udemy',
      logo: '/udemy_logo.jpeg',
      issuedAt: 'Oct 2025',
      summary: 'Practical training on unit and integration testing with Jest, focused on code quality and maintainability.',
      skills: 'Jest · Test automation'
    },
    {
      title: 'CI/CD Pipelines with GitHub Actions',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'Sep 2025',
      summary: 'Building continuous integration and delivery pipelines to automate validation, build, and deployment.',
      skills: 'Continuous integration and delivery (CI/CD)',
      credentialCode: '42a3f889-2cfd-4bd8-a271-a7f09dfa8593'
    },
    {
      title: 'IaC with Terraform',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'May 2025',
      summary: 'Infrastructure as code fundamentals with Terraform for standardized and scalable provisioning.',
      skills: 'Infrastructure as code (IaC) · Terraform',
      credentialCode: 'd5939e53-0621-4770-9142-10d65a78b540'
    },
    {
      title: 'Containers with Docker and Docker Compose',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'Apr 2025',
      summary: 'Orchestrating development environments and application runtime with Docker containers.',
      skills: 'Docker · Docker Compose',
      credentialCode: '47d26a8a-46e7-4d8c-9c11-226a2e6821e3'
    },
    {
      title: 'DevOps Culture Fundamentals',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'Apr 2025',
      summary: 'Principles of collaboration, automation, and continuous delivery for more reliable engineering workflows.',
      skills: 'DevOps · Continuous integration',
      credentialCode: 'c732204e-a6a9-4e86-b0ed-723ea0bdd0f4'
    },
    {
      title: 'React: Software Architecture',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Architecting React applications for scalability, component organization, and separation of concerns.',
      skills: 'Software architecture'
    },
    {
      title: 'CSS: Variables and Fluid Layouts',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Using CSS variables and fluid layout techniques for responsive and consistent interfaces.',
      skills: 'CSS'
    },
    {
      title: 'TypeScript Essential Training',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Solid TypeScript foundations for static typing, safer refactoring, and better developer productivity.',
      skills: 'TypeScript'
    },
    {
      title: 'React: Design Patterns',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Applying design patterns in React to reduce coupling and improve component reuse.',
      skills: 'Software design patterns'
    },
    {
      title: 'Building Production-Ready React Apps: Setup to Deployment with Firebase',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Setting up and shipping React applications to production with a deployment strategy using Firebase.',
      skills: 'React.js · Single-page applications'
    },
    {
      title: 'Learning Next.js',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Modern web development fundamentals with Next.js, SSR, and performance-oriented project structure.',
      skills: 'Front-end development · Web development'
    },
    {
      title: 'Git and GitHub: Basic Training',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Essential version control, collaboration, and code review workflows with Git and GitHub.',
      skills: 'GitHub · Software development · Git'
    },
    {
      title: 'GitHub Actions: Basic Training',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'Nov 2024',
      summary: 'Automating build, test, and delivery workflows with GitHub Actions.',
      skills: 'IT automation · GitHub · Continuous integration and delivery (CI/CD)'
    }
  ],
  'pt-BR': [
    {
      title: 'AWS Certified Cloud Practitioner (CLF-C02) – 2025',
      organization: 'Udemy',
      logo: '/udemy_logo.jpeg',
      issuedAt: 'jul de 2026',
      summary: 'Curso preparatório para o exame AWS Certified Cloud Practitioner (CLF-C02), cobrindo serviços core da AWS, conceitos de nuvem, segurança, precificação e modelos de suporte.',
      skills: 'AWS · Computação em nuvem'
    },
    {
      title: 'Testes Automatizados com Jest',
      organization: 'Udemy',
      logo: '/udemy_logo.jpeg',
      issuedAt: 'out de 2025',
      summary: 'Curso prático sobre testes unitários e de integração com Jest, com foco em qualidade e manutenção de código.',
      skills: 'Jest · Automação de testes'
    },
    {
      title: 'Pipelines CI/CD com GitHub Actions',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'set de 2025',
      summary: 'Construção de pipelines de integração e entrega contínuas para automatizar validação, build e deploy.',
      skills: 'Integração e entrega contínuas (CI/CD)',
      credentialCode: '42a3f889-2cfd-4bd8-a271-a7f09dfa8593'
    },
    {
      title: 'IAC com Terraform',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'mai de 2025',
      summary: 'Fundamentos de infraestrutura como código com Terraform para provisionamento padronizado e escalável.',
      skills: 'Infraestrutura como código (IaC) · Terraform',
      credentialCode: 'd5939e53-0621-4770-9142-10d65a78b540'
    },
    {
      title: 'Containers com Docker e Docker Compose',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'abr de 2025',
      summary: 'Orquestração de ambientes de desenvolvimento e execução de aplicações em contêineres com Docker.',
      skills: 'Docker · Docker Compose',
      credentialCode: '47d26a8a-46e7-4d8c-9c11-226a2e6821e3'
    },
    {
      title: 'Fundamentos da Cultura DevOps',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'abr de 2025',
      summary: 'Princípios de colaboração, automação e entrega contínua para criar fluxos de engenharia mais confiáveis.',
      skills: 'DevOps · Integração contínua',
      credentialCode: 'c732204e-a6a9-4e86-b0ed-723ea0bdd0f4'
    },
    {
      title: 'React: Software Architecture',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Arquitetura de aplicações React com foco em escalabilidade, organização de componentes e separação de responsabilidades.',
      skills: 'Arquitetura de software'
    },
    {
      title: 'CSS: Variables and Fluid Layouts',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Uso de variáveis CSS e técnicas de layouts fluidos para interfaces responsivas e consistentes.',
      skills: 'CSS'
    },
    {
      title: 'TypeScript Essential Training',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Base sólida de TypeScript para tipagem estática, segurança em refatorações e produtividade no desenvolvimento.',
      skills: 'TypeScript'
    },
    {
      title: 'React: Design Patterns',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Aplicação de padrões de projeto em React para reduzir acoplamento e melhorar reutilização de componentes.',
      skills: 'Padrões de projeto de software'
    },
    {
      title: 'Building Production-Ready React Apps: Setup to Deployment with Firebase',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Configuração e entrega de aplicações React para produção com estratégia de deploy e serviços Firebase.',
      skills: 'React.js · Aplicativos de página única'
    },
    {
      title: 'Learning Next.js',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Fundamentos de desenvolvimento web moderno com Next.js, SSR e estrutura de projetos orientada a performance.',
      skills: 'Desenvolvimento de front-end · Desenvolvimento web'
    },
    {
      title: 'Git e GitHub: Formação Básica',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Fluxos essenciais de versionamento, colaboração e revisão de código com Git e GitHub.',
      skills: 'GitHub · Desenvolvimento de software · Git'
    },
    {
      title: 'GitHub Actions: Formação Básica',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Automação de workflows de build, testes e entrega utilizando GitHub Actions.',
      skills: 'Automação de TI · GitHub · Integração e entrega contínuas (CI/CD)'
    }
  ]
};
