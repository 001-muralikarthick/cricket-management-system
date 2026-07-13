import React, { useState } from 'react';

const CareerMatchPercentage = () => {
  const [skillsInput, setSkillsInput] = useState('');
  const [matches, setMatches] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Mock database of careers and their required skills
  const careerDatabase = [
    { id: 1, title: 'Software Engineer', requiredSkills: ['JavaScript', 'React', 'Node.js', 'System Design', 'Python', 'Java', 'HTML', 'CSS', 'Git'] },
    { id: 2, title: 'Data Scientist', requiredSkills: ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Statistics', 'SQL', 'Deep Learning', 'Data Visualization'] },
    { id: 3, title: 'UI/UX Designer', requiredSkills: ['Figma', 'User Research', 'Wireframing', 'CSS', 'Prototyping', 'Design Principles', 'HTML'] },
    { id: 4, title: 'Product Manager', requiredSkills: ['Agile', 'Roadmapping', 'Communication', 'Data Analytics', 'Leadership', 'Market Research', 'Strategy'] },
    { id: 5, title: 'AI Engineer', requiredSkills: ['Python', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Neural Networks', 'Machine Learning', 'Mathematics'] },
    { id: 6, title: 'DevOps Engineer', requiredSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Python', 'Networking', 'Bash'] }
  ];

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!skillsInput.trim()) return;

    setIsCalculating(true);

    // Simulate an API delay
    setTimeout(() => {
      const userSkills = skillsInput.split(',').map(s => s.trim().toLowerCase()).filter(s => s);

      const calculatedMatches = careerDatabase.map(career => {
        const matchedSkills = career.requiredSkills.filter(skill => 
          userSkills.includes(skill.toLowerCase())
        );
        const percentage = Math.round((matchedSkills.length / career.requiredSkills.length) * 100);
        
        return {
          ...career,
          matchedSkills,
          percentage
        };
      });

      // Sort by highest match percentage descending
      calculatedMatches.sort((a, b) => b.percentage - a.percentage);
      
      setMatches(calculatedMatches);
      setIsCalculating(false);
    }, 600);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Career Match Percentage</h1>
        <p style={{ color: '#666', margin: 0 }}>Enter your current skills to calculate how well you match with various career paths.</p>
      </div>

      <section style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '40px' }}>
        <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>Your Skills</label>
          <textarea 
            value={skillsInput} 
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g., Python, SQL, React, Communication..."
            rows="3"
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box', resize: 'vertical' }}
            required
          />
          <button 
            type="submit" 
            disabled={isCalculating}
            style={{ padding: '12px 20px', backgroundColor: isCalculating ? '#6c757d' : '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: isCalculating ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', alignSelf: 'flex-start' }}
          >
            {isCalculating ? 'Calculating Matches...' : 'Calculate Match Percentages'}
          </button>
        </form>
      </section>

      {matches.length > 0 && (
        <section>
          <h2 style={{ color: '#007bff', marginBottom: '20px' }}>Your Career Matches</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {matches.map(match => (
              <div key={match.id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>{match.title}</h3>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: match.percentage >= 70 ? '#28a745' : match.percentage >= 40 ? '#ffc107' : '#dc3545' }}>
                    {match.percentage}%
                  </div>
                </div>
                
                <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '8px', height: '10px', marginBottom: '15px', overflow: 'hidden' }}>
                  <div style={{ width: `${match.percentage}%`, backgroundColor: match.percentage >= 70 ? '#28a745' : match.percentage >= 40 ? '#ffc107' : '#dc3545', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {match.requiredSkills.map(skill => {
                    const isMatched = match.matchedSkills.includes(skill);
                    return (
                      <span 
                        key={skill} 
                        style={{ 
                          padding: '4px 10px', 
                          borderRadius: '15px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: isMatched ? '#d4edda' : '#f8d7da',
                          color: isMatched ? '#155724' : '#721c24',
                          border: `1px solid ${isMatched ? '#c3e6cb' : '#f5c6cb'}`
                        }}
                      >
                        {isMatched ? '✓' : '✗'} {skill}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CareerMatchPercentage;