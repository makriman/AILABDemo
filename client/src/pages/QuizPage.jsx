import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QuestionCard from '../components/quiz/QuestionCard';
import PageContainer from '../components/layout/PageContainer';
import { useToast } from '../context/ToastContext';
import { getQuiz, submitQuiz } from '../services/api';
import { parseApiError } from '../utils/helpers';

function storageKey(quizId) {
  return `quiz_answers_${quizId}`;
}

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadQuiz() {
      try {
        const data = await getQuiz(quizId);

        if (data.result) {
          navigate(`/quiz/${quizId}/results`, { replace: true });
          return;
        }

        if (mounted) {
          setQuiz(data);
          const savedAnswers = localStorage.getItem(storageKey(quizId));
          if (savedAnswers) {
            try {
              setAnswers(JSON.parse(savedAnswers));
            } catch (error) {
              localStorage.removeItem(storageKey(quizId));
            }
          }
        }
      } catch (error) {
        showToast(parseApiError(error, 'Unable to load quiz.'), 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      mounted = false;
    };
  }, [navigate, quizId, showToast]);

  function handleSelectAnswer(questionId, selectedAnswer) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: selectedAnswer };
      localStorage.setItem(storageKey(quizId), JSON.stringify(next));
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!quiz) {
      return;
    }

    const payload = quiz.questions.map((question) => ({
      questionId: question.questionId,
      selectedAnswer: answers[question.questionId],
    }));

    setSubmitting(true);
    try {
      await submitQuiz(quizId, payload);
      localStorage.removeItem(storageKey(quizId));
      navigate(`/quiz/${quizId}/results`);
    } catch (error) {
      showToast(
        parseApiError(error, 'Unable to submit quiz. Your selections are saved, please try again.'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading quiz..." />
      </PageContainer>
    );
  }

  if (!quiz) {
    return (
      <PageContainer>
        <Card>
          <p>Quiz not found.</p>
        </Card>
      </PageContainer>
    );
  }

  const allAnswered = quiz.questions.every((question) => Boolean(answers[question.questionId]));

  return (
    <PageContainer>
      <form className="stack-lg" onSubmit={handleSubmit}>
        <Card>
          <h1>{quiz.jobTitle}</h1>
          <p className="subtle">Answer all 5 questions to submit your quiz.</p>
        </Card>

        {quiz.questions.map((question) => (
          <QuestionCard
            key={question.questionId}
            question={question}
            selectedAnswer={answers[question.questionId]}
            onSelectAnswer={handleSelectAnswer}
          />
        ))}

        <Button type="submit" loading={submitting} disabled={!allAnswered}>
          Submit Quiz
        </Button>
      </form>
    </PageContainer>
  );
}
