import { Localized } from '../../core/i18n';

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  successMessage: string;
}

export const QUIZ_QUESTIONS: Localized<QuizQuestion[]> = {
  'en-US': [
    { prompt: 'How old am I?', options: ['18', '20', '22', '25'], correctIndex: 1, successMessage: 'Right. I am 20.' },
    { prompt: 'What is my current role?', options: ['Front-end developer', 'Back-end developer', 'Consultant', 'QA engineer'], correctIndex: 2, successMessage: 'Yes! I currently work as a consultant.' },
    { prompt: 'How long have I worked in tech?', options: ['1 year', '2 years', '3 years', '5 years'], correctIndex: 1, successMessage: 'Perfect. Two years in the field.' },
    { prompt: 'Since when have I studied technology?', options: ['Since 2021', 'Since 2022', 'Since 2023', 'Since 2024'], correctIndex: 2, successMessage: 'Correct. Since 2023.' },
    { prompt: 'What is my favorite food?', options: ['Lasagna', 'Feijoada', 'Burger', 'Sushi'], correctIndex: 1, successMessage: 'Nice. Feijoada all the way.' },
    { prompt: 'What is my favorite dessert?', options: ['Brigadeiro', 'Cheesecake', 'Brownie', 'Lemon pie'], correctIndex: 3, successMessage: 'Yes. Lemon pie.' },
    { prompt: 'What is my favorite movie?', options: ['Interstellar', 'John Wick 4', 'The Godfather', 'The Matrix'], correctIndex: 1, successMessage: 'Well done. John Wick 4.' },
    { prompt: 'What is my favorite TV series?', options: ['Breaking Bad', 'The Office', 'Game of Thrones', 'The Last of Us'], correctIndex: 2, successMessage: 'Right. Game of Thrones.' },
    { prompt: 'What is my favorite anime?', options: ['Naruto', 'Koe no Katachi', 'Attack on Titan', 'One Piece'], correctIndex: 3, successMessage: 'Perfect. One Piece.' }
  ],
  'pt-BR': [
    { prompt: 'Qual a minha idade atual?', options: ['18 anos', '20 anos', '22 anos', '25 anos'], correctIndex: 1, successMessage: 'Acertou. Tenho 20 anos.' },
    { prompt: 'Qual é o meu cargo atualmente?', options: ['Desenvolvedor front-end', 'Desenvolvedor back-end', 'Consultor', 'QA engineer'], correctIndex: 2, successMessage: 'Isso aí. Atualmente atuo como consultor.' },
    { prompt: 'Há quanto tempo atuo na área de tecnologia?', options: ['1 ano', '2 anos', '3 anos', '5 anos'], correctIndex: 1, successMessage: 'Perfeito. Tenho 2 anos de área.' },
    { prompt: 'Desde quando estudo tecnologia?', options: ['Desde 2021', 'Desde 2022', 'Desde 2023', 'Desde 2024'], correctIndex: 2, successMessage: 'Correto. Estudo desde 2023.' },
    { prompt: 'Qual é a minha comida favorita?', options: ['Lasanha', 'Feijoada', 'Hambúrguer', 'Sushi'], correctIndex: 1, successMessage: 'Boa. Minha comida favorita é feijoada.' },
    { prompt: 'Qual é o meu doce favorito?', options: ['Brigadeiro', 'Cheesecake', 'Brownie', 'Torta de limão'], correctIndex: 3, successMessage: 'Isso. Meu doce favorito é torta de limão.' },
    { prompt: 'Qual é o meu filme favorito?', options: ['Interestelar', 'John Wick 4', 'O Poderoso Chefão', 'Matrix'], correctIndex: 1, successMessage: 'Mandou bem. Meu filme favorito é John Wick 4.' },
    { prompt: 'Qual é a minha série favorita?', options: ['Breaking Bad', 'The Office', 'Game of Thrones', 'The Last of Us'], correctIndex: 2, successMessage: 'Acertou. Minha série favorita é Game of Thrones.' },
    { prompt: 'Qual é o meu anime favorito?', options: ['Naruto', 'Koe no Katachi', 'Attack on Titan', 'One Piece'], correctIndex: 3, successMessage: 'Perfeito. Meu anime favorito é One Piece.' }
  ]
};
