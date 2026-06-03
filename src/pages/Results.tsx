import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../assets/DN_TIDC.png';
import { ArrowLeft, Search, Trophy, Medal } from 'lucide-react';

interface Result {
  id: number;
  student_name: string;
  bace: string;
  category: string;
  round: string;
  status: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'round2' | 'final'>('round2');

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
  const tabResults = filteredResults.filter(res =>
    activeTab === 'final' ? res.round === 'Final Round' : res.round !== 'Final Round'
  );

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
          <button style={tabStyle(activeTab === 'round2')} onClick={() => setActiveTab('round2')}>
            <Medal size={18} /> Round 2
          </button>
          <button style={tabStyle(activeTab === 'final')} onClick={() => setActiveTab('final')}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {categories.map(category => (
              <div key={category} className="field-card" style={{ padding: '1.75rem', background: '#fff', margin: 0 }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '2px solid #e9d5ff', paddingBottom: '0.5rem' }}>
                  {category}
                </h2>

                <h3 style={{
                  fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  color: activeTab === 'final' ? '#b45309' : '#6b21a8',
                }}>
                  {activeTab === 'final' ? <Trophy size={18} color="#d97706" /> : <Medal size={18} color="#9333ea" />}
                  {activeTab === 'final' ? 'Final Round Results' : 'Round 2 Qualifiers'} ({groupedByCategory[category].length})
                </h3>

                <div className="table-container" style={{
                  overflowX: 'auto', width: '100%',
                  border: activeTab === 'final' ? '1px solid #fef3c7' : undefined,
                }}>
                  <table className="data-table" style={{ width: '100%', tableLayout: 'auto' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem' }}>Student</th>
                        <th style={{ padding: '0.75rem 1rem' }}>BACE</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByCategory[category].map(res => (
                        <tr key={res.id} style={{ background: activeTab === 'final' ? '#fffbeb' : undefined }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: activeTab === 'final' ? '#78350f' : '#1e1b4b' }}>{res.student_name}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{res.bace || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {activeTab === 'final' ? (
                              <span className="badge badge-amber" style={{ border: '1px solid #fde68a' }}>{res.status}</span>
                            ) : (
                              <span className="badge" style={{ background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: 600 }}>{res.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="footer-om" style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '2.5rem', textAlign: 'center' }}>
          © 2026 All rights reserved, BACE Delhi
        </div>
      </div>
    </>
  );
};

export default Results;
