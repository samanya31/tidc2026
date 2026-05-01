import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import bannerImg from '../assets/DN_TIDC.png';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    email: '',
    dob: '',
    city_state: '',
    base_name: '',
    category: '',
    participation_type: '',
    participated_before: '',
    participated_last_year: '',
    winner_last_year: '',
    categories_won: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        categories_won: checked 
          ? [...prev.categories_won, value]
          : prev.categories_won.filter(c => c !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClear = () => {
    setFormData({
      full_name: '',
      mobile_number: '',
      whatsapp_number: '',
      email: '',
      dob: '',
      city_state: '',
      base_name: '',
      category: '',
      participation_type: '',
      participated_before: '',
      participated_last_year: '',
      winner_last_year: '',
      categories_won: []
    });
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: dbError } = await supabase
        .from('tidc_registrations')
        .insert([formData]);

      if (dbError) throw dbError;
      
      setSuccess(true);
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hero-banner">
        <img src={bannerImg} alt="DN.TIDC Banner" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        
        {success && (
          <div className="message-box message-success" style={{ marginTop: '2rem' }}>
            🙏 Thank you! Your registration has been submitted successfully. Hare Krishna!
          </div>
        )}
        
        {error && (
          <div className="message-box message-error" style={{ marginTop: '2rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="section-label">Personal Information</div>

        <div className="field-card">
          <div className="field-label">Full Name <span className="required-dot"></span></div>
          <input className="field-input" type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Enter your full name" required />
        </div>

        <div className="row2">
          <div className="field-card">
            <div className="field-label">Mobile Number <span className="required-dot"></span></div>
            <input className="field-input" type="tel" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} placeholder="+91 00000 00000" required />
          </div>
          <div className="field-card">
            <div className="field-label">WhatsApp Number <span className="required-dot"></span></div>
            <input className="field-input" type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} placeholder="+91 00000 00000" required />
          </div>
        </div>

        <div className="field-card">
          <div className="field-label">Email Address <span className="required-dot"></span></div>
          <input className="field-input" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="yourname@email.com" required />
        </div>

        <div className="row2">
          <div className="field-card">
            <div className="field-label">Date of Birth <span className="required-dot"></span></div>
            <input className="field-input" type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
          </div>
          <div className="field-card">
            <div className="field-label">City / State <span className="required-dot"></span></div>
            <input className="field-input" type="text" name="city_state" value={formData.city_state} onChange={handleInputChange} placeholder="e.g. Delhi, Delhi" required />
          </div>
        </div>

        <div className="section-label">Contest Details</div>

        <div className="field-card">
          <div className="field-label">BACE Name <span className="required-dot"></span></div>
          <select className="field-select" name="base_name" value={formData.base_name} onChange={handleInputChange} required>
            <option value="" disabled>Choose your BACE</option>
            <option>Ayodhya</option><option>Badrinath</option><option>Braj Dham</option>
            <option>Dankaur</option><option>Ekchakra</option><option>Gambhira</option>
            <option>Gaurdham</option><option>Goverdhan</option><option>Govind Dham</option>
            <option>Gurugram</option><option>Indraprastha</option><option>Jagnnathpuri</option>
            <option>Mamgachhi</option><option>Mathura</option><option>Mayapur</option>
            <option>Nadiya</option><option>Shantipur</option><option>Srivas Angan</option>
            <option>Tughlakabad</option><option>Temple</option><option>Other</option>
          </select>
        </div>

        <div className="field-card">
          <div className="field-label">Category <span className="required-dot"></span></div>
          <select className="field-select" name="category" value={formData.category} onChange={handleInputChange} required>
            <option value="" disabled>Choose your category</option>
            <option>Dance</option><option>Bhajan</option><option>Speech</option>
            <option>Sloka Recitation</option><option>Instrument Playing</option>
            <option>Acting</option><option>Poem</option><option>Story Telling</option>
            <option>Painting</option><option>Video Making</option>
          </select>
        </div>

        <div className="field-card">
          <div className="field-label">Participation Type <span className="required-dot"></span></div>
          <div className="radio-row">
            <label className="radio-option"><input type="radio" name="participation_type" value="solo" checked={formData.participation_type === 'solo'} onChange={handleInputChange} required/> Solo</label>
            <label className="radio-option"><input type="radio" name="participation_type" value="group" checked={formData.participation_type === 'group'} onChange={handleInputChange} required/> Group</label>
          </div>
        </div>

        <div className="section-label">Previous Participation</div>

        <div className="field-card">
          <div className="field-label">Have you participated in TIDC before? <span className="required-dot"></span></div>
          <div className="radio-group">
            <label className="radio-option"><input type="radio" name="participated_before" value="two" checked={formData.participated_before === 'two'} onChange={handleInputChange} required/> Yes — two times</label>
            <label className="radio-option"><input type="radio" name="participated_before" value="one" checked={formData.participated_before === 'one'} onChange={handleInputChange} required/> Only one time</label>
            <label className="radio-option"><input type="radio" name="participated_before" value="first" checked={formData.participated_before === 'first'} onChange={handleInputChange} required/> First Time</label>
          </div>
        </div>

        <div className="field-card">
          <div className="field-label">Did you participate last year? <span className="required-dot"></span></div>
          <div className="radio-row">
            <label className="radio-option"><input type="radio" name="participated_last_year" value="yes" checked={formData.participated_last_year === 'yes'} onChange={handleInputChange} required/> Yes</label>
            <label className="radio-option"><input type="radio" name="participated_last_year" value="no" checked={formData.participated_last_year === 'no'} onChange={handleInputChange} required/> No</label>
          </div>

          {formData.participated_last_year === 'yes' && (
            <div className="sub-section">
              <div className="field-label" style={{ marginBottom: '0.35rem' }}>Were you a winner in any category? <span className="required-dot"></span></div>
              <div className="radio-row">
                <label className="radio-option"><input type="radio" name="winner_last_year" value="yes" checked={formData.winner_last_year === 'yes'} onChange={handleInputChange} required/> Yes</label>
                <label className="radio-option"><input type="radio" name="winner_last_year" value="no" checked={formData.winner_last_year === 'no'} onChange={handleInputChange} required/> No</label>
              </div>
              
              {formData.winner_last_year === 'yes' && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="sub-label">Select the category/categories you won (you may select more than one):</div>
                  <div className="checkbox-grid">
                    {['Dance', 'Bhajan', 'Speech', 'Sloka Recitation', 'Instrument Playing', 'Acting', 'Poem', 'Story Telling', 'Painting', 'Video Making'].map(cat => (
                      <label key={cat} className={`check-option ${formData.categories_won.includes(cat) ? 'checked' : ''}`}>
                        <input type="checkbox" name="categories_won" value={cat} checked={formData.categories_won.includes(cat)} onChange={handleInputChange}/> {cat}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="important-note">
          <span className="note-icon">⚠️</span>
          <div className="note-text">
            <strong>Important Note:</strong> If you are shortlisted in two categories, you will be allowed to participate in <strong>only one category</strong> in the final round.
          </div>
        </div>

        <div className="submit-wrap">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : '🙏 Submit Registration'}
          </button>
          <button type="button" className="clear-link" onClick={handleClear}>Clear form</button>
        </div>

        <div className="footer-om">🕉</div>
      </form>
    </>
  );
};

export default RegistrationForm;
