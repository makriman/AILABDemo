import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/reset-password');

      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        const currentPath = window.location.pathname;
        if (!['/login', '/signup', '/reset-password'].includes(currentPath)) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function fetchResetQuestion(username) {
  const { data } = await api.post('/auth/reset-password/question', { username });
  return data;
}

export async function verifyResetPassword(payload) {
  const { data } = await api.post('/auth/reset-password/verify', payload);
  return data;
}

export async function createQuiz(jobDescription) {
  const { data } = await api.post('/quizzes', { jobDescription });
  return data;
}

export async function getQuizzes() {
  const { data } = await api.get('/quizzes');
  return data;
}

export async function getQuiz(quizId) {
  const { data } = await api.get(`/quizzes/${quizId}`);
  return data;
}

export async function submitQuiz(quizId, answers) {
  const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers });
  return data;
}

export default api;
