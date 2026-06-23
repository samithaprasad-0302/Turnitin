import React from 'react';
import '../styles/pages.css';

const Pricing = () => {
  const plans = [
    {
      name: 'Single Credit',
      price: '450 LKR',
      period: '/check',
      features: [
        '1 check credit',
        'Similarity + AI detection',
        'Two PDF reports per scan',
        '7-day pack validity'
      ]
    },
    {
      name: 'Starter Pack',
      price: '4,000 LKR',
      period: '/10 checks',
      features: [
        '10 check credits (400 LKR/check)',
        'Similarity + AI detection',
        'Two PDF reports per scan',
        '7-day pack validity'
      ],
      featured: true
    }
  ];

  return (
    <div className="pricing-page">
      <div className="section-header">
        <span className="section-tag">Pricing Plans</span>
        <h2>Flexible Checking Credits</h2>
        <p>Purchase credits in LKR. No monthly subscriptions, no automated deductions. Billed once, valid for 7 days.</p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
            <h3>{plan.name}</h3>
            <div className="price">
              {plan.price}
              <span className="period">{plan.period}</span>
            </div>
            <ul className="features">
              {plan.features.map((feature, i) => (
                <li key={i}>✓ {feature}</li>
              ))}
            </ul>
            <button className="btn btn-primary btn-full">Choose Plan</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
