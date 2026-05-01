import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import bannerImg from '../assets/DN_TIDC.png';
import { Plus, Minus } from 'lucide-react';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    email: '',
    dob: '',
    city_state: '',
    base_name: '',
    categories: [''],
    participated_before: '',
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

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...formData.categories];
    newCategories[index] = value;
    setFormData(prev => ({ ...prev, categories: newCategories }));
  };

  const addCategory = () => {
    if (formData.categories.length < 3) {
      setFormData(prev => ({ ...prev, categories: [...prev.categories, ''] }));
    }
  };

  const removeCategory = (index: number) => {
    if (formData.categories.length > 1) {
      const newCategories = formData.categories.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, categories: newCategories }));
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
      categories: [''],
      participated_before: '',
      winner_last_year: '',
      categories_won: []
    });
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.categories.some(cat => !cat)) {
      setError('Please select all categories or remove the empty ones.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Prepare data for Supabase
      // We'll join multiple categories into a single string for the 'category' column
      const submissionData = {
        ...formData,
        category: formData.categories.join(', '),
        // We removed participated_last_year from UI, so we can set it based on participated_before
        participated_last_year: (formData.participated_before === 'one' || formData.participated_before === 'two') ? 'yes' : 'no'
      };
      
      // Remove the local 'categories' array before sending to DB
      const { categories, ...dataToInsert } = submissionData;

      const { error: dbError } = await supabase
        .from('tidc_registrations')
        .insert([dataToInsert]);

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

  const categoryOptions = [
    'Dance', 'Bhajan', 'Speech', 'Sloka Recitation', 'Instrument Playing',
    'Acting', 'Poem', 'Story Telling', 'Painting', 'Video Making'
  ];

  return (
    <>
      <div className="hero-banner">
        <img src={bannerImg} alt="DN.TIDC Banner" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        
        {success && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-icon">✅</div>
              <h2>Submission Successful!</h2>
              <p>Thank you! Your registration has been submitted successfully. Hare Krishna!</p>
              <button type="button" className="btn-primary" onClick={() => { setSuccess(false); handleClear(); }} style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                Close
              </button>
            </div>
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
          <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Category <span className="required-dot"></span></span>
            {formData.categories.length < 3 && (
              <button type="button" onClick={addCategory} style={{ background: '#f3e8ff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9333ea' }}>
                <Plus size={18} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {formData.categories.map((cat, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select 
                  className="field-select" 
                  value={cat} 
                  onChange={(e) => handleCategoryChange(index, e.target.value)} 
                  required
                >
                  <option value="" disabled>Choose category {index + 1}</option>
                  {categoryOptions.map(option => (
                    <option key={option} disabled={formData.categories.includes(option) && option !== cat}>
                      {option}
                    </option>
                  ))}
                </select>
                {formData.categories.length > 1 && (
                  <button type="button" onClick={() => removeCategory(index)} style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b21a8', marginTop: '0.75rem', fontStyle: 'italic' }}>
            {formData.categories.length === 1 
              ? 'Note: Tap the + button to participate in more than one category.' 
              : 'Note: You can participate in up to 3 categories.'}
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

          {(formData.participated_before === 'one' || formData.participated_before === 'two') && (
            <div className="sub-section" style={{ borderTop: '1px dashed #e9d5ff', marginTop: '1rem', paddingTop: '1rem' }}>
              <div className="field-label" style={{ marginBottom: '0.35rem' }}>Were you a winner in any category? <span className="required-dot"></span></div>
              <div className="radio-row">
                <label className="radio-option"><input type="radio" name="winner_last_year" value="yes" checked={formData.winner_last_year === 'yes'} onChange={handleInputChange} required/> Yes</label>
                <label className="radio-option"><input type="radio" name="winner_last_year" value="no" checked={formData.winner_last_year === 'no'} onChange={handleInputChange} required/> No</label>
              </div>
              
              {formData.winner_last_year === 'yes' && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="sub-label">Select the category/categories you won:</div>
                  <div className="checkbox-grid">
                    {categoryOptions.map(cat => (
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

        <div className="footer-om" style={{ fontSize: '0.9rem', fontWeight: 500 }}>© 2026 All rights reserved, BACE Delhi</div>
      </form>
    </>
  );
};

export default RegistrationForm;
