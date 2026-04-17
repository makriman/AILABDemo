import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QuizResultsView from '../components/quiz/QuizResultsView';
import PageContainer from '../components/layout/PageContainer';
import { useToast } from '../context/ToastContext';
import { getQuiz } from '../services/api';
import { parseApiError } from '../utils/helpers';

export default function PastQuizPage() {
  const { quizId } = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadQuiz() {
      try {
        const data = await getQuiz(quizId);
        if (mounted) {
          setQuiz(data);
        }
      } catch (error) {
        showToast(parseApiError(error, 'Unable to load past quiz.'), 'error');
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
  }, [quizId, showToast]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading past quiz..." />
      </PageContainer>
    );
  }

  if (!quiz || !quiz.result) {
    return (
      <PageContainer>
        <Card>
          <h1>No result available</h1>
          <p>This quiz has not been submitted yet.</p>
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
