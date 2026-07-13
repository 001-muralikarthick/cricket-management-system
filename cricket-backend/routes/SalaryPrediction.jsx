import React, { useState } from 'react';

const SalaryPrediction = () => {
  const [formData, setFormData] = useState({ skills: '', experience: '', degree: 'bachelors', location: 'tier2' });
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const handlePredict = (e) => {
    e.preventDefault();
    setIsPredicting(true);

    // Mock prediction logic based on form values
    setTimeout(() => {
      let baseSalary = 50000;
      
      // Add experience multiplier
      const years = parseInt(formData.experience) || 0;
      baseSalary += (years * 6000);

      // Add degree multiplier
      if (formData.degree === 'masters') baseSalary += 15000;
      if (formData.degree === 'phd') baseSalary += 30000;

      // Add location multiplier
      if (formData.location === 'tier1') baseSalary *= 1.4; // e.g., NYC, SF
      if (formData.location === 'remote') baseSalary *= 1.1; 

      // Add skills bonus
      const skillCount = formData.skills.split(',').filter(s => s.trim()).length;
      baseSalary += (skillCount * 2500);

      const lowerBound = Math.round(baseSalary * 0.9);
      const upperBound = Math.round(baseSalary * 1.1);

      setPrediction(`$${lowerBound.toLocaleString()} - $${upperBound.toLocaleString()}`);
      setIsPredicting(false);
    }, 800);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Salary Prediction AI</h1>
        <p style={{ color: '#666', margin: 0 }}>Predict your market value based on skills, experience, education, and location.</p>
      </div>

      <form onSubmit={handlePredict} style={{ display: 'grid', gap: '20px', backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '30px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Key Skills (comma separated)</label>
          <input type="text" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} placeholder="e.g., Python, AWS, React" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Years of Experience</label>
            <input type="number" min="0" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} placeholder="e.g., 3" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Highest Degree</label>
            <select value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', boxSizing: 'border-box' }}>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="phd">Ph.D.</option>
              <option value="none">No Formal Degree</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Location</label>
          <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', boxSizing: 'border-box' }}>
            <option value="tier1">Tier 1 City (NYC, SF, London)</option>
            <option value="tier2">Tier 2 City / Average Cost of Living</option>
            <option value="remote">Remote / Work From Home</option>
          </select>
        </div>

        <button type="submit" disabled={isPredicting} style={{ padding: '15px', backgroundColor: isPredicting ? '#6c757d' : '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: isPredicting ? 'not-allowed' : 'pointer', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>
          {isPredicting ? 'Analyzing Market Data...' : 'Predict Salary'}
        </button>
      </form>

      {prediction && (
        <div style={{ backgroundColor: '#e6f4ea', border: '2px solid #28a745', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#155724', fontSize: '20px' }}>Estimated Annual Salary</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>{prediction}</div>
        </div>
      )}
    </div>
  );
};

export default SalaryPrediction;