import * as React from 'react';
import './index.css';

interface Props {
  locale?: string;
}

interface RescueStep {
  number: string;
  title: string;
  description: string;
}

const CONTENT = {
  en: {
    title: 'Animal Rescue Guide',
    subtitle: 'How to Help Stray Animals — A Step-by-Step Guide',
    steps: [
      {
        number: '01',
        title: 'Safety First',
        description:
          'Before attempting any rescue, ensure your own safety and that of the animal. Do not corner or chase frightened animals.',
      },
      {
        number: '02',
        title: 'Assess the Situation',
        description:
          'Observe the animal from a safe distance. Check if it is injured, trapped, or in immediate danger. Note its location and condition.',
      },
      {
        number: '03',
        title: 'Approach Carefully',
        description:
          'Move slowly and speak softly. Offer food (water and a small amount of plain food) to build trust. Give the animal space.',
      },
      {
        number: '04',
        title: 'Contain Safely',
        description:
          'Use a humane trap, carrier, or sturdy box with a soft cloth. Never grab an unknown animal directly — use gloves and a towel.',
      },
      {
        number: '05',
        title: 'Transport to Safety',
        description:
          'Keep the animal in a warm, dark, quiet space during transport. Do not feed unless directed by a veterinarian.',
      },
      {
        number: '06',
        title: 'Seek Professional Support',
        description:
          'Contact a local shelter, rescue organization, or veterinarian immediately. Report the rescue through PawHaven.',
      },
    ] as RescueStep[],
    emergencyTitle: 'Emergency Contacts',
    pawhaven: 'PawHaven Hotline',
    localVet: 'Local Veterinarian',
    shelter: 'Animal Shelter',
    emergency: 'Emergency Services',
    disclaimer:
      'This guide is for informational purposes only. Always consult a professional for medical or behavioral concerns.',
  },
  zh: {
    title: '动物救助指南',
    subtitle: '如何帮助流浪动物——分步指南',
    steps: [
      {
        number: '01',
        title: '安全第一',
        description:
          '在尝试任何救助之前，请确保自身和动物的安全。不要逼迫或追逐受惊的动物。',
      },
      {
        number: '02',
        title: '评估情况',
        description:
          '在安全距离外观察动物。检查它是否受伤、被困或处于危险中。记录其位置和状态。',
      },
      {
        number: '03',
        title: '谨慎接近',
        description:
          '缓慢移动并轻声说话。提供食物（水和少量清淡食物）以建立信任。给动物留出空间。',
      },
      {
        number: '04',
        title: '安全控制',
        description:
          '使用人道捕捉笼、运输笼或带有柔软布料的牢固箱子。切勿直接抓取未知动物——请使用手套和毛巾。',
      },
      {
        number: '05',
        title: '安全运送',
        description:
          '运送途中将动物置于温暖、黑暗、安静的空间。除非兽医指示，否则不要喂食。',
      },
      {
        number: '06',
        title: '寻求专业帮助',
        description:
          '立即联系当地收容所、救助组织或兽医。通过PawHaven的"报告流浪动物"功能上报救助信息。',
      },
    ] as RescueStep[],
    emergencyTitle: '紧急联系方式',
    pawhaven: 'PawHaven热线',
    localVet: '当地兽医',
    shelter: '动物收容所',
    emergency: '紧急服务',
    disclaimer: '本指南仅供参考。如有医疗或行为问题，请务必咨询专业人士。',
  },
};

export const RescueGuide: React.FC<Props> = ({ locale = 'en' }) => {
  const c = CONTENT[locale === 'zh' ? 'zh' : 'en'];

  return (
    <div className="rescue-guide">
      <div className="guide-hero">
        <div className="guide-hero-logo">🐾</div>
        <h1 className="guide-hero-title">{c.title}</h1>
        <p className="guide-hero-subtitle">{c.subtitle}</p>
      </div>

      <div className="guide-steps">
        {c.steps.map((step) => (
          <div key={step.number} className="guide-step">
            <div className="guide-step-number">{step.number}</div>
            <div className="guide-step-content">
              <h2 className="guide-step-title">{step.title}</h2>
              <p className="guide-step-description">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="guide-emergency">
        <h3 className="guide-emergency-title">{c.emergencyTitle}</h3>
        <div className="guide-emergency-grid">
          <div className="guide-emergency-item">
            <span className="guide-emergency-label">{c.pawhaven}</span>
            <span className="guide-emergency-value">pawhaven.work</span>
          </div>
          <div className="guide-emergency-item">
            <span className="guide-emergency-label">{c.localVet}</span>
            <span className="guide-emergency-value">—</span>
          </div>
          <div className="guide-emergency-item">
            <span className="guide-emergency-label">{c.shelter}</span>
            <span className="guide-emergency-value">—</span>
          </div>
          <div className="guide-emergency-item">
            <span className="guide-emergency-label">{c.emergency}</span>
            <span className="guide-emergency-value">911</span>
          </div>
        </div>
      </div>

      <div className="guide-disclaimer">
        <p>{c.disclaimer}</p>
      </div>
    </div>
  );
};
