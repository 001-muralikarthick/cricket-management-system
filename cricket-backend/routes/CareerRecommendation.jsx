import React, { useState } from 'react';

const CareerRecommendation = () => {
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // New state for Roadmap Generator
  const [careerInput, setCareerInput] = useState('');
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Split the comma-separated string into an array and remove empty spaces
    const skills = input.split(',').map(s => s.trim()).filter(s => s);
    
    if (skills.length === 0) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // Update the URL to match your backend port if it's different
      const response = await fetch('http://localhost:5000/api/careers/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoadmapGenerate = async (e) => {
    e.preventDefault();
    if (!careerInput.trim()) return;

    setRoadmapLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/careers/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career: careerInput }),
      });
      const data = await response.json();
      setGeneratedRoadmap({ title: careerInput, steps: data.roadmap });
    } catch (error) {
      console.error("Failed to generate roadmap", error);
    } finally {
      setRoadmapLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
        
        {/* Career Matcher Section */}
        <div style={{ flex: '1 1 400px' }}>
          <h2>Find Your Ideal Career</h2>
          <p>Enter your skills or interests below (separated by commas) to get personalized career recommendations.</p>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., coding, design, communication, data"
              style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button 
              type="submit" 
              disabled={loading} 
              style={{ padding: '10px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {loading ? 'Finding Careers...' : 'Get Recommendations'}
            </button>
          </form>

          <div style={{ marginTop: '30px' }}>
            {hasSearched && recommendations.length === 0 && !loading && (
              <p>No exact matches found. Try entering different skills like 'react' or 'management'!</p>
            )}
            
            {recommendations.map((career, index) => (
              <div key={index} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{career.title}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#555' }}>Matched based on <strong>{career.matchScore}</strong> of your skills.</p>
                {career.roadmap && (
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Learning Roadmap:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {career.roadmap.map((step, stepIndex) => (
                        <React.Fragment key={stepIndex}>
                          <span style={{ backgroundColor: '#e0f7fa', color: '#006064', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                            {step}
                          </span>
                          {stepIndex < career.roadmap.length - 1 && <span style={{ color: '#aaa', padding: '3px 0', fontSize: '12px' }}>&rarr;</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Generator Section */}
        <div style={{ flex: '1 1 400px' }}>
          <h2>Learning Roadmap Generator</h2>
          <p>Enter a career title to get a step-by-step learning roadmap.</p>
          
          <form onSubmit={handleRoadmapGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={careerInput}
              onChange={(e) => setCareerInput(e.target.value)}
              placeholder="e.g., AI Engineer, Software Engineer"
              style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button 
              type="submit" 
              disabled={roadmapLoading} 
              style={{ padding: '10px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {roadmapLoading ? 'Generating...' : 'Generate Roadmap'}
            </button>
          </form>

          <div style={{ marginTop: '30px' }}>
            {generatedRoadmap && (
              <div style={{ border: '1px solid #c3e6cb', padding: '20px', borderRadius: '5px', backgroundColor: '#d4edda' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>Roadmap for {generatedRoadmap.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {generatedRoadmap.steps && generatedRoadmap.steps.length > 0 ? (
                    generatedRoadmap.steps.map((step, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#28a745', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                          {index + 1}
                        </div>
                        <div style={{ fontSize: '16px', color: '#155724', fontWeight: '500' }}>{step}</div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#155724' }}>No roadmap available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CareerRecommendation;