import { Component, signal } from '@angular/core';

interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  successMessage: string;
}

interface QuizState {
  attempts: number;
  solved: boolean;
  selectedIndex: number | null;
  feedback: string;
}

@Component({
  selector: 'app-about-quiz',
  standalone: true,
  templateUrl: './about-quiz.component.html',
  styleUrl: './about-quiz.component.scss'
})
export class AboutQuizComponent {
  protected readonly questions: QuizQuestion[] = [
    {
      prompt: 'Qual a minha idade atual?',
      options: ['18 anos', '20 anos', '22 anos', '25 anos'],
      correctIndex: 1,
      successMessage: 'Acertou. Tenho 20 anos.'
    },
    {
      prompt: 'Qual é o meu cargo atualmente?',
      options: ['Desenvolvedor front-end', 'Desenvolvedor back-end', 'Desenvolvedor full stack', 'QA engineer'],
      correctIndex: 2,
      successMessage: 'Isso aí. Atualmente atuo como desenvolvedor full stack.'
    },
    {
      prompt: 'Há quanto tempo atuo na área de tecnologia?',
      options: ['1 ano', '2 anos', '3 anos', '5 anos'],
      correctIndex: 1,
      successMessage: 'Perfeito. Tenho 2 anos de área.'
    },
    {
      prompt: 'Desde quando estudo tecnologia?',
      options: ['Desde 2021', 'Desde 2022', 'Desde 2023', 'Desde 2024'],
      correctIndex: 2,
      successMessage: 'Correto. Estudo desde 2023.'
    },
    {
      prompt: 'Qual é a minha comida favorita?',
      options: ['Lasanha', 'Feijoada', 'Hambúrguer', 'Sushi'],
      correctIndex: 1,
      successMessage: 'Boa. Minha comida favorita é feijoada.'
    },
    {
      prompt: 'Qual é o meu doce favorito?',
      options: ['Brigadeiro', 'Cheesecake', 'Brownie', 'Torta de limão'],
      correctIndex: 3,
      successMessage: 'Isso. Meu doce favorito é torta de limão.'
    },
    {
      prompt: 'Qual é o meu filme favorito?',
      options: ['Interestelar', 'John Wick 4', 'O Poderoso Chefão', 'Matrix'],
      correctIndex: 1,
      successMessage: 'Mandou bem. Meu filme favorito é John Wick 4.'
    },
    {
      prompt: 'Qual é a minha série favorita?',
      options: ['Breaking Bad', 'The Office', 'Game of Thrones', 'The Last of Us'],
      correctIndex: 2,
      successMessage: 'Acertou. Minha série favorita é Game of Thrones.'
    },
    {
      prompt: 'Qual é o meu anime favorito?',
      options: ['Naruto', 'Koe no Katachi', 'Attack on Titan', 'One Piece'],
      correctIndex: 1,
      successMessage: 'Perfeito. Meu anime favorito é Koe no Katachi.'
    }
  ];

  protected readonly quizState = signal<QuizState[]>(this.buildInitialState());

  protected answerQuestion(questionIndex: number, optionIndex: number): void {
    this.quizState.update((current) =>
      current.map((entry, index) => {
        if (index !== questionIndex) {
          return entry;
        }

        if (entry.solved) {
          return entry;
        }

        const question = this.questions[questionIndex];
        const isCorrect = optionIndex === question.correctIndex;

        if (isCorrect) {
          return {
            attempts: entry.attempts,
            solved: true,
            selectedIndex: optionIndex,
            feedback: question.successMessage
          };
        }

        return {
          attempts: entry.attempts + 1,
          solved: false,
          selectedIndex: optionIndex,
          feedback: 'Quase! Não foi dessa vez. Tenta de novo.'
        };
      })
    );
  }

  protected resetQuiz(): void {
    this.quizState.set(this.buildInitialState());
  }

  protected getSolvedCount(): number {
    return this.quizState().filter((entry) => entry.solved).length;
  }

  protected getAttemptLabel(questionIndex: number): string {
    const attempts = this.quizState()[questionIndex]?.attempts ?? 0;
    if (attempts === 0) {
      return 'Sem erros até agora';
    }

    if (attempts === 1) {
      return '1 tentativa incorreta';
    }

    return `${attempts} tentativas incorretas`;
  }

  protected isSelected(questionIndex: number, optionIndex: number): boolean {
    return this.quizState()[questionIndex]?.selectedIndex === optionIndex;
  }

  protected isCorrectOption(questionIndex: number, optionIndex: number): boolean {
    const entry = this.quizState()[questionIndex];
    if (!entry?.solved) {
      return false;
    }

    return this.questions[questionIndex]?.correctIndex === optionIndex;
  }

  private buildInitialState(): QuizState[] {
    return this.questions.map(() => ({
      attempts: 0,
      solved: false,
      selectedIndex: null,
      feedback: ''
    }));
  }
}
