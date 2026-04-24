import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import QuestionCard from '../components/quiz/QuestionCard';
import PageContainer from '../components/layout/PageContainer';
import { useQuizSession } from '../context/QuizSessionContext';
import { useToast } from '../context/ToastContext';
import { submitQuiz } from '../services/api';
import { parseApiError } from '../utils/helpers';

const EXPIRED_SESSION_MESSAGE = 'This temporary quiz session has expired. Generate a new one.';

export default function QuizPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { quiz, attemptToken, expiresAt, answers, setAnswer, setResult, clearSession } =
    useQuizSession();
  const [submitting, setSubmitting] = useState(false);

  const sessionMissing = !quiz || !attemptToken;
  const sessionExpired = expiresAt ? Date.now() > new Date(expiresAt).getTime() : false;

  useEffect(() => {
    if (sessionMissing || sessionExpired) {
      clearSession();
      showToast(EXPIRED_SESSION_MESSAGE, 'info');
      navigate('/', { replace: true });
    }
  }, [clearSession, navigate, sessionExpired, sessionMissing, showToast]);

  const allAnswered = useMemo(() => {
    if (!quiz) {
      return false;
    }

    return quiz.questions.every((question) => Boolean(answers[question.questionId]));
  }, [answers, quiz]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!quiz || !attemptToken || !allAnswered) {
      return;
    }

    const payload = quiz.questions.map((question) => ({
      questionId: question.questionId,
      selectedAnswer: answers[question.questionId],
    }));

    setSubmitting(true);

    try {
      const scored = await submitQuiz(attemptToken, payload);
      setResult(scored);
      navigate('/results');
    } catch (error) {
      if (error?.response?.status === 410) {
        clearSession();
        showToast(parseApiError(error, EXPIRED_SESSION_MESSAGE), 'error');
        navigate('/', { replace: true });
      } else {
        showToast(
          parseApiError(error, 'Unable to submit quiz right now. Your selections are still in memory.'),
          'error'
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionMissing || sessionExpired || !quiz) {
    return null;
  }

  return (
    <PageContainer>
      <form className="stack-lg" onSubmit={handleSubmit}>
        <Card>
          <h1>{quiz.jobTitle}</h1>
          <p className="subtle">Answer all 5 questions to score this temporary quiz.</p>
        </Card>

        {quiz.questions.map((question) => (
          <QuestionCard
            key={question.questionId}
            question={question}
            selectedAnswer={answers[question.questionId]}
            onSelectAnswer={setAnswer}
          />
        ))}

        <Button type="submit" loading={submitting} disabled={!allAnswered}>
          Submit quiz
        </Button>
      </form>
    </PageContainer>
  );
}
