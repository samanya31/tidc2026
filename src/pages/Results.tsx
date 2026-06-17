import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../assets/DN_TIDC.png';
import { ArrowLeft, Search, Trophy, Medal, Folder, X } from 'lucide-react';

interface Result {
  id: number;
  student_name: string;
  bace: string;
  category: string;
  round: string;
  status: string;
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

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'round2' | 'final'>('round2');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tidc_results')
        .select('*')
        .order('category', { ascending: true })
        .order('student_name', { ascending: true });

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search term
  const filteredResults = results.filter(res =>
    res.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (res.bace && res.bace.toLowerCase().includes(searchTerm.toLowerCase())) ||
    res.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter by active tab
  const tabResults = filteredResults.filter(res => {
    const isJsonStatus = res.status && res.status.trim().startsWith('{');
    if (activeTab === 'final') {
      return res.round === 'Final Round' || isJsonStatus;
    } else {
      return res.round === 'Round 2' && !isJsonStatus;
    }
  });

  // Group by category
  const groupedByCategory = tabResults.reduce((acc, current) => {
    if (!acc[current.category]) acc[current.category] = [];
    acc[current.category].push(current);
    return acc;
  }, {} as Record<string, Result[]>);

  const categories = Object.keys(groupedByCategory);

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.85rem 1.5rem',
    border: 'none',
    background: isActive ? '#fff' : 'transparent',
    color: isActive ? '#7c3aed' : '#6b21a8',
    fontFamily: 'Poppins, sans-serif',
    fontSize: '0.95rem',
    fontWeight: isActive ? 700 : 500,
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: isActive ? '0 4px 16px rgba(147,51,234,0.15)' : 'none',
  });

  return (
    <>
      {/* Full-page background image with faded overlay */}
      <div className="results-bg">
        <img src={bannerImg} alt="DN.TIDC Background" />
        <div className="results-bg-overlay" />
      </div>

      <div className="form-body results-content" style={{ marginTop: '2rem', maxWidth: '1100px', position: 'relative', zIndex: 1 }}>
        <button 
          onClick={() => navigate('/')} 
          style={{
            background: 'none',
            border: 'none',
            color: '#9333ea',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            padding: 0
          }}
        >
          <ArrowLeft size={18} /> Back to Home
        </button>

        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🏆</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '2.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            TIDC 2026 Results
          </h1>
          <p style={{ color: '#6b21a8', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Congratulations to all the qualified students and winners of the Talent Identification & Development Competition 2026!
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: '#f3e8ff',
          borderRadius: '16px',
          padding: '0.35rem',
          maxWidth: '500px',
          margin: '0 auto 2rem',
          border: '1px solid #e9d5ff',
        }}>
          <button style={tabStyle(activeTab === 'round2')} onClick={() => { setActiveTab('round2'); setSelectedCategory(null); }}>
            <Medal size={18} /> Round 2
          </button>
          <button style={tabStyle(activeTab === 'final')} onClick={() => { setActiveTab('final'); setSelectedCategory(null); }}>
            <Trophy size={18} /> Final Round
          </button>
        </div>

        {/* Search Bar Card */}
        <div className="field-card" style={{ maxWidth: '600px', margin: '0 auto 2.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#faf5ff', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
            <Search size={18} color="#9333ea" style={{ marginRight: '0.75rem' }} />
            <input 
              type="text" 
              placeholder="Search by student name or BACE..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontFamily: 'Poppins', fontSize: '0.95rem', color: '#3b0764' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="field-card" style={{ textAlign: 'center', padding: '4rem 0', color: '#9333ea', fontWeight: 600 }}>
            Loading results...
          </div>
        ) : results.length === 0 ? (
          <div className="field-card" style={{ textAlign: 'center', padding: '4rem 0', color: '#6b21a8', fontSize: '1rem', fontStyle: 'italic' }}>
            No results have been announced yet. Please check back later!
          </div>
        ) : categories.length === 0 ? (
          <div className="field-card" style={{ textAlign: 'center', padding: '4rem 0', color: '#6b21a8', fontSize: '1rem', fontStyle: 'italic' }}>
            {searchTerm ? 'No results match your search term.' : `No ${activeTab === 'final' ? 'Final Round' : 'Round 2'} results have been announced yet.`}
          </div>
        ) : (
          <>
            {/* Category selection grid */}
            <div className="category-card-grid">
              {categories.map(category => (
                <div 
                  key={category} 
                  className="category-card"
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="category-card-icon">
                    <Folder size={22} />
                  </div>
                  <div className="category-card-info">
                    <span className="category-card-title">{category}</span>
                    <span className="category-card-count">
                      {groupedByCategory[category].length} {activeTab === 'final' ? 'Results' : 'Qualifiers'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Overlay containing results */}
            {selectedCategory && (
              <div className="results-modal-overlay" onClick={() => setSelectedCategory(null)}>
                <div className="results-modal-content" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close-btn" 
                    onClick={() => setSelectedCategory(null)}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>

                  <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '2px solid #e9d5ff', paddingBottom: '0.5rem', paddingRight: '2rem' }}>
                    {selectedCategory}
                  </h2>

                  <h3 style={{
                    fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: activeTab === 'final' ? '#b45309' : '#6b21a8',
                  }}>
                    {activeTab === 'final' ? <Trophy size={18} color="#d97706" /> : <Medal size={18} color="#9333ea" />}
                    {activeTab === 'final' ? 'Final Round Results' : 'Round 2 Qualifiers'} ({groupedByCategory[selectedCategory]?.length || 0})
                  </h3>

                  {groupedByCategory[selectedCategory] && (
                    <>
                      {/* Desktop view: Table */}
                      <div className="desktop-only-table">
                        <div className="table-container" style={{
                          overflowX: 'auto', width: '100%',
                          border: activeTab === 'final' ? '1px solid #fef3c7' : undefined,
                        }}>
                          <table className="data-table" style={{ width: '100%', tableLayout: 'auto' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.75rem 1rem' }}>Student</th>
                                <th style={{ padding: '0.75rem 1rem' }}>BACE</th>
                                {activeTab === 'final' ? (
                                  <>
                                    <th style={{ padding: '0.75rem 1rem' }}>Marks Obtained</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Final Round Status</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Score Card</th>
                                  </>
                                ) : (
                                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {groupedByCategory[selectedCategory].map(res => {
                                const parsed = getParsedResult(res.status);
                                return (
                                  <tr key={res.id} style={{ background: activeTab === 'final' ? '#fffbeb' : undefined }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: activeTab === 'final' ? '#78350f' : '#1e1b4b' }}>{res.student_name}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>{res.bace || 'N/A'}</td>
                                    {activeTab === 'final' ? (
                                      <>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4c1d95' }}>{parsed.marks || 'N/A'}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                          <span className="badge badge-amber" style={{ border: '1px solid #fde68a' }}>{parsed.status}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                          {parsed.scorecard_url ? (
                                            <a 
                                              href={parsed.scorecard_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="badge" 
                                              style={{ 
                                                background: '#ecfdf5', 
                                                color: '#047857', 
                                                border: '1px solid #a7f3d0', 
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                              }}
                                            >
                                              View Score Card
                                            </a>
                                          ) : (
                                            <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>Coming Soon</span>
                                          )}
                                        </td>
                                      </>
                                    ) : (
                                      <td style={{ padding: '0.75rem 1rem' }}>
                                        <span className="badge" style={{ background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: 600 }}>{parsed.status}</span>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile view: Cards */}
                      <div className="mobile-only-cards">
                        {groupedByCategory[selectedCategory].map(res => {
                          const parsed = getParsedResult(res.status);
                          const isFinal = activeTab === 'final';
                          return (
                            <div 
                              key={res.id} 
                              className={`result-mobile-card ${isFinal ? 'final-round-card' : ''}`}
                            >
                              <div className="result-mobile-card-header">
                                <span className="result-mobile-card-name">{res.student_name}</span>
                                <span className="result-mobile-card-bace">{res.bace || 'N/A'}</span>
                              </div>
                              
                              {isFinal ? (
                                <>
                                  <div className="result-mobile-card-row final-round-row">
                                    <span className="result-mobile-card-label">Marks Obtained:</span>
                                    <span className="result-mobile-card-value" style={{ color: '#4c1d95' }}>{parsed.marks || 'N/A'}</span>
                                  </div>
                                  <div className="result-mobile-card-row final-round-row">
                                    <span className="result-mobile-card-label">Final Status:</span>
                                    <span className="badge badge-amber" style={{ border: '1px solid #fde68a' }}>{parsed.status}</span>
                                  </div>
                                  <div className="result-mobile-card-row final-round-row">
                                    <span className="result-mobile-card-label">Score Card:</span>
                                    {parsed.scorecard_url ? (
                                      <a 
                                        href={parsed.scorecard_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="badge" 
                                        style={{ 
                                          background: '#ecfdf5', 
                                          color: '#047857', 
                                          border: '1px solid #a7f3d0', 
                                          fontWeight: 600,
                                          textDecoration: 'none',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}
                                      >
                                        View Score Card
                                      </a>
                                    ) : (
                                      <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>Coming Soon</span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="result-mobile-card-row">
                                  <span className="result-mobile-card-label">Status:</span>
                                  <span className="badge" style={{ background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: 600 }}>{parsed.status}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="footer-om" style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '2.5rem', textAlign: 'center' }}>
          © 2026 All rights reserved, BACE Delhi
        </div>
      </div>
    </>
  );
};

export default Results;
