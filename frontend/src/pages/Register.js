import React from 'react';
import '../styles/auth.css';

const Register = () => {
  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="auth-form" style={{ maxWidth: '440px', width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 10px', color: '#0f172a' }}>Self-Registration Disabled</h2>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', margin: '0 0 30px' }}>
          We have temporarily disabled self-registration on this portal. If you need a new **customer** or **checker** account, please contact your administrator to set up your profile credentials.
        </p>
        <a 
          href="/login" 
          className="btn btn-primary" 
          style={{ 
            display: 'inline-block', 
            width: '100%', 
            padding: '12px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            textDecoration: 'none', 
            boxSizing: 'border-box' 
          }}
        >
          Return to Login
        </a>
      </div>
    </div>
  );
};

export default Register;
