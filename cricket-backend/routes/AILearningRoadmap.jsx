import React, { useState } from 'react';

const AILearningRoadmap = () => {
  const [goal, setGoal] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data representing the AI's generated roadmap responses
  const mockRoadmapDatabase = {
    'ai engineer': [
      { month: 'Month 1', topics: ['Python', 'NumPy', 'Pandas', 'Matplotlib'] },
      { month: 'Month 2', topics: ['Machine Learning Basics', 'Scikit-Learn', 'Feature Engineering'] },
      { month: 'Month 3', topics: ['Deep Learning', 'Neural Networks', 'PyTorch / TensorFlow'] },
      { month: 'Month 4', topics: ['NLP or Computer Vision', 'Real-world Projects', 'Model Deployment'] }
    ],
    'data scientist': [
      { month: 'Month 1', topics: ['Python', 'Statistics & Probability', 'SQL Basics'] },
      { month: 'Month 2', topics: ['Data Wrangling', 'EDA (Exploratory Data Analysis)', 'Data Visualization'] },
      { month: 'Month 3', topics: ['Machine Learning Algorithms', 'Model Evaluation & Tuning'] },
      { month: 'Month 4', topics: ['A/B Testing', 'Capstone Project', 'Storytelling with Data'] }
    ],
    'software engineer': [
      { month: 'Month 1', topics: ['HTML, CSS', 'JavaScript Basics', 'Version Control (Git)'] },
      { month: 'Month 2', topics: ['Advanced JavaScript', 'React or Vue', 'Frontend Projects'] },
      { month: 'Month 3', topics: ['Node.js', 'Express', 'Databases (SQL/NoSQL)', 'APIs'] },
      { month: 'Month 4', topics: ['System Design Basics', 'Full Stack Project', 'Deployment'] }
    ],
    // Fallback for unmatched goals
    'default': [
      { month: 'Month 1', topics: ['Fundamentals & Core Concepts', 'Basic Tooling'] },
      { month: 'Month 2', topics: ['Intermediate Topics', 'Hands-on Practice Modules'] },
      { month: 'Month 3', topics: ['Advanced Specialization', 'Architecture & Design'] },
      { month: 'Month 4', topics: ['Real-world Projects', 'Portfolio Building', 'Interview Prep'] }
    ]
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsGenerating(true);
    setRoadmap(null);

    // Simulate API delay for the AI generation process
    setTimeout(() => {
      const lowerGoal = goal.toLowerCase().trim();
      let selectedRoadmap = mockRoadmapDatabase['default'];
      
      // Determine which mock roadmap to serve
      for (const key in mockRoadmapDatabase) {
        if (lowerGoal.includes(key)) {
          selectedRoadmap = mockRoadmapDatabase[key];
          break;
        }
      }

      setRoadmap({ title: goal, timeline: selectedRoadmap });
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>AI Learning Roadmap Generator</h1>
        <p style={{ color: '#666', margin: 0 }}>Generate a personalized, month-by-month curriculum to reach your career goals.</p>
      </div>

      <section style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '40px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>Target Career Goal</label>
          <input 
            type="text" 
            value={goal} 
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., AI Engineer, Data Scientist..."
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }}
            required
          />
          <button 
            type="submit" 
            disabled={isGenerating}
            style={{ padding: '12px 20px', backgroundColor: isGenerating ? '#6c757d' : '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', alignSelf: 'flex-start' }}
          >
            {isGenerating ? 'Generating Roadmap...' : 'Generate Roadmap'}
          </button>
        </form>
      </section>

      {roadmap && (
        <section>
          <h2 style={{ color: '#007bff', marginBottom: '20px' }}>Your Roadmap: <span style={{ color: '#333' }}>{roadmap.title}</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {roadmap.timeline.map((block, index) => (
              <div key={index} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#007bff', color: '#fff', padding: '10px 15px', fontWeight: 'bold', fontSize: '18px' }}>
                  {block.month}
                </div>
                <ul style={{ margin: '15px 0', paddingLeft: '35px', color: '#444', lineHeight: '1.8' }}>
                  {block.topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AILearningRoadmap;