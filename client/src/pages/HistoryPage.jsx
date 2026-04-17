import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageContainer from '../components/layout/PageContainer';
import { useToast } from '../context/ToastContext';
import { getQuizzes } from '../services/api';
import { formatDate, parseApiError } from '../utils/helpers';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const data = await getQuizzes();
        if (mounted) {
          setQuizzes(data.quizzes || []);
        }
      } catch (error) {
        showToast(parseApiError(error, 'Unable to load quiz history.'), 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading quiz history..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section className="stack-lg">
        <h1>Quiz History</h1>
        {quizzes.length === 0 ? (
          <EmptyState
            message="You haven't taken any quizzes yet. Paste a job description to get started."
            ctaLabel="Create quiz"
            onCta={() => navigate('/quiz/new')}
          />
        ) : (
          <div className="history-list">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.quizId}
                clickable
                onClick={() =>
                  navigate(quiz.score === null ? `/quiz/${quiz.quizId}` : `/history/${quiz.quizId}`)
                }
              >
                <div className="history-row">
                  <div>
                    <h3>{quiz.jobTitle}</h3>
                    <p className="field-caption">{formatDate(quiz.createdAt)}</p>
                  </div>
                  <strong>{quiz.score === null ? 'Not submitted' : `${quiz.score}/5`}</strong>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
