import React from 'react';

interface StepCardProps {
  icon: string;
  title: string;
  desc: string;
}

export const StepCard: React.FC<StepCardProps> = ({ icon, title, desc }) => {
  return (
    <div
      className="
        bg-surface rounded-2xl shadow-card mb-4 p-6
        transition-transform duration-200 hover:-translate-y-1 hover:shadow-modal
        border border-border
      "
    >
      <div className="text-4xl">{icon}</div>

      <h3 className="text-xl font-semibold mt-3 text-text">{title}</h3>

      <p className="text-text-secondary mt-2 leading-relaxed">{desc}</p>
    </div>
  );
};
