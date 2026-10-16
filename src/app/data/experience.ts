import { Localized } from '../core/i18n';

export interface ExperienceItem {
  title: string;
  organization: string;
  period: string;
  status: string;
  current: boolean;
  summary: string;
  highlights: string[];
}

export const EXPERIENCES: Localized<ExperienceItem[]> = {
  'en-US': [
    {
      title: 'Associate Developer',
      organization: 'Thoughtworks',
      period: 'April 2026 - Present',
      status: 'Current role',
      current: true,
      summary: 'Joined as part of the 95th batch of Thoughtworks University, the company\'s global immersive training program for new Thoughtworkers. Working as a Consulting Developer, collaborating in client engagements while strengthening skills in software engineering, agile delivery, distributed systems, and cross-functional teamwork in a global environment.',
      highlights: [
        'Selected as part of the 95th batch of Thoughtworks University, the company\'s global immersive training program for new Thoughtworkers.',
        'Working as a Consulting Developer in client engagements.',
        'Strengthening skills in software engineering, agile delivery, distributed systems, and cross-functional teamwork in a global environment.'
      ]
    },
    {
      title: 'Software Developer',
      organization: 'Moderna Tecnologia',
      period: 'August 2025 - March 2026',
      status: 'Previous role',
      current: false,
      summary: 'Worked as a Full-Stack Developer focused primarily on Angular and Node.js, building scalable web applications and internal tools that improved operational efficiency across the company.',
      highlights: [
        'Collaborated in a cross-functional team using Scrum and Kanban for continuous and iterative delivery.',
        'Used Git, GitHub, and GitHub Actions while applying DevOps and GitOps principles for validation, deployment, and monitoring.',
        'Contributed to a 30% increase in operational performance across Customer Success, Logistics, Configuration, and Engineering through system modernization and an integrated web platform.'
      ]
    },
    {
      title: 'Full Stack Development Intern',
      organization: 'Moderna Tecnologia',
      period: 'February 3, 2025 - July 2025',
      status: 'Previous role',
      current: false,
      summary: 'Started my journey at Moderna Tecnologia as an on-site intern in Campinas, contributing to full-stack product delivery and building the foundation for my transition into a developer role.',
      highlights: [
        'Worked with Angular and Node.js in real business workflows.',
        'Learned to operate in a professional software team with agile practices and version control.',
        'Gained the experience that helped me grow into the next stage of my career.'
      ]
    }
  ],
  'pt-BR': [
    {
      title: 'Associate Developer',
      organization: 'Thoughtworks',
      period: 'abril de 2026 - atual',
      status: 'Cargo atual',
      current: true,
      summary: 'Selecionado para a 95ª turma da Thoughtworks University, o programa global de treinamento imersivo para novos Thoughtworkers. Atuando como Consulting Developer, colaborando em projetos de clientes enquanto fortaleço habilidades em engenharia de software, entrega ágil, sistemas distribuídos e trabalho em equipes globais multidisciplinares.',
      highlights: [
        'Selecionado para a 95ª turma da Thoughtworks University, o programa global de treinamento imersivo para novos Thoughtworkers.',
        'Atuando como Consulting Developer em projetos de clientes.',
        'Fortalecendo habilidades em engenharia de software, entrega ágil, sistemas distribuídos e trabalho em equipes globais multidisciplinares.'
      ]
    },
    {
      title: 'Desenvolvedor de Software',
      organization: 'Moderna Tecnologia',
      period: 'agosto de 2025 - março de 2026',
      status: 'Cargo anterior',
      current: false,
      summary: 'Atuei como desenvolvedor full stack com foco principal em Angular e Node.js, construindo aplicações web escaláveis e ferramentas internas que aumentam a eficiência operacional da empresa.',
      highlights: [
        'Atuação em time multifuncional com Scrum e Kanban para entregas contínuas e iterativas.',
        'Uso de Git, GitHub e GitHub Actions aplicando princípios de DevOps e GitOps para validação, deploy e monitoramento.',
        'Contribuição para um aumento de 30% na performance operacional em Customer Success, Logística, Configuração e Engenharia por meio da modernização de sistemas e de uma plataforma web integrada.'
      ]
    },
    {
      title: 'Estagiário de Desenvolvimento Full Stack',
      organization: 'Moderna Tecnologia',
      period: '3 de fevereiro de 2025 - julho de 2025',
      status: 'Cargo anterior',
      current: false,
      summary: 'Comecei minha trajetória na Moderna Tecnologia como estagiário presencial em Campinas, contribuindo para entregas full stack e construindo a base da minha transição para o papel de desenvolvedor.',
      highlights: [
        'Trabalho com Angular e Node.js em fluxos reais de negócio.',
        'Aprendizado de atuação em um time profissional com práticas ágeis e controle de versão.',
        'Experiência que impulsionou meu crescimento para a próxima etapa da carreira.'
      ]
    }
  ]
};
