import React from 'react';

const CareerTrendDashboard = () => {
  // Mock Analytics Data
  const topDemandedJobs = [
    { title: 'AI/Machine Learning Engineer', demand: 95 },
    { title: 'Data Scientist', demand: 88 },
    { title: 'Cloud Security Architect', demand: 82 },
    { title: 'Full Stack Developer', demand: 75 }
  ];

  const futureCareers = [
    { title: 'Prompt Engineer', growth: '+150%', desc: 'Optimizing and developing text prompts for large language models.' },
    { title: 'Quantum Developer', growth: '+120%', desc: 'Building algorithms for quantum computing infrastructure.' },
    { title: 'Green Tech Engineer', growth: '+85%', desc: 'Developing sustainable energy tracking and reduction systems.' }
  ];

  const skillTrends = [
    { skill: 'Generative AI', change: '+200%', color: '#28a745' },
    { skill: 'Rust', change: '+65%', color: '#28a745' },
    { skill: 'Python', change: '+30%', color: '#28a745' },
    { skill: 'Ruby', change: '+20%', color: '#28a745' },
    { skill: 'JQuery', change: '-15%', color: '#dc3545' }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Career Trend Dashboard</h1>
        <p style={{ color: '#666', margin: 0 }}>Real-time insights into most demanded jobs, emerging career paths, and skill shifts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Top Demanded Jobs */}
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#007bff', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Most Demanded Jobs (2026)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {topDemandedJobs.map((job, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong style={{ color: '#333' }}>{job.title}</strong>
                  <span style={{ color: '#666', fontSize: '14px' }}>{job.demand}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e9ecef', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${job.demand}%`, backgroundColor: '#007bff', height: '100%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skill Demand Trends */}
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#007bff', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Skill Demand Trends</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
            {skillTrends.map((skill, idx) => (
              <div key={idx} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'calc(33% - 20px)' }}>
                <strong style={{ color: '#333', marginBottom: '5px', textAlign: 'center' }}>{skill.skill}</strong>
                <span style={{ color: skill.color, fontWeight: 'bold', fontSize: '18px' }}>{skill.change}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Future Careers */}
        <section style={{ gridColumn: '1 / -1', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#007bff', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Emerging Future Careers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {futureCareers.map((career, idx) => (
              <div key={idx} style={{ padding: '20px', backgroundColor: '#f8fdfd', borderLeft: '4px solid #17a2b8', borderRadius: '0 8px 8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#117a8b', fontSize: '18px' }}>{career.title}</h3>
                  <span style={{ backgroundColor: '#d1ecf1', color: '#0c5460', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {career.growth} YoY
                  </span>
                </div>
                <p style={{ margin: 0, color: '#555', lineHeight: '1.5', fontSize: '14px' }}>
                  {career.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default CareerTrendDashboard;