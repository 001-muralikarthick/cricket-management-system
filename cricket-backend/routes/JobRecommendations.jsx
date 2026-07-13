import React, { useState } from 'react';

const JobRecommendations = () => {
  // Mock data for job recommendations and related opportunities
  const [recommendations] = useState({
    careerJobs: [
      {
        id: 1,
        title: 'Machine Learning Engineer',
        company: 'AI Innovations Inc.',
        location: 'Remote',
        salary: '$130k - $160k',
        matchScore: '96%',
        posted: '2 days ago'
      },
      {
        id: 2,
        title: 'Senior Data Scientist',
        company: 'Global Analytics',
        location: 'New York, NY',
        salary: '$140k - $170k',
        matchScore: '89%',
        posted: '1 week ago'
      },
      {
        id: 3,
        title: 'Python Backend Developer',
        company: 'FinTech Solutions',
        location: 'San Francisco, CA',
        salary: '$110k - $140k',
        matchScore: '82%',
        posted: '3 days ago'
      }
    ],
    relatedOpportunities: [
      {
        id: 1,
        type: 'Freelance Gig',
        title: 'Build a Recommendation Engine',
        organization: 'StartupX (via Upwork)',
        details: '3-month contract, part-time'
      },
      {
        id: 2,
        type: 'Networking Event',
        title: 'Global AI & Data Science Conference 2026',
        organization: 'Tech Community',
        details: 'August 15-17, 2026 | Virtual'
      },
      {
        id: 3,
        type: 'Open Source',
        title: 'TensorFlow Core Contributions',
        organization: 'Google Open Source',
        details: 'Looking for contributors to optimize data pipelines.'
      }
    ]
  });

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Job Recommendations</h1>
        <p style={{ color: '#666', margin: 0 }}>Explore personalized career-wise job suggestions and related opportunities based on your profile.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Career-wise Job Suggestions Section */}
        <section>
          <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Career-Wise Job Suggestions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {recommendations.careerJobs.map((job) => (
              <div key={job.id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>{job.title}</h3>
                  <span style={{ backgroundColor: '#e6f2ff', color: '#007bff', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{job.matchScore} Match</span>
                </div>
                <p style={{ margin: '0 0 5px 0', fontWeight: '500', color: '#555' }}>{job.company}</p>
                <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>{job.location} &bull; {job.salary}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>Posted {job.posted}</span>
                  <button style={{ padding: '6px 12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Apply</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Opportunities Section */}
        <section>
          <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Related Opportunities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {recommendations.relatedOpportunities.map((opp) => (
              <div key={opp.id} style={{ borderLeft: '4px solid #17a2b8', padding: '15px 20px', backgroundColor: '#f8fdfd', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#117a8b', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>{opp.type}</span>
                  </div>
                  <strong style={{ display: 'block', fontSize: '16px', color: '#333', marginBottom: '4px' }}>{opp.title}</strong>
                  <div style={{ color: '#555', fontSize: '14px' }}>{opp.organization} &bull; <span style={{ color: '#888' }}>{opp.details}</span></div>
                </div>
                <button style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Learn More</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default JobRecommendations;