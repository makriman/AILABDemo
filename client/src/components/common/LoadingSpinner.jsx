export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-wrap">
      <span className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
