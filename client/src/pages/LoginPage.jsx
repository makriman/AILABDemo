import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import Card from '../components/common/Card';
import PageContainer from '../components/layout/PageContainer';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../utils/helpers';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [values, setValues] = useState({ username: '', password: '' });
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
    if (!values.username.trim()) {
      nextErrors.username = 'Username is required.';
    }
    if (!values.password) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await login(values);
      showToast('Welcome back.', 'success');
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      showToast(parseApiError(error, 'Incorrect username or password.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <Card>
        <h1>Log in</h1>
        <p className="subtle">Continue your interview prep.</p>
        <LoginForm
          values={values}
          errors={errors}
          loading={loading}
          onChange={setField}
          onSubmit={handleSubmit}
        />
        <div className="auth-links">
          <Link to="/reset-password">Forgot password?</Link>
          <Link to="/signup">Need an account?</Link>
        </div>
      </Card>
    </PageContainer>
  );
}
