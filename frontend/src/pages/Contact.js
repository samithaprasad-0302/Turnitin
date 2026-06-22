import React from 'react';
import '../styles/pages.css';

const Contact = () => {
  return (
    <div className="contact-page">
      <h1>Contact Us</h1>
      <p>We'd love to hear from you. Send us a message!</p>

      <form className="contact-form">
        <div className="form-group">
          <label>Name</label>
          <input type="text" placeholder="Your name" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="Your email" />
        </div>

        <div className="form-group">
          <label>Subject</label>
          <input type="text" placeholder="Subject" />
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea rows={5} placeholder="Your message"></textarea>
        </div>

        <button type="submit" className="btn btn-primary">Send Message</button>
      </form>
    </div>
  );
};

export default Contact;
