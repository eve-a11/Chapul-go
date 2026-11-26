export default function PublicQuickCard({ Icon, title, subtitle, onClick }) {
  return (
    <div className="access-card" onClick={onClick}>
      <div className="card-icon">
        <Icon />
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="card-sub">{subtitle}</p>
    </div>
  );
}