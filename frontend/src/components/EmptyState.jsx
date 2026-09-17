export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-4">
          <Icon size={22} className="text-violet-600" />
        </div>
      )}
      <h3 className="font-display font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}