import React, { useState } from 'react';

const JobRecommendationEngine = () => {
  const [skillsInput, setSkillsInput] = useState('');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const mockJobs = [
    { id: 1, title: 'Frontend Developer', requiredSkills: ['React', 'JavaScript', 'CSS'], experience: '1-3 Years', salary: '$80k - $110k' },
    { id: 2, title: 'Backend Engineer', requiredSkills: ['Node.js', 'Python', 'SQL'], experience: '3-5 Years', salary: '$100k - $130k' },
    { id: 3, title: 'Data Scientist', requiredSkills: ['Python', 'Pandas', 'Machine Learning'], experience: '2-4 Years', salary: '$110k - $150k' },
    { id: 4, title: 'Full Stack Developer', requiredSkills: ['React', 'Node.js', 'MongoDB'], experience: '3+ Years', salary: '$120k - $160k' },
    { id: 5, title: 'Cloud Architect', requiredSkills: ['AWS', 'Docker', 'Kubernetes'], experience: '5+ Years', salary: '$140k - $180k' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const userSkills = skillsInput.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    
    const matches = mockJobs.filter(job => 
      job.requiredSkills.some(skill => userSkills.includes(skill.toLowerCase()))
    );

    setRecommendedJobs(matches);
    setHasSearched(true);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Job Recommendation Engine</h1>
        <p style={{ color: '#666', margin: 0 }}>Discover jobs matching your skill set along with experience and salary details.</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <input 
          type="text" 
          value={skillsInput} 
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="Enter skills separated by commas (e.g., React, Python, AWS)"
          style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
          required
        />
        <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          Find Jobs
        </button>
      </form>

      {hasSearched && (
        <div>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Recommended Positions</h2>
          {recommendedJobs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {recommendedJobs.map(job => (
                <div key={job.id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#007bff', fontSize: '20px' }}>{job.title}</h3>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}><strong>Experience:</strong> {job.experience}</span>
                    <span style={{ fontSize: '14px', color: '#28a745', display: 'block', fontWeight: 'bold' }}><strong>Salary:</strong> {job.salary}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#333', width: '100%' }}>Required Skills:</strong>
                    {job.requiredSkills.map((skill, idx) => (
                      <span key={idx} style={{ backgroundColor: '#f8f9fa', color: '#495057', padding: '4px 10px', borderRadius: '15px', fontSize: '12px', border: '1px solid #dee2e6' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#dc3545', padding: '20px', backgroundColor: '#f8d7da', borderRadius: '4px', border: '1px solid #f5c6cb' }}>
              No jobs found matching those skills. Try broadening your search!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobRecommendationEngine;