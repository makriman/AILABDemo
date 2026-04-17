export default function ScoreBadge({ score, total = 5 }) {
  return <span className="score-badge">{score}/{total}</span>;
}
