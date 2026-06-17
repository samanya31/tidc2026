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

interface ParsedResult {
  status: string;
  marks?: string;
  scorecard_url?: string;
}

const getParsedResult = (statusStr: string): ParsedResult => {
  try {
    if (statusStr && statusStr.trim().startsWith('{')) {
      return JSON.parse(statusStr);
    }
  } catch (e) {
    console.error("Error parsing status JSON:", e);
  }
  return { status: statusStr || '' };
};

const getDisplayRound = (roundName: string) => {
  if (roundName === 'Round 2') return 'Round 1';
  if (roundName === 'Final Round') return 'Round 2';
  return roundName;
};



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
  const [resultStatus, setResultStatus] = useState('Qualified for Final Round');
  const [customStatus, setCustomStatus] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [scorecardUrl, setScorecardUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Manual add student modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCategory, setNewStudentCategory] = useState('');
  const [newStudentSubcategory, setNewStudentSubcategory] = useState('');
  const [newStudentBace, setNewStudentBace] = useState('');
  const [newStudentMobile, setNewStudentMobile] = useState('');
  const [newStudentWhatsapp, setNewStudentWhatsapp] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [addModalError, setAddModalError] = useState('');
  const [addModalSuccess, setAddModalSuccess] = useState('');
  const [addModalLoading, setAddModalLoading] = useState(false);

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

      const statusValue = (selectedRound === 'Final Round' || marksObtained || scorecardUrl)
        ? JSON.stringify({
            status: resultStatus === 'Custom...' ? customStatus : resultStatus,
            marks: marksObtained,
            scorecard_url: scorecardUrl
          })
        : resultStatus;

      const { error } = await supabase
        .from('tidc_results')
        .insert([
          {
            registration_id: student.id,
            student_name: student.full_name,
            bace: student.base_name,
            category: selectedCategory,
            round: selectedRound,
            status: statusValue
          }
        ]);

      if (error) throw error;

      setUploadSuccess(true);
      setSelectedRegId('');
      setMarksObtained('');
      setScorecardUrl('');
      setCustomStatus('');
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

  const quickPublish = async (regId: number, fullName: string, baseName: string, status: string) => {
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      const alreadyPublished = results.some(
        r => r.registration_id === regId && 
             r.category === selectedCategory && 
             r.round === selectedRound
      );

      if (alreadyPublished) {
        throw new Error('Result already published for this student, category, and round.');
      }

      const statusValue = selectedRound === 'Final Round'
        ? JSON.stringify({
            status: status === 'Qualified' ? 'Qualified for Final Round' : status,
            marks: '',
            scorecard_url: ''
          })
        : status;

      const { error } = await supabase
        .from('tidc_results')
        .insert([{
          registration_id: regId,
          student_name: fullName,
          bace: baseName,
          category: selectedCategory,
          round: selectedRound,
          status: statusValue
        }]);

      if (error) throw error;

      setUploadSuccess(true);
      fetchResults();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to publish result.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentCategory || !newStudentBace) {
      setAddModalError('Please fill in Name, Category and BACE Center.');
      return;
    }

    setAddModalLoading(true);
    setAddModalError('');
    setAddModalSuccess('');

    try {
      // Build category string (e.g. "Acting (Group)" or "Instrument Playing (Mridanga)")
      const categoryString = newStudentSubcategory 
        ? `${newStudentCategory} (${newStudentSubcategory})`
        : newStudentCategory;

      const { error } = await supabase
        .from('tidc_registrations')
        .insert([{
          full_name: newStudentName,
          category: categoryString,
          base_name: newStudentBace,
          mobile_number: newStudentMobile || 'Manual',
          whatsapp_number: newStudentWhatsapp || '',
          email: newStudentEmail || 'manual@example.com',
          dob: null,
          city_state: 'Manual',
          participated_before: 'none',
          winner_last_year: 'no',
          categories_won: [],
          participated_last_year: 'no'
        }]);

      if (error) throw error;

      setAddModalSuccess('Student registered successfully!');
      fetchRegistrations();
      
      // Reset form and close modal after 1.5s
      setTimeout(() => {
        setShowAddModal(false);
        setNewStudentName('');
        setNewStudentCategory('');
        setNewStudentSubcategory('');
        setNewStudentBace('');
        setNewStudentMobile('');
        setNewStudentWhatsapp('');
        setNewStudentEmail('');
        setAddModalSuccess('');
      }, 1500);

    } catch (err: any) {
      setAddModalError(err.message || 'Failed to add student.');
    } finally {
      setAddModalLoading(false);
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

  const getCategoryStudents = () => {
    if (!selectedCategory) return [];
    
    let list = [];
    if (selectedRound === 'Round 2') {
      // Return students who registered for this category
      list = registrations.filter(reg => 
        reg.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    } else {
      // Return students who have been qualified for Round 2 in this category (match by ID or Name)
      const round2Results = results.filter(
        res => res.category === selectedCategory && res.round === 'Round 2'
      );
      const round2StudentIds = round2Results.map(res => res.registration_id).filter(Boolean);
      const round2StudentNames = round2Results.map(res => res.student_name?.toLowerCase()).filter(Boolean);
      
      list = registrations.filter(reg => 
        round2StudentIds.includes(reg.id) || 
        round2StudentNames.includes(reg.full_name?.toLowerCase())
      );
    }

    // Sort alphabetically by full_name
    list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    return list;
  };

  const categoryStudents = getCategoryStudents();

  const getSelectableStudents = () => {
    if (!selectedCategory) return [];
    
    let list = [...registrations];

    if (studentSearchTerm) {
      const search = studentSearchTerm.toLowerCase();
      list = list.filter(reg => 
        reg.full_name?.toLowerCase().includes(search) ||
        reg.id.toString().includes(search) ||
        (reg.base_name && reg.base_name.toLowerCase().includes(search))
      );
    }

    // Sort alphabetically by full_name
    list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    return list;
  };

  const selectableStudents = getSelectableStudents();

  // Group published results into Round 2 vs Final Round
  const round2ResultsList = results.filter(res => {
    const isJson = res.status && res.status.trim().startsWith('{');
    return res.round === 'Round 2' && !isJson;
  });

  const finalResultsList = results.filter(res => {
    const isJson = res.status && res.status.trim().startsWith('{');
    return res.round === 'Final Round' || isJson;
  });

  // Group Round 2 results by category
  const round2ByCategory = round2ResultsList.reduce((acc, current) => {
    const cat = current.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(current);
    return acc;
  }, {} as Record<string, any[]>);

  const round2Categories = Object.keys(round2ByCategory).sort();

  round2Categories.forEach(cat => {
    round2ByCategory[cat].sort((a: any, b: any) => (a.student_name || '').localeCompare(b.student_name || ''));
  });

  // Group Final Round results by category
  const finalByCategory = finalResultsList.reduce((acc, current) => {
    const cat = current.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(current);
    return acc;
  }, {} as Record<string, any[]>);

  const finalCategories = Object.keys(finalByCategory).sort();

  finalCategories.forEach(cat => {
    finalByCategory[cat].sort((a: any, b: any) => (a.student_name || '').localeCompare(b.student_name || ''));
  });

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Form Card */}
          <div className="field-card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                Publish Result
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                ➕ Add Student
              </button>
            </div>
            
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
                    const round = e.target.value as 'Round 2' | 'Final Round';
                    setSelectedRound(round);
                    setResultStatus(round === 'Final Round' ? 'Qualified for Final Round' : 'Qualified');
                    setSelectedRegId('');
                    setStudentSearchTerm('');
                    setUploadError('');
                    setUploadSuccess(false);
                  }}
                  required
                >
                  <option value="Round 2">Round 1</option>
                  <option value="Final Round">Round 2</option>
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
                      : `Select student (${selectableStudents.length} found from Round 1)`
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
                  onChange={(e) => {
                    setResultStatus(e.target.value);
                    if (e.target.value !== 'Custom...') {
                      setCustomStatus('');
                    }
                  }}
                  required
                >
                  <option value="Qualified for Final Round">Qualified for Final Round</option>
                  <option value="Waiting List – 90% Chance to Perform in the Final Round">Waiting List – 90% Chance to Perform in the Final Round</option>
                  <option value="Waiting List – 80% Chance to Perform in the Final Round">Waiting List – 80% Chance to Perform in the Final Round</option>
                  <option value="Prepare for Next TIDC -2027">Prepare for Next TIDC -2027</option>
                  <option value="Qualified">Qualified</option>
                  <option value="1st Place">1st Place</option>
                  <option value="2nd Place">2nd Place</option>
                  <option value="Custom...">Custom...</option>
                </select>
              </div>

              {resultStatus === 'Custom...' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                    Custom Status Text
                  </label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Enter custom status (e.g. Winner, Runner-up)"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Marks Obtained (Optional)
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. 80%"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.5rem' }}>
                  Score Card URL (Optional)
                </label>
                <input
                  type="url"
                  className="field-input"
                  placeholder="e.g. https://drive.google.com/..."
                  value={scorecardUrl}
                  onChange={(e) => setScorecardUrl(e.target.value)}
                />
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

            {/* Stack of Tables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '860px' }}>
              {/* Round 2 Results Table */}
              <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'auto' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#faf5ff', borderBottom: '2px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Published Round 1 Results ({round2ResultsList.length})
                  </h3>
                </div>
                
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '56px' }}>No.</th>
                      <th>Student</th>
                      <th>BACE</th>
                      <th>Round</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsLoading && round2ResultsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b21a8' }}>
                          Loading results...
                        </td>
                      </tr>
                    ) : round2ResultsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b21a8' }}>
                          No Round 1 results published yet.
                        </td>
                      </tr>
                    ) : (
                      round2Categories.map((cat) => (
                        <React.Fragment key={cat}>
                          <tr style={{ background: '#f5f3ff' }}>
                            <td colSpan={6} style={{ fontWeight: 700, color: '#4c1d95', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                              📁 {cat} ({round2ByCategory[cat].length})
                            </td>
                          </tr>
                          {round2ByCategory[cat].map((res: any, idx: number) => (
                            <tr key={res.id}>
                              <td style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: 600 }}>#{idx + 1}</td>
                              <td style={{ fontWeight: 500, paddingLeft: '1.5rem' }}>{res.student_name}</td>
                              <td>{res.bace || 'N/A'}</td>
                              <td>
                                <span className="badge" style={{ background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: 600 }}>{getDisplayRound(res.round)}</span>
                              </td>
                              <td>
                                <span className="badge badge-amber">{res.status}</span>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
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
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Final Round Results Table */}
              <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'auto' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#fffbeb', borderBottom: '2px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#78350f', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Published Round 2 Results ({finalResultsList.length})
                  </h3>
                </div>
                
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '56px' }}>No.</th>
                      <th>Student</th>
                      <th>BACE</th>
                      <th>Round</th>
                      <th>Marks</th>
                      <th>Round 2 Status</th>
                      <th>Score Card</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsLoading && finalResultsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#78350f' }}>
                          Loading results...
                        </td>
                      </tr>
                    ) : finalResultsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#78350f' }}>
                          No Round 2 results published yet.
                        </td>
                      </tr>
                    ) : (
                      finalCategories.map((cat) => (
                        <React.Fragment key={cat}>
                          <tr style={{ background: '#fffbeb' }}>
                            <td colSpan={8} style={{ fontWeight: 700, color: '#78350f', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                              📁 {cat} ({finalByCategory[cat].length})
                            </td>
                          </tr>
                          {finalByCategory[cat].map((res: any, idx: number) => {
                            const parsed = getParsedResult(res.status);
                            return (
                              <tr key={res.id}>
                                <td style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: 600 }}>#{idx + 1}</td>
                                <td style={{ fontWeight: 500, paddingLeft: '1.5rem' }}>{res.student_name}</td>
                                <td>{res.bace || 'N/A'}</td>
                                <td>
                                  <span className="badge" style={{ background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8', fontWeight: 600 }}>{getDisplayRound(res.round)}</span>
                                </td>
                                <td style={{ fontWeight: 600, color: '#4c1d95' }}>{parsed.marks || 'N/A'}</td>
                                <td>
                                  <span className="badge badge-amber">{parsed.status}</span>
                                </td>
                                <td>
                                  {parsed.scorecard_url ? (
                                    <a 
                                      href={parsed.scorecard_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, textDecoration: 'underline' }}
                                    >
                                      Score Card
                                    </a>
                                  ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>N/A</span>
                                  )}
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
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
                            );
                          })}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        {/* Student Candidate Selection Table */}
        {selectedCategory && (
          <div className="field-card" style={{ margin: 0 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Candidates for {selectedCategory} ({getDisplayRound(selectedRound)})</span>
              <span style={{ fontSize: '0.9rem', color: '#6b21a8', fontWeight: 500 }}>
                Total Candidates: {categoryStudents.length}
              </span>
            </h3>

            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th>BACE</th>
                    <th>Status in this Round</th>
                    <th>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b21a8' }}>
                        No candidates found matching this category.
                      </td>
                    </tr>
                  ) : (
                    categoryStudents.map((student) => {
                      const existingResult = results.find(
                        r => r.registration_id === student.id && 
                             r.category === selectedCategory && 
                             r.round === selectedRound
                      );

                      return (
                        <tr key={student.id}>
                          <td style={{ fontWeight: 600 }}>#{student.id}</td>
                          <td style={{ fontWeight: 500 }}>{student.full_name}</td>
                          <td>{student.base_name || 'N/A'}</td>
                          <td>
                            {existingResult ? (
                              (() => {
                                const parsed = getParsedResult(existingResult.status);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span className="badge" style={{ background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: 600, width: 'fit-content' }}>
                                      {parsed.status}
                                    </span>
                                    {parsed.marks && (
                                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4c1d95' }}>
                                        Marks: {parsed.marks}
                                      </span>
                                    )}
                                    {parsed.scorecard_url && (
                                      <a 
                                        href={parsed.scorecard_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, textDecoration: 'underline' }}
                                      >
                                        Score Card
                                      </a>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <span className="badge badge-amber" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                                Pending Selection
                              </span>
                            )}
                          </td>
                          <td>
                            {existingResult ? (
                              <button
                                onClick={() => handleDeleteResult(existingResult.id)}
                                className="btn-danger"
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.8rem',
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Delete Result
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                  onClick={async () => {
                                    await quickPublish(student.id, student.full_name, student.base_name, 'Qualified');
                                  }}
                                  className="btn-success"
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                >
                                  Mark Qualified
                                </button>
                                <button
                                  onClick={async () => {
                                    const status = window.prompt("Enter status (e.g. 1st Place, 2nd Place, etc.):", "1st Place");
                                    if (status) {
                                      await quickPublish(student.id, student.full_name, student.base_name, status);
                                    }
                                  }}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    background: '#f3e8ff',
                                    color: '#6b21a8',
                                    border: '1px solid #e9d5ff',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                >
                                  Custom Status
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
      {/* Manual Add Student Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(59, 7, 100, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="field-card" style={{
            width: '100%',
            maxWidth: '500px',
            margin: 0,
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e9d5ff',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                ➕ Add Physical Participant
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#6b21a8', cursor: 'pointer', fontWeight: 700 }}
              >
                &times;
              </button>
            </div>

            {addModalError && <div className="message-box message-error" style={{ marginBottom: '1rem' }}>⚠️ {addModalError}</div>}
            {addModalSuccess && <div className="message-box message-success" style={{ marginBottom: '1rem' }}>✅ {addModalSuccess}</div>}

            <form onSubmit={handleAddManualStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.25rem' }}>
                  Student Full Name *
                </label>
                <input 
                  type="text" 
                  className="field-input"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.25rem' }}>
                  BACE Center *
                </label>
                <select 
                  className="field-select"
                  value={newStudentBace}
                  onChange={(e) => setNewStudentBace(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose BACE Center</option>
                  {baceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.25rem' }}>
                  Category *
                </label>
                <select 
                  className="field-select"
                  value={newStudentCategory}
                  onChange={(e) => {
                    setNewStudentCategory(e.target.value);
                    setNewStudentSubcategory('');
                  }}
                  required
                >
                  <option value="" disabled>Choose Category</option>
                  {categoryOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Conditional Subcategory Select */}
              {newStudentCategory === 'Acting' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.25rem' }}>
                    Acting Type
                  </label>
                  <select 
                    className="field-select"
                    value={newStudentSubcategory}
                    onChange={(e) => setNewStudentSubcategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Choose Type</option>
                    <option value="Solo">Solo</option>
                    <option value="Group">Group</option>
                  </select>
                </div>
              )}

              {newStudentCategory === 'Instrument Playing' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.25rem' }}>
                    Instrument Type
                  </label>
                  <select 
                    className="field-select"
                    value={newStudentSubcategory}
                    onChange={(e) => setNewStudentSubcategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Choose Instrument</option>
                    <option value="Mridanga">Mridanga</option>
                    <option value="Kartal or Wompher">Kartal or Wompher</option>
                    <option value="Keypad">Keypad</option>
                    <option value="Octapad">Octapad</option>
                    <option value="Flute">Flute</option>
                    <option value="Harmonium">Harmonium</option>
                    <option value="Guitar">Guitar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b21a8', marginBottom: '0.25rem' }}>
                  Mobile Number (Optional)
                </label>
                <input 
                  type="tel" 
                  className="field-input"
                  value={newStudentMobile}
                  onChange={(e) => setNewStudentMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-danger" 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 2, padding: '0.75rem' }}
                  disabled={addModalLoading}
                >
                  {addModalLoading ? 'Saving...' : '💾 Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffUI;
