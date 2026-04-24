import { createContext, useContext, useMemo, useState } from 'react';

const QuizSessionContext = createContext(null);

export function QuizSessionProvider({ children }) {
  const [quiz, setQuiz] = useState(null);
  const [attemptToken, setAttemptToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResultState] = useState(null);

  const value = useMemo(
    () => ({
      quiz,
      attemptToken,
      expiresAt,
      answers,
      result,
      startSession(payload) {
        setQuiz(payload.quiz);
        setAttemptToken(payload.attemptToken);
        setExpiresAt(payload.expiresAt);
        setAnswers({});
        setResultState(null);
      },
      setAnswer(questionId, answer) {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: answer,
        }));
      },
      setResult(nextResult) {
        setResultState(nextResult);
        setAttemptToken(null);
      },
      clearSession() {
        setQuiz(null);
        setAttemptToken(null);
        setExpiresAt(null);
        setAnswers({});
        setResultState(null);
      },
    }),
    [answers, attemptToken, expiresAt, quiz, result]
  );

  return <QuizSessionContext.Provider value={value}>{children}</QuizSessionContext.Provider>;
}

export function useQuizSession() {
  const context = useContext(QuizSessionContext);

  if (!context) {
    throw new Error('useQuizSession must be used within QuizSessionProvider.');
  }

  return context;
}
