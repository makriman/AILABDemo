import Card from '../common/Card';
import ScoreBadge from '../common/ScoreBadge';
import QuestionCard from './QuestionCard';

export default function QuizResultsView({ result }) {
  return (
    <section className="results-layout">
      <Card>
        <div className="score-head">
          <h1>{result.jobTitle}</h1>
          <ScoreBadge score={result.score} total={result.totalQuestions || 5} />
        </div>
        <p className="subtle">Score based on your submitted answers.</p>
      </Card>

      {result.results.map((questionResult) => (
        <QuestionCard
          key={questionResult.questionId}
          question={{
            questionId: questionResult.questionId,
            questionText: questionResult.questionText,
            options: questionResult.options,
          }}
          selectedAnswer={questionResult.selectedAnswer}
          result={questionResult}
        />
      ))}

      <Card>
        <h2>Learning Summary</h2>
        <p>{result.learningSummary}</p>
      </Card>
    </section>
  );
}
