interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-white">{value.toLocaleString()}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}
