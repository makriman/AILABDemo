import Card from '../common/Card';
import OptionButton from './OptionButton';

export default function QuestionCard({ question, selectedAnswer, onSelectAnswer, result }) {
  return (
    <Card className="question-card">
      <h3 className="question-title">{question.questionText}</h3>
      <div className="options-list">
        {question.options.map((option) => {
          const showResult = Boolean(result);
          const isCorrect = result ? option.label === result.correctAnswer : false;
          const isIncorrect = result
            ? option.label === result.selectedAnswer && option.label !== result.correctAnswer
            : false;

          return (
            <OptionButton
              key={option.label}
              option={option}
              selected={selectedAnswer === option.label}
              onSelect={() => onSelectAnswer?.(question.questionId, option.label)}
              showResult={showResult}
              isCorrect={isCorrect}
              isIncorrect={isIncorrect}
            />
          );
        })}
      </div>

      {result ? (
        <div className="question-feedback">
          <p>
            <strong>Your answer:</strong> {result.selectedAnswer}
          </p>
          <p>
            <strong>Correct answer:</strong> {result.correctAnswer}
          </p>
          <p>
            <strong>Why this is correct:</strong> {result.explanation}
          </p>
          {!result.isCorrect && result.wrongExplanation ? (
            <p>
              <strong>Why your answer was incorrect:</strong> {result.wrongExplanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
