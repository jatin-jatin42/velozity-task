type StatCardProps = {
  title: string;
  value: string | number;
  tone?: "default" | "accent" | "warning";
};

export const StatCard = ({ title, value, tone = "default" }: StatCardProps) => (
  <article className={`stat-card stat-card--${tone}`}>
    <p>{title}</p>
    <strong>{value}</strong>
  </article>
);
