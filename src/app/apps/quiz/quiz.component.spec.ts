import { TestBed } from '@angular/core/testing';
import { QUIZ_QUESTIONS } from './quiz.data';
import { QuizComponent } from './quiz.component';

describe('QuizComponent', () => {
  const solve = (quiz: QuizComponent) =>
    QUIZ_QUESTIONS['en-US'].forEach((question, index) => quiz.answer(index, question.correctIndex));

  it('emits the secret on a perfect run', () => {
    const quiz = TestBed.createComponent(QuizComponent).componentInstance;
    let unlocked = 0;
    quiz.secretUnlocked.subscribe(() => unlocked++);

    solve(quiz);
    expect(unlocked).toBe(1);
  });

  it('does not emit after a mistake, until reset', () => {
    const quiz = TestBed.createComponent(QuizComponent).componentInstance;
    let unlocked = 0;
    quiz.secretUnlocked.subscribe(() => unlocked++);

    const first = QUIZ_QUESTIONS['en-US'][0];
    quiz.answer(0, (first.correctIndex + 1) % first.options.length);
    solve(quiz);
    expect(unlocked).toBe(0);
    expect(quiz.answers()[0].mistakes).toBe(1);

    quiz.reset();
    solve(quiz);
    expect(unlocked).toBe(1);
  });
});
