export default function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  minLength,
  maxLength,
}) {
  const count = value.length;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        className={`field-textarea ${error ? 'field-input-error' : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
      />
      <div className="field-meta">
        {error ? <p className="field-error">{error}</p> : <span className="field-caption">Paste plain text.</span>}
        <span className="field-caption">{count}/{maxLength}</span>
      </div>
    </div>
  );
}
