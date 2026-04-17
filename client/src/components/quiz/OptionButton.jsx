export default function OptionButton({
  option,
  selected,
  onSelect,
  showResult = false,
  isCorrect = false,
  isIncorrect = false,
}) {
  const classes = [
    'option-button',
    selected ? 'option-selected' : '',
    showResult && isCorrect ? 'option-correct' : '',
    showResult && isIncorrect ? 'option-incorrect' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onSelect}>
      <span className="option-label">{option.label}</span>
      <span>{option.text}</span>
    </button>
  );
}
