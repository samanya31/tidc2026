import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, LogOut, Lock, Download } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface Registration {
  id: number;
  created_at: string;
  full_name: string;
  mobile_number: string;
  whatsapp_number?: string;
  email: string;
  dob?: string;
  city_state: string;
  base_name: string;
  category: string;
  participated_before: string;
  participated_last_year: string;
  winner_last_year: string;
  categories_won: string[];
}

const StaffUI = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [participationFilter, setParticipationFilter] = useState('all');
  const [baceFilter, setBaceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [dataError, setDataError] = useState('');

  const [activeTab, setActiveTab] = useState<'registrations' | 'results' | 'settings'>('registrations');
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Results form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRound, setSelectedRound] = useState<'Round 2' | 'Final Round'>('Round 2');
  const [selectedRegId, setSelectedRegId] = useState('');
  const [resultStatus, setResultStatus] = useState('Qualified');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Settings state
  const [settingsDeadline, setSettingsDeadline] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const categoryOptions = [
    'Dance', 'Bhajan', 'Speech', 'Sloka Recitation', 'Instrument Playing',
    'Acting', 'Poem', 'Story Telling', 'Painting', 'Video Making'
  ];

  const baceOptions = [
    'Ayodhya', 'Badrinath', 'Braj Dham', 'Dankaur', 'Ekchakra', 'Gambhira',
    'Gaurdham', 'Goverdhan', 'Govind Dham', 'Gurugram', 'Indraprastha',
    'Jagnnathpuri', 'Mamgachhi', 'Mathura', 'Mayapur', 'Nadiya', 'Shantipur',
    'Srivas Angan', 'Tughlakabad', 'Temple', 'Rajvidya', 'Other'
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchRegistrations();
      fetchResults();
      fetchSettings();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchRegistrations = async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const { data, error } = await supabase
        .from('tidc_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      setDataError(err.message || 'Failed to fetch registrations');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tidc_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setResultsLoading(false);
    }
  };

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedRegId) {
      setUploadError('Please select both a category and a student.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const student = registrations.find(r => r.id === Number(selectedRegId));
      if (!student) throw new Error('Selected student not found.');

      // Check if student already has this result category and round
      const alreadyPublished = results.some(
        r => r.registration_id === student.id && r.category === selectedCategory && r.round === selectedRound
      );
      if (alreadyPublished) {
        throw new Error(`${student.full_name} is already qualified/marked for category "${selectedCategory}" in ${selectedRound}.`);
      }

      const { error } = await supabase
        .from('tidc_results')
        .insert([
          {
            registration_id: student.id,
            student_name: student.full_name,
            bace: student.base_name,
            category: selectedCategory,
            round: selectedRound,
            status: resultStatus
          }
        ]);

      if (error) throw error;

      setUploadSuccess(true);
      setSelectedRegId('');
      fetchResults();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to publish result.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteResult = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    try {
      const { error } = await supabase
        .from('tidc_results')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchResults();
    } catch (err: any) {
      alert(err.message || 'Failed to delete result.');
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tidc_settings')
        .select('value')
        .eq('key', 'registration_deadline')
        .single();
      if (error) throw error;
      if (data && data.value) {
        const formatted = data.value.substring(0, 16);
        setSettingsDeadline(formatted);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    setSettingsError('');
    try {
      const valueToSave = settingsDeadline.includes(':') && settingsDeadline.split(':').length === 2
        ? `${settingsDeadline}:00`
        : settingsDeadline;

      const { error } = await supabase
        .from('tidc_settings')
        .upsert({ key: 'registration_deadline', value: valueToSave }, { onConflict: 'key' });
      if (error) throw error;
      setSettingsSuccess(true);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const getSelectableStudents = () => {
    if (!selectedCategory) return [];
    
    let list = [];
    if (selectedRound === 'Round 2') {
      // Return students who registered for this category
      list = registrations.filter(reg => 
        reg.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    } else {
      // Return students who have been qualified for Round 2 in this category
      const round2StudentIds = results
        .filter(res => res.category === selectedCategory && res.round === 'Round 2')
        .map(res => res.registration_id);
      
      // Get the registration details for these students
      list = registrations.filter(reg => round2StudentIds.includes(reg.id));
    }

    if (studentSearchTerm) {
      const search = studentSearchTerm.toLowerCase();
      list = list.filter(reg => 
        reg.full_name?.toLowerCase().includes(search) ||
        reg.id.toString().includes(search) ||
        (reg.base_name && reg.base_name.toLowerCase().includes(search))
      );
    }

    return list;
  };

  const selectableStudents = getSelectableStudents();

  const sortedAndFilteredRegistrations = registrations
    .filter(reg => {
      const matchesSearch = reg.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            reg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            reg.mobile_number?.includes(searchTerm);
      
      const matchesParticipation = participationFilter === 'all' || 
                                   (participationFilter === 'yes' && reg.participated_last_year === 'yes') ||
                                   (participationFilter === 'no' && reg.participated_last_year !== 'yes');
      
      const matchesBace = baceFilter === 'all' || reg.base_name === baceFilter;
                            
      return matchesSearch && matchesParticipation && matchesBace;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'bace') {
        return (a.base_name || '').localeCompare(b.base_name || '');
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      if (sortBy === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }
      return 0;
    });

  const exportToCSV = () => {
    if (sortedAndFilteredRegistrations.length === 0) return;
    
    // Create headers
    const headers = ['ID', 'Date', 'Full Name', 'Mobile Number', 'WhatsApp', 'Email', 'DOB', 'City/State', 'BACE', 'Category', 'Participated Before', 'Participated Last Year', 'Winner Last Year', 'Categories Won'];
    
    // Create rows
    const rows = sortedAndFilteredRegistrations.map(reg => [
      reg.id,
      new Date(reg.created_at).toLocaleDateString(),
      `"${reg.full_name || ''}"`,
      `"${reg.mobile_number || ''}"`,
      `"${reg.whatsapp_number || ''}"`,
      `"${reg.email || ''}"`,
      reg.dob || '',
      `"${reg.city_state || ''}"`,
      `"${reg.base_name || ''}"`,
      `"${reg.category || ''}"`,
      reg.participated_before || '',
      reg.participated_last_year || '',
      reg.winner_last_year || '',
      `"${(reg.categories_won || []).join(', ')}"`
    ]);
    
    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TIDC_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b21a8' }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <Lock size={24} color="#9333ea" />
            </div>
            <h2>Staff Login</h2>
            <p>Enter your credentials to access the dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            {authError && <div className="message-box message-error">{authError}</div>}
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="staff@tidc.com"
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            
            <button type="submit" className="btn-primary login-btn" disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">TIDC 2026 Staff Dashboard</h1>
        <div className="dashboard-actions">
          {activeTab === 'registrations' && (
            <button className="btn-primary" onClick={exportToCSV} disabled={sortedAndFilteredRegistrations.length === 0}>
              <Download size={18} />
              Export Excel
            </button>
          )}
          <button 
            className="btn-outline" 
            onClick={
              activeTab === 'registrations' 
                ? fetchRegistrations 
                : activeTab === 'results' 
                ? fetchResults 
                : fetchSettings
            } 
            disabled={
              activeTab === 'registrations' 
                ? dataLoading 
                : activeTab === 'results' 
                ? resultsLoading 
                : settingsLoading
            }
          >
            <RefreshCw 
              size={18} 
              className={
                (activeTab === 'registrations' 
                  ? dataLoading 
                  : activeTab === 'results' 
                  ? resultsLoading 
                  : settingsLoading) 
                  ? "animate-spin" 
                  : ""
              } 
            />
            Refresh
          </button>
          <button className="btn-outline" onClick={handleLogout} style={{ color: '#e11d48', borderColor: '#e11d48' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #e9d5ff', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setActiveTab('registrations');
            setUploadSuccess(false);
            setUploadError('');
            setSettingsSuccess(false);
            setSettingsError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0.5rem',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: activeTab === 'registrations' ? '#9333ea' : '#6b21a8',
            borderBottom: activeTab === 'registrations' ? '3px solid #9333ea' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          📋 Registrations ({registrations.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('results');
            setUploadSuccess(false);
            setUploadError('');
            setSettingsSuccess(false);
            setSettingsError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0.5rem',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: activeTab === 'results' ? '#9333ea' : '#6b21a8',
            borderBottom: activeTab === 'results' ? '3px solid #9333ea' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          🏆 Manage Results ({results.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('settings');
            setUploadSuccess(false);
            setUploadError('');
            setSettingsSuccess(false);
            setSettingsError('');
            fetchSettings();
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0.5rem',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: activeTab === 'settings' ? '#9333ea' : '#6b21a8',
            borderBottom: activeTab === 'settings' ? '3px solid #9333ea' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {activeTab === 'registrations' && (
        <>
          {dataError && (
            <div className="message-box message-error">
              ⚠️ {dataError}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ fontSize: '0.85rem', color: '#6b21a8', fontWeight: 600, marginBottom: '0.5rem' }}>Search:</div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e9d5ff', boxShadow: '0 2px 10px rgba(147,51,234,0.05)' }}>
                <Search size={20} color="#9333ea" style={{ marginRight: '0.5rem' }} />
                <input 
                  type="text" 
                  placeholder="Name, email, phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'Poppins', fontSize: '0.95rem' }}
                />
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b21a8', fontWeight: 600, marginBottom: '0.5rem' }}>BACE:</div>
              <select 
                value={baceFilter} 
                onChange={(e) => setBaceFilter(e.target.value)}
                style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e9d5ff', fontFamily: 'Poppins', color: '#3b0764', outline: 'none', minWidth: '160px' }}
              >
                <option value="all">All BACEs</option>
                {baceOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b21a8', fontWeight: 600, marginBottom: '0.5rem' }}>Filter:</div>
              <select 
                value={participationFilter} 
                onChange={(e) => setParticipationFilter(e.target.value)}
                style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e9d5ff', fontFamily: 'Poppins', color: '#3b0764', outline: 'none', minWidth: '160px' }}
              >
                <option value="all">All Participants</option>
                <option value="yes">Participated Last Year</option>
                <option value="no">New This Year</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b21a8', fontWeight: 600, marginBottom: '0.5rem' }}>Sort By:</div>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e9d5ff', fontFamily: 'Poppins', color: '#3b0764', outline: 'none', minWidth: '160px' }}
              >
                <option value="newest">Newest First</option>
                <option value="bace">BACE (A-Z)</option>
                <option value="category">Category (A-Z)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Full Name</th>
                  <th>Contact</th>
                  <th>BACE</th>
                  <th>Category (Type)</th>
                  <th>History</th>
                </tr>
              </thead>
              <tbody>
                {dataLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b21a8' }}>
                      Loading registrations...
                    </td>
                  </tr>
                ) : sortedAndFilteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b21a8' }}>
                      No registrations found.
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>#{reg.id}</td>
                      <td>{new Date(reg.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{reg.full_name}</td>
                      <td>
                        <div>{reg.mobile_number}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b21a8' }}>{reg.email}</div>
                      </td>
                      <td>{reg.base_name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(reg.category || '').split(', ').map((cat, i) => (
                            <span key={i} className="badge badge-purple">{cat}</span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.85rem' }}>{reg.participated_before === 'first' ? 'First Time' : 'Returning'}</span>
                          {reg.winner_last_year === 'yes' && (
                            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                              🏆 Winner: {(reg.categories_won || []).join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'results' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Form Card */}
          <div className="field-card" style={{ margin: 0 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '0.75rem' }}>
              Publish Result
            </h3>
            
            {uploadError && <div className="message-box message-error" style={{ marginBottom: '1.25rem' }}>⚠️ {uploadError}</div>}
            {uploadSuccess && <div className="message-box message-success" style={{ marginBottom: '1.25rem' }}>✅ Result published successfully!</div>}
            
            <form onSubmit={handlePublishResult} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Select Category
                </label>
                <select
                  className="field-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedRegId('');
                    setStudentSearchTerm('');
                    setUploadError('');
                    setUploadSuccess(false);
                  }}
                  required
                >
                  <option value="" disabled>Choose Category</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Select Round
                </label>
                <select
                  className="field-select"
                  value={selectedRound}
                  onChange={(e) => {
                    setSelectedRound(e.target.value as 'Round 2' | 'Final Round');
                    setSelectedRegId('');
                    setStudentSearchTerm('');
                    setUploadError('');
                    setUploadSuccess(false);
                  }}
                  required
                >
                  <option value="Round 2">Round 2</option>
                  <option value="Final Round">Final Round</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Filter Student List by Name/ID
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Type name or ID to filter selection..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  style={{ marginBottom: '0.75rem', height: '36px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Select Qualified Student
                </label>
                <select
                  className="field-select"
                  value={selectedRegId}
                  onChange={(e) => {
                    setSelectedRegId(e.target.value);
                    setUploadError('');
                    setUploadSuccess(false);
                  }}
                  disabled={!selectedCategory}
                  required
                >
                  <option value="" disabled>
                    {!selectedCategory 
                      ? 'Choose category first' 
                      : selectedRound === 'Round 2'
                      ? `Select student (${selectableStudents.length} found)`
                      : `Select student (${selectableStudents.length} found from Round 2)`
                    }
                  </option>
                  {selectableStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.base_name}) - ID: #{student.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Result Status
                </label>
                <select
                  className="field-select"
                  value={resultStatus}
                  onChange={(e) => setResultStatus(e.target.value)}
                  required
                >
                  <option value="Qualified">Qualified</option>
                  <option value="Winner (1st Place)">Winner (1st Place)</option>
                  <option value="Runner Up (2nd Place)">Runner Up (2nd Place)</option>
                  <option value="Special Mention">Special Mention</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontWeight: 600, marginTop: '0.5rem' }}
                disabled={uploadLoading || !selectedCategory || !selectedRegId}
              >
                {uploadLoading ? 'Publishing...' : '🚀 Publish Result'}
              </button>
            </form>
          </div>

          {/* Results List */}
          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#faf5ff', borderBottom: '2px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Published Results ({results.length})
              </h3>
            </div>
            
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>BACE</th>
                  <th>Round</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resultsLoading && results.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b21a8' }}>
                      Loading results...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b21a8' }}>
                      No results published yet.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 500 }}>{res.student_name}</td>
                      <td>{res.bace || 'N/A'}</td>
                      <td>
                        <span className="badge" style={{ background: res.round === 'Final Round' ? '#fdf2f8' : '#faf5ff', color: res.round === 'Final Round' ? '#db2777' : '#6b21a8', border: res.round === 'Final Round' ? '1px solid #fbcfe8' : '1px solid #e9d5ff', fontWeight: 600 }}>{res.round}</span>
                      </td>
                      <td>
                        <span className="badge badge-amber">{res.status}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteResult(res.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e11d48',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            padding: 0
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="field-card" style={{ margin: 0 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '0.75rem' }}>
              ⚙️ Contest Settings
            </h3>
            
            {settingsError && <div className="message-box message-error" style={{ marginBottom: '1.25rem' }}>⚠️ {settingsError}</div>}
            {settingsSuccess && <div className="message-box message-success" style={{ marginBottom: '1.25rem' }}>✅ Settings updated successfully!</div>}
            
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Registration Deadline Date & Time <span className="required-dot"></span>
                </label>
                <input 
                  className="field-input" 
                  type="datetime-local" 
                  value={settingsDeadline} 
                  onChange={(e) => {
                    setSettingsDeadline(e.target.value);
                    setSettingsSuccess(false);
                    setSettingsError('');
                  }}
                  required 
                />
                <div style={{ fontSize: '0.75rem', color: '#6b21a8', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Set the date and time when the registration form will automatically close and display results.
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', fontWeight: 600, marginTop: '0.5rem' }}
                disabled={settingsLoading || !settingsDeadline}
              >
                {settingsLoading ? 'Saving Settings...' : '💾 Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffUI;
