import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import bannerImg from '../assets/DN_TIDC.png';
import { CheckCircle2 } from 'lucide-react';
import Confetti from 'react-confetti';

interface PollCandidate {
  id: number;
  student_name: string;
  category: string;
  bace: string;
}

const Poll = () => {
  const [candidates, setCandidates] = useState<PollCandidate[]>([]);
  const [activePolls, setActivePolls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<number | null>(null);
  
  // Track voted candidates from localStorage
  const [votedCategories, setVotedCategories] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Make the body background golden for the Poll page
    document.body.style.background = 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)';
    return () => {
      document.body.style.background = ''; // Revert to global index.css default
    };
  }, []);

  useEffect(() => {
    fetchCandidates();
    // Load local votes
    const voted: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tidc_voted_')) {
        const cat = key.replace('tidc_voted_', '');
        voted[cat] = localStorage.getItem(key) || 'true';
      }
    }
    setVotedCategories(voted);
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      // Fetch active polls setting
      const { data: settingsData } = await supabase
        .from('tidc_settings')
        .select('value')
        .eq('key', 'active_polls')
        .single();
        
      let activeCategories: string[] = [];
      if (settingsData && settingsData.value) {
        try {
          activeCategories = JSON.parse(settingsData.value);
        } catch(e) {}
      }
      setActivePolls(activeCategories);

      // Fetch candidates
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
      localStorage.setItem(`tidc_voted_${candidate.category}`, candidate.student_name);
      setVotedCategories(prev => ({ ...prev, [candidate.category]: candidate.student_name }));
      
      // Trigger yayyyy celebration!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      
    } catch (err) {
      console.error('Error casting vote:', err);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setVotingFor(null);
    }
  };

  // Group by category, but only include active categories
  const groupedByCategory = candidates.reduce((acc, current) => {
    if (activePolls.includes(current.category)) {
      if (!acc[current.category]) acc[current.category] = [];
      acc[current.category].push(current);
    }
    return acc;
  }, {} as Record<string, PollCandidate[]>);

  const categories = Object.keys(groupedByCategory);

  return (
    <>
      {showConfetti && <Confetti style={{ zIndex: 9999 }} recycle={false} numberOfPieces={500} gravity={0.15} />}
      <div className="results-bg">
        <img src={bannerImg} alt="DN.TIDC Background" />
        <div className="poll-bg-overlay" />
      </div>

      <div className="form-body results-content" style={{ marginTop: '0', paddingTop: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🗳️</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#78350f', fontSize: '2.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Audience Poll
          </h1>
          <p style={{ color: '#92400e', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
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
                <div key={category} className="field-card" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #fde68a', paddingBottom: '1rem' }}>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#78350f', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                      {category}
                    </h2>
                    {hasVoted && (
                      <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Voted
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {groupedByCategory[category].map(candidate => {
                      const isVotedForThisCandidate = votedCategories[category] === candidate.student_name;
                      return (
                        <div 
                          key={candidate.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            background: isVotedForThisCandidate ? '#fffbeb' : '#faf5ff', 
                            padding: '1rem', 
                            borderRadius: '12px',
                            border: isVotedForThisCandidate ? '2px solid #f59e0b' : '1px solid #e9d5ff',
                            transition: 'all 0.3s'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: isVotedForThisCandidate ? '#78350f' : '#4c1d95', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                              {candidate.student_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: isVotedForThisCandidate ? '#92400e' : '#6b21a8' }}>
                              {candidate.bace || 'N/A'}
                            </div>
                          </div>
                          
                          <button
                            className="btn-primary"
                            disabled={!!hasVoted || votingFor !== null}
                            onClick={() => handleVote(candidate)}
                            style={{
                              padding: '0.6rem 1.2rem',
                              opacity: hasVoted && !isVotedForThisCandidate ? 0.5 : 1,
                              background: hasVoted 
                                ? (isVotedForThisCandidate ? 'linear-gradient(to right, #f59e0b, #d97706)' : '#d1d5db') 
                                : 'linear-gradient(to right, #f59e0b, #d97706)',
                              color: 'white',
                              border: hasVoted && !isVotedForThisCandidate ? 'none' : '1px solid #b45309',
                              boxShadow: hasVoted && !isVotedForThisCandidate ? 'none' : '0 4px 6px -1px rgba(217, 119, 6, 0.4)',
                              cursor: hasVoted ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {votingFor === candidate.id ? 'Voting...' : (isVotedForThisCandidate ? 'Voted' : 'Vote')}
                          </button>
                        </div>
                      );
                    })}
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
