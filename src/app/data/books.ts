import { Localized } from '../core/i18n';

export interface BookItem {
  title: string;
  description: string;
  cover: string;
}

export const BOOKS: Localized<BookItem[]> = {
  'en-US': [
    {
      title: 'Learn Domain-Driven Design',
      description: 'A practical and concise guide to modeling software around the domain, ubiquitous language, and design tactics that improve communication between teams and stakeholders.',
      cover: '/ddd.jpg'
    },
    {
      title: "Olhos d'água",
      description: "In Olhos d'água, Conceição Evaristo centers the Afro-Brazilian population and addresses poverty and urban violence with directness and humanity.",
      cover: '/olhos_dagua.svg'
    },
    {
      title: 'Open Veins of Latin America',
      description: 'A classic and incisive analysis of economic exploitation and the impacts of colonialism in Latin America, combining historical research and political critique.',
      cover: '/veias_abertas.jpg'
    },
    {
      title: 'Humanitarian Booklet',
      description: 'A short yet dense text with reflections on solidarity, ethics, and social responsibility, useful for expanding critical and empathetic thinking.',
      cover: '/opusculo.jpg'
    },
    {
      title: 'Life Is Not Useful',
      description: 'Reflective essays by Ailton Krenak on the relationship between society and nature, proposing collective ways of living and thinking grounded in care and sustainability.',
      cover: '/vida_nao_e_util.jpg'
    }
  ],
  'pt-BR': [
    {
      title: 'Aprenda Domain-Driven Design',
      description: 'Guia prático e conciso para modelar software com foco no domínio, na linguagem ubíqua e em táticas de design que melhoram a comunicação entre equipes e stakeholders.',
      cover: '/ddd.jpg'
    },
    {
      title: "Olhos d'água",
      description: "Em Olhos d'água, Conceição Evaristo ajusta o foco de seu interesse na população afro-brasileira abordando, sem meias palavras, a pobreza e a violência urbana que a acometem.",
      cover: '/olhos_dagua.svg'
    },
    {
      title: 'As Veias Abertas da América Latina',
      description: 'Análise clássica e contundente sobre a exploração econômica e os impactos do colonialismo na América Latina, combinando pesquisa histórica e crítica política.',
      cover: '/veias_abertas.jpg'
    },
    {
      title: 'Opúsculo Humanitário',
      description: 'Texto breve e denso com reflexões sobre solidariedade, ética e responsabilidade social, útil para ampliar repertório crítico e empático.',
      cover: '/opusculo.jpg'
    },
    {
      title: 'A Vida Não é Útil',
      description: 'Ensaios reflexivos de Ailton Krenak sobre a relação entre sociedade e natureza, propondo modos de vida e pensamento coletivo que valorizam a sustentabilidade e o cuidado.',
      cover: '/vida_nao_e_util.jpg'
    }
  ]
};
