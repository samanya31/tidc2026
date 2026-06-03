import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../assets/DN_TIDC.png';
import { ArrowLeft, Search, Trophy } from 'lucide-react';

interface Result {
  id: number;
  student_name: string;
  category: string;
  status: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter results by search term
  const filteredResults = results.filter(res =>
    res.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered results by category
  const groupedResults = filteredResults.reduce((acc, current) => {
    if (!acc[current.category]) {
      acc[current.category] = [];
    }
    acc[current.category].push(current);
    return acc;
  }, {} as Record<string, Result[]>);

  const categories = Object.keys(groupedResults);

  return (
    <>
      <div className="hero-banner">
        <img src={bannerImg} alt="DN.TIDC Banner" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
      </div>

      <div className="form-body" style={{ marginTop: '2rem' }}>
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

        <div className="field-card" style={{ marginBottom: '2rem', padding: '2rem 1.5rem', border: '1px solid #e9d5ff', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 20px rgba(147, 51, 234, 0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              TIDC 2026 Qualified Students
            </h2>
            <p style={{ color: '#6b21a8', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
              Congratulations to all the participants and qualified students of the Talent Identification & Development Competition 2026!
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#faf5ff', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e9d5ff', boxShadow: 'inset 0 1px 3px rgba(147,51,234,0.03)', marginBottom: '1.5rem' }}>
            <Search size={20} color="#9333ea" style={{ marginRight: '0.75rem' }} />
            <input 
              type="text" 
              placeholder="Search by student name or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontFamily: 'Poppins', fontSize: '1rem', color: '#3b0764' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9333ea', fontWeight: 600 }}>
              Loading results...
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b21a8', fontSize: '1rem', fontStyle: 'italic' }}>
              No results have been announced yet. Please check back later!
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b21a8', fontSize: '1rem', fontStyle: 'italic' }}>
              No results match your search term.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {categories.map(category => (
                <div key={category} style={{ background: '#fdfbfe', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(147,51,234,0.02)' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={20} color="#d97706" /> {category}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                    {groupedResults[category].map(res => (
                      <div 
                        key={res.id} 
                        style={{
                          background: '#fff',
                          border: '1px solid #e9d5ff',
                          borderRadius: '10px',
                          padding: '1rem',
                          boxShadow: '0 2px 6px rgba(147,51,234,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(147,51,234,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(147,51,234,0.03)';
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '1.05rem' }}>
                          {res.student_name}
                        </div>
                        <div>
                          <span className={`badge ${res.status.toLowerCase().includes('winner') ? 'badge-amber' : 'badge-purple'}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="footer-om" style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '2.5rem', textAlign: 'center' }}>
          © 2026 All rights reserved, BACE Delhi
        </div>
      </div>
    </>
  );
};

export default Results;
