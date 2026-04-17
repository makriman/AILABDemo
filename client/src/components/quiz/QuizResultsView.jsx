import Card from '../common/Card';
import ScoreBadge from '../common/ScoreBadge';
import QuestionCard from './QuestionCard';

export default function QuizResultsView({ quiz }) {
  const answers = quiz.result?.answers || [];
  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));

  return (
    <section className="results-layout">
      <Card>
        <div className="score-head">
          <h1>{quiz.jobTitle}</h1>
          <ScoreBadge score={quiz.result?.score || 0} />
        </div>
        <p className="subtle">Quiz score based on your submitted answers.</p>
      </Card>

      {quiz.questions.map((question) => {
        const savedAnswer = answerByQuestionId.get(question.questionId);
        const selectedAnswer = savedAnswer?.selectedAnswer || null;
        const isCorrect = savedAnswer?.isCorrect || false;

        const result = {
          questionId: question.questionId,
          selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
          wrongExplanation: isCorrect ? null : question.wrongExplanations?.[selectedAnswer] || null,
        };

        return (
          <QuestionCard
            key={question.questionId}
            question={question}
            selectedAnswer={selectedAnswer}
            result={result}
          />
        );
      })}

      <Card>
        <h2>Learning Summary</h2>
        <p>{quiz.learningSummary}</p>
      </Card>
    </section>
  );
}
