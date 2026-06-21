import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../assets/DN_TIDC.png';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PollCandidate {
  id: number;
  student_name: string;
  category: string;
  bace: string;
}

const Poll = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<PollCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<number | null>(null);
  
  // Track voted categories from localStorage
  const [votedCategories, setVotedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCandidates();
    // Load local votes
    const voted: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tidc_voted_')) {
        const cat = key.replace('tidc_voted_', '');
        voted[cat] = true;
      }
    }
    setVotedCategories(voted);
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tidc_results')
        .select('id, student_name, category, bace')
        .eq('in_poll', true)
        .order('category', { ascending: true })
        .order('student_name', { ascending: true });

      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error('Error fetching poll candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidate: PollCandidate) => {
    if (votedCategories[candidate.category]) return;
    
    setVotingFor(candidate.id);
    try {
      const { error } = await supabase
        .from('tidc_votes')
        .insert([{
          category: candidate.category,
          candidate_name: candidate.student_name
        }]);

      if (error) throw error;

      // Mark as voted in localStorage
      localStorage.setItem(`tidc_voted_${candidate.category}`, 'true');
      setVotedCategories(prev => ({ ...prev, [candidate.category]: true }));
      
    } catch (err) {
      console.error('Error casting vote:', err);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setVotingFor(null);
    }
  };

  // Group by category
  const groupedByCategory = candidates.reduce((acc, current) => {
    if (!acc[current.category]) acc[current.category] = [];
    acc[current.category].push(current);
    return acc;
  }, {} as Record<string, PollCandidate[]>);

  const categories = Object.keys(groupedByCategory);

  return (
    <>
      <div className="results-bg">
        <img src={bannerImg} alt="DN.TIDC Background" />
        <div className="results-bg-overlay" />
      </div>

      <div className="form-body results-content" style={{ marginTop: '2rem', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
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

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🗳️</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '2.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Audience Poll
          </h1>
          <p style={{ color: '#6b21a8', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Vote for your favorite participants! You can cast <strong>one vote per category</strong>.
          </p>
        </div>

        {loading ? (
          <div className="field-card" style={{ textAlign: 'center', padding: '4rem 0', color: '#9333ea', fontWeight: 600 }}>
            Loading candidates...
          </div>
        ) : categories.length === 0 ? (
          <div className="field-card" style={{ textAlign: 'center', padding: '4rem 0', color: '#6b21a8', fontSize: '1rem', fontStyle: 'italic' }}>
            No polls are currently active. Please check back later!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {categories.map(category => {
              const hasVoted = votedCategories[category];
              return (
                <div key={category} className="field-card" style={{ padding: '1.5rem', borderTop: '4px solid #9333ea' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3e8ff', paddingBottom: '1rem' }}>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#3b0764', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                      {category}
                    </h2>
                    {hasVoted && (
                      <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Voted
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {groupedByCategory[category].map(candidate => (
                      <div 
                        key={candidate.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: '#faf5ff', 
                          padding: '1rem', 
                          borderRadius: '12px',
                          border: '1px solid #e9d5ff'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#4c1d95', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                            {candidate.student_name}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b21a8' }}>
                            {candidate.bace || 'N/A'}
                          </div>
                        </div>
                        
                        <button
                          className="btn-primary"
                          disabled={hasVoted || votingFor !== null}
                          onClick={() => handleVote(candidate)}
                          style={{
                            padding: '0.6rem 1.2rem',
                            opacity: hasVoted ? 0.5 : 1,
                            background: hasVoted ? '#d8b4fe' : '#9333ea',
                            cursor: hasVoted ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {votingFor === candidate.id ? 'Voting...' : (hasVoted ? 'Voted' : 'Vote')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="footer-om" style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '2.5rem', textAlign: 'center' }}>
          © 2026 All rights reserved, BACE Delhi
        </div>
      </div>
    </>
  );
};

export default Poll;
