import React from 'react';
import '../styles/pages.css';

const Pricing = () => {
  const plans = [
    {
      name: 'Basic',
      price: '$9.99',
      period: '/month',
      features: [
        'Up to 10 documents/month',
        'AI Detection',
        'Plagiarism Check',
        'Basic Reports'
      ]
    },
    {
      name: 'Professional',
      price: '$29.99',
      period: '/month',
      features: [
        'Unlimited documents',
        'AI Detection',
        'Plagiarism Check',
        'Detailed Reports',
        'Priority Support',
        'Priority Processing'
      ],
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited everything',
        'API Access',
        'Custom Integrations',
        'Dedicated Support',
        'Team Management'
      ]
    }
  ];

  return (
    <div className="pricing-page">
      <h1>Simple, Transparent Pricing</h1>
      <p>Choose the plan that fits your needs</p>

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
