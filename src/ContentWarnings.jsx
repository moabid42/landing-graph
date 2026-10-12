export default function ContentWarnings({ problems }) {
  if (problems.length === 0) return null
  return (
    <div className="tl-problems" role="alert">
      <strong>⚠ content warnings — some entries may be missing below</strong>
      <ul>
        {problems.map((p, i) => (
          <li key={i}>
            <code>{p.file}</code> · {p.title}: {p.msg}
          </li>
        ))}
      </ul>
    </div>
  )
}
