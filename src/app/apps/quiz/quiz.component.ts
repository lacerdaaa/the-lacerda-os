import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { format, I18nService } from '../../core/i18n';
import { QUIZ_QUESTIONS } from './quiz.data';

interface AnswerState {
  mistakes: number;
  solved: boolean;
  selectedIndex: number | null;
}

const COPY = {
  title: { 'en-US': 'How well do you know me?', 'pt-BR': 'Quanto você me conhece?' },
  progress: { 'en-US': '{solved}/{total} correct', 'pt-BR': '{solved}/{total} acertos' },
  reset: { 'en-US': 'Start Over', 'pt-BR': 'Recomeçar' },
  wrong: { 'en-US': 'Not quite! Try again.', 'pt-BR': 'Quase! Não foi dessa vez. Tenta de novo.' },
  noMistakes: { 'en-US': 'No mistakes so far', 'pt-BR': 'Sem erros até agora' },
  mistakes: { 'en-US': '{count} wrong attempt(s)', 'pt-BR': '{count} tentativa(s) incorreta(s)' },
  perfect: { 'en-US': 'Flawless! You really know me. Something changed on the desktop…', 'pt-BR': 'Impecável! Você me conhece mesmo. Algo mudou na mesa…' },
  done: {
    'en-US': 'All done with {mistakes} mistake(s). Get every answer right on the first try to unlock a secret.',
    'pt-BR': 'Concluído com {mistakes} erro(s). Acerte tudo de primeira para desbloquear um segredo.'
  }
};

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizComponent {
  /** Emitted once when every question is answered correctly on the first try. */
  readonly secretUnlocked = output<void>();

  private readonly i18n = inject(I18nService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly questions = computed(() => this.i18n.pick(QUIZ_QUESTIONS));
  readonly answers = signal<AnswerState[]>(this.initialAnswers());
  private hasEmittedSecret = false;

  protected readonly solvedCount = computed(() => this.answers().filter((answer) => answer.solved).length);
  protected readonly totalMistakes = computed(() => this.answers().reduce((sum, answer) => sum + answer.mistakes, 0));
  protected readonly finished = computed(() => this.answers().every((answer) => answer.solved));
  protected readonly progressLabel = computed(() =>
    format(this.copy().progress, { solved: this.solvedCount(), total: this.answers().length })
  );
  protected readonly resultLabel = computed(() =>
    this.totalMistakes() === 0 ? this.copy().perfect : format(this.copy().done, { mistakes: this.totalMistakes() })
  );

  answer(questionIndex: number, optionIndex: number): void {
    const current = this.answers()[questionIndex];
    if (!current || current.solved) {
      return;
    }

    const correct = this.questions()[questionIndex].correctIndex === optionIndex;
    this.answers.update((answers) =>
      answers.map((answer, index) =>
        index === questionIndex
          ? { solved: correct, selectedIndex: optionIndex, mistakes: answer.mistakes + (correct ? 0 : 1) }
          : answer
      )
    );

    if (!this.hasEmittedSecret && this.finished() && this.totalMistakes() === 0) {
      this.hasEmittedSecret = true;
      this.secretUnlocked.emit();
    }
  }

  reset(): void {
    this.answers.set(this.initialAnswers());
    this.hasEmittedSecret = false;
  }

  protected feedback(questionIndex: number): string {
    const answer = this.answers()[questionIndex];
    if (answer.solved) {
      return this.questions()[questionIndex].successMessage;
    }
    return answer.selectedIndex === null ? '' : this.copy().wrong;
  }

  protected mistakesLabel(questionIndex: number): string {
    const mistakes = this.answers()[questionIndex].mistakes;
    return mistakes === 0 ? this.copy().noMistakes : format(this.copy().mistakes, { count: mistakes });
  }

  private initialAnswers(): AnswerState[] {
    return QUIZ_QUESTIONS['en-US'].map(() => ({ mistakes: 0, solved: false, selectedIndex: null }));
  }
}
