import React, { useState } from 'react';

const SkillGapAnalysis = () => {
  // Mock data for target roles and their required skills
  const careerDatabase = [
    { id: 1, title: 'Software Engineer', skills: ['JavaScript', 'React', 'Node.js', 'System Design', 'Python', 'Java', 'HTML', 'CSS'] },
    { id: 2, title: 'Data Scientist', skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Statistics', 'SQL', 'Deep Learning', 'AI', 'Data Visualization'] },
    { id: 3, title: 'UI/UX Designer', skills: ['Figma', 'User Research', 'Wireframing', 'CSS', 'Prototyping', 'Design Principles'] },
    { id: 4, title: 'Product Manager', skills: ['Agile', 'Roadmapping', 'Communication', 'Data Analytics', 'Leadership', 'Market Research', 'Strategy'] },
    { id: 5, title: 'AI Engineer', skills: ['Python', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Neural Networks', 'Machine Learning'] }
  ];

  const [selectedRole, setSelectedRole] = useState('');
  const [currentSkillsInput, setCurrentSkillsInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!selectedRole || !currentSkillsInput.trim()) return;

    const role = careerDatabase.find(c => c.title === selectedRole);
    if (!role) return;

    // Parse user input into a lowercase array, trimming whitespace
    const currentSkillsArray = currentSkillsInput.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const requiredSkills = role.skills;

    const matchedSkills = [];
    const missingSkills = [];

    // Compare required skills against what the user entered
    requiredSkills.forEach(skill => {
      if (currentSkillsArray.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    setAnalysisResult({
      targetRole: role.title,
      matchedSkills,
      missingSkills,
      matchPercentage: Math.round((matchedSkills.length / requiredSkills.length) * 100)
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Skill Gap Analysis</h1>
        <p style={{ color: '#666', margin: 0 }}>Compare your current skills with the requirements for your target role to identify areas for improvement.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Input Section */}
        <section style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Target Role</label>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: '#fff' }}
                required
              >
                <option value="" disabled>Select a target role...</option>
                {careerDatabase.map(role => (
                  <option key={role.id} value={role.title}>{role.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Current Skills</label>
              <input 
                type="text" 
                value={currentSkillsInput} 
                onChange={(e) => setCurrentSkillsInput(e.target.value)}
                placeholder="e.g., Python, Pandas, NumPy"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }}
                required
              />
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Enter your skills separated by commas.</small>
            </div>

            <button 
              type="submit" 
              style={{ padding: '12px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', alignSelf: 'flex-start' }}
            >
              Analyze Skill Gap
            </button>

          </form>
        </section>

        {/* Results Section */}
        {analysisResult && (
          <section>
            <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Analysis Results: {analysisResult.targetRole}</h2>
            
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ flex: 1, backgroundColor: '#e9ecef', borderRadius: '8px', height: '24px', overflow: 'hidden' }}>
                <div style={{ width: `${analysisResult.matchPercentage}%`, backgroundColor: analysisResult.matchPercentage >= 70 ? '#28a745' : analysisResult.matchPercentage >= 40 ? '#ffc107' : '#dc3545', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{analysisResult.matchPercentage}% Match</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              
              {/* Matched Skills */}
              <div style={{ border: '1px solid #c3e6cb', padding: '20px', borderRadius: '8px', backgroundColor: '#d4edda', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#155724', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✅</span> Current Skills (Matched)
                </h3>
                {analysisResult.matchedSkills.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#155724' }}>
                    {analysisResult.matchedSkills.map((skill, i) => <li key={i} style={{ marginBottom: '5px' }}>{skill}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#155724', fontStyle: 'italic' }}>No matching skills found.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div style={{ border: '1px solid #f5c6cb', padding: '20px', borderRadius: '8px', backgroundColor: '#f8d7da', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#721c24', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>❌</span> Missing Skills
                </h3>
                {analysisResult.missingSkills.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#721c24' }}>
                    {analysisResult.missingSkills.map((skill, i) => <li key={i} style={{ marginBottom: '5px', fontWeight: 'bold' }}>{skill}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#721c24', fontStyle: 'italic' }}>You have all the required skills!</p>
                )}
              </div>

            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SkillGapAnalysis;