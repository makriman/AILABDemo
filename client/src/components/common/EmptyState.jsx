import Button from './Button';

export default function EmptyState({ message, ctaLabel, onCta }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {ctaLabel ? (
        <Button variant="secondary" onClick={onCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  );
}
