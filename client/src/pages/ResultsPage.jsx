import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QuizResultsView from '../components/quiz/QuizResultsView';
import PageContainer from '../components/layout/PageContainer';
import { useToast } from '../context/ToastContext';
import { getQuiz } from '../services/api';
import { parseApiError } from '../utils/helpers';

export default function ResultsPage() {
  const { quizId } = useParams();
  const { showToast } = useToast();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      try {
        const data = await getQuiz(quizId);
        if (mounted) {
          setQuiz(data);
        }
      } catch (error) {
        showToast(parseApiError(error, 'Unable to load results.'), 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      mounted = false;
    };
  }, [quizId, showToast]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading results..." />
      </PageContainer>
    );
  }

  if (!quiz) {
    return (
      <PageContainer>
        <Card>
          <p>Unable to load this result.</p>
        </Card>
      </PageContainer>
    );
  }

  if (!quiz.result) {
    return (
      <PageContainer>
        <Card>
          <h1>Quiz not submitted yet</h1>
          <p>Submit your quiz first to see explanations and score.</p>
          <Link to={`/quiz/${quizId}`}>Go to quiz</Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QuizResultsView quiz={quiz} />
    </PageContainer>
  );
}
