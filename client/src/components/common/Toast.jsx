export default function Toast({ toast, onClose }) {
  return (
    <div className={`toast toast-${toast.type}`}>
      <p>{toast.message}</p>
      <button type="button" className="toast-close" onClick={() => onClose(toast.id)} aria-label="Close toast">
        ×
      </button>
    </div>
  );
}
