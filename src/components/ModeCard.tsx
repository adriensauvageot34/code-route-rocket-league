type ModeCardProps = {
  title: string;
  description: string;
  status: string;
};

export function ModeCard({ title, description, status }: ModeCardProps) {
  return (
    <article className="mode-card">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="mode-status">{status}</span>
    </article>
  );
}
