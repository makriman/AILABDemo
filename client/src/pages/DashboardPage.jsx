import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageContainer from '../components/layout/PageContainer';
import { getQuizzes } from '../services/api';
import { formatDate, parseApiError } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import useAuth from '../hooks/useAuth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getQuizzes();
        if (mounted) {
          setQuizzes(data.quizzes || []);
        }
      } catch (error) {
        showToast(parseApiError(error, 'Unable to load dashboard data.'), 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading your dashboard..." />
      </PageContainer>
    );
  }

  const recent = quizzes.slice(0, 3);

  return (
    <PageContainer>
      <section className="stack-lg">
        <div>
          <h1>Welcome back, {user?.username}</h1>
          <p className="subtle">Generate a new quiz from any job description and keep building interview fluency.</p>
        </div>

        <Card clickable onClick={() => navigate('/quiz/new')}>
          <h2>Start a New Quiz</h2>
          <p>Paste a job description and generate five multiple-choice questions.</p>
        </Card>

        <section>
          <div className="list-header">
            <h2>Recent Quizzes</h2>
            <Link to="/history">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              message="You haven't taken any quizzes yet. Paste a job description to get started."
              ctaLabel="Create your first quiz"
              onCta={() => navigate('/quiz/new')}
            />
          ) : (
            <div className="history-list">
              {recent.map((quiz) => (
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
      </section>
    </PageContainer>
  );
}
