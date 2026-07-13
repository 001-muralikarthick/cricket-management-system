import React, { useState } from 'react';

const SkillDatabase = () => {
  // Mock data for career-skill mapping
  const [database] = useState([
    { id: 1, career: 'Software Engineer', category: 'Engineering', skills: ['JavaScript', 'React', 'Node.js', 'System Design', 'Git'] },
    { id: 2, career: 'Data Scientist', category: 'Data', skills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization'] },
    { id: 3, career: 'UI/UX Designer', category: 'Design', skills: ['Figma', 'User Research', 'Wireframing', 'CSS', 'Prototyping'] },
    { id: 4, career: 'Product Manager', category: 'Management', skills: ['Agile', 'Roadmapping', 'Communication', 'Data Analytics', 'Leadership'] },
    { id: 5, career: 'AI Engineer', category: 'Engineering', skills: ['Python', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Neural Networks'] },
    { id: 6, career: 'Digital Marketer', category: 'Marketing', skills: ['SEO', 'Content Strategy', 'Social Media', 'Google Analytics', 'Copywriting'] },
    { id: 7, career: 'Cybersecurity Analyst', category: 'Security', skills: ['Network Security', 'Linux', 'Ethical Hacking', 'Cryptography', 'Risk Assessment'] }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter by career title or by skill based on the search query
  const filteredCareers = database.filter((item) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesCareer = item.career.toLowerCase().includes(lowerSearch);
    const matchesSkill = item.skills.some(skill => skill.toLowerCase().includes(lowerSearch));
    return matchesCareer || matchesSkill;
  });

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Skill Database</h1>
        <p style={{ color: '#666', margin: 0 }}>Explore career skill mappings and look up required skills for various roles.</p>
      </div>

      {/* Required Skills Lookup Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#007bff', marginBottom: '15px' }}>Required Skills Lookup</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search by career (e.g., Data Scientist) or skill (e.g., Python)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </section>

      {/* Career Skill Mapping Section */}
      <section>
        <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Career Skill Mapping</h2>
        
        {filteredCareers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredCareers.map((item) => (
              <div key={item.id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>{item.career}</h3>
                  <span style={{ fontSize: '12px', backgroundColor: '#e9ecef', color: '#495057', padding: '4px 8px', borderRadius: '12px' }}>{item.category}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {item.skills.map((skill, index) => {
                    // Highlight the specific skill if it matches the search term
                    const isHighlighted = searchTerm && skill.toLowerCase().includes(searchTerm.toLowerCase());
                    return (
                      <span 
                        key={index} 
                        style={{ 
                          backgroundColor: isHighlighted ? '#ffeb3b' : '#f8f9fa', 
                          color: isHighlighted ? '#856404' : '#333', 
                          padding: '5px 10px', 
                          borderRadius: '4px', 
                          fontSize: '14px',
                          border: '1px solid',
                          borderColor: isHighlighted ? '#ffeeba' : '#dee2e6'
                        }}
                      >
                        {skill}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px', color: '#666' }}>
            No careers or skills found matching "{searchTerm}". Try a different search!
          </div>
        )}
      </section>
    </div>
  );
};

export default SkillDatabase;