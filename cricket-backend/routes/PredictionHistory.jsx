import React, { useState } from 'react';

const PredictionHistory = () => {
  // Mock data for prediction history
  const [history] = useState({
    previousPredictions: [
      { id: 1, date: 'May 10, 2026', prediction: 'Data Scientist', confidence: '85%' },
      { id: 2, date: 'Jan 15, 2026', prediction: 'Machine Learning Engineer', confidence: '78%' },
    ],
    careerReports: [
      { id: 1, date: 'May 12, 2026', title: 'Q2 Tech Industry Trends', link: '#' },
      { id: 2, date: 'Feb 20, 2026', title: 'Data Science Skills Gap Report', link: '#' },
    ],
    pastRecommendations: [
      { id: 1, date: 'May 10, 2026', recommendation: 'Learn advanced PyTorch and TensorFlow for Deep Learning.', type: 'Skill' },
      { id: 2, date: 'Jan 15, 2026', recommendation: 'Complete the "Machine Learning Specialization" on Coursera.', type: 'Course' },
    ]
  });

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Prediction History</h1>
        <p style={{ color: '#666', margin: 0 }}>Review your previous career predictions, detailed reports, and past recommendations.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Previous Predictions Section */}
        <section>
          <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Previous Predictions</h2>
          {history.previousPredictions.length > 0 ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {history.previousPredictions.map((item) => (
                <div key={item.id} style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '18px', color: '#333' }}>{item.prediction}</strong>
                    <span style={{ color: '#888', fontSize: '14px' }}>{item.date}</span>
                  </div>
                  <div style={{ color: '#555' }}>Confidence Score: <strong>{item.confidence}</strong></div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No previous predictions found.</p>
          )}
        </section>

        {/* Career Reports Section */}
        <section>
          <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Career Reports</h2>
          {history.careerReports.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
              {history.careerReports.map((report) => (
                <li key={report.id} style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px', color: '#333' }}>{report.title}</strong>
                    <span style={{ color: '#888', fontSize: '14px' }}>{report.date}</span>
                  </div>
                  <a href={report.link} style={{ padding: '8px 12px', backgroundColor: '#17a2b8', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>View Report</a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>No career reports available.</p>
          )}
        </section>

        {/* Past Recommendations Section */}
        <section>
          <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Past Recommendations</h2>
          {history.pastRecommendations.length > 0 ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {history.pastRecommendations.map((rec) => (
                <div key={rec.id} style={{ borderLeft: '4px solid #28a745', padding: '15px', backgroundColor: '#f4fdf5', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#155724', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>{rec.type}</span>
                    <span style={{ color: '#666', fontSize: '14px' }}>{rec.date}</span>
                  </div>
                  <p style={{ margin: 0, color: '#333', lineHeight: '1.5' }}>{rec.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No past recommendations found.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default PredictionHistory;