interface StepCardProps {
  icon: string;
  title: string;
  desc: string;
}

export const StepCard = ({ icon, title, desc }: StepCardProps) => {
  return (
    <div className="bg-surface shadow-card hover:shadow-modal border-border mb-4 rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-1">
      <div className="text-4xl">{icon}</div>

      <h3 className="text-text mt-3 text-xl font-semibold">{title}</h3>

      <p className="text-text-secondary mt-2 leading-relaxed">{desc}</p>
    </div>
  );
};
