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

  const baceOptions = [
    'Ayodhya', 'Badrinath', 'Braj Dham', 'Dankaur', 'Ekchakra', 'Gambhira',
    'Gaurdham', 'Goverdhan', 'Govind Dham', 'Gurugram', 'Indraprastha',
    'Jagnnathpuri', 'Mamgachhi', 'Mathura', 'Mayapur', 'Nadiya', 'Shantipur',
    'Srivas Angan', 'Tughlakabad', 'Temple', 'Other'
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
          <button className="btn-primary" onClick={exportToCSV} disabled={sortedAndFilteredRegistrations.length === 0}>
            <Download size={18} />
            Export Excel
          </button>
          <button className="btn-outline" onClick={fetchRegistrations} disabled={dataLoading}>
            <RefreshCw size={18} className={dataLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button className="btn-outline" onClick={handleLogout} style={{ color: '#e11d48', borderColor: '#e11d48' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default StaffUI;
