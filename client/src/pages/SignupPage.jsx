import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import SignupForm from '../components/auth/SignupForm';
import Card from '../components/common/Card';
import PageContainer from '../components/layout/PageContainer';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { parseApiError, validateUsername } from '../utils/helpers';

export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { signup, isAuthenticated, loading: authLoading } = useAuth();

  const [values, setValues] = useState({
    username: '',
    password: '',
    securityQuestion: '',
    securityAnswer: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!validateUsername(values.username)) {
      nextErrors.username = 'Use 3-30 letters, numbers, or underscores.';
    }
    if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (!values.securityQuestion.trim()) {
      nextErrors.securityQuestion = 'Security question is required.';
    }
    if (!values.securityAnswer.trim()) {
      nextErrors.securityAnswer = 'Security answer is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await signup(values);
      showToast('Account created successfully.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      showToast(parseApiError(error, 'Unable to create account.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <Card>
        <h1>Create account</h1>
        <p className="subtle">Save quizzes, track your progress, and revisit explanations.</p>
        <SignupForm
          values={values}
          errors={errors}
          loading={loading}
          onChange={setField}
          onSubmit={handleSubmit}
        />
        <div className="auth-links">
          <Link to="/login">Already have an account?</Link>
        </div>
      </Card>
    </PageContainer>
  );
}
