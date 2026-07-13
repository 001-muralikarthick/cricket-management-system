import React, { useState } from 'react';

const InterviewPreparation = () => {
  const [career, setCareer] = useState('');
  const [interviewData, setInterviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock database representing generated interview questions based on career
  const mockInterviewDatabase = {
    'software engineer': {
      technical: [
        'Explain the concept of closures in JavaScript and provide a use case.',
        'How does React\'s Virtual DOM work under the hood?',
        'Describe the differences between REST and GraphQL APIs.',
        'How do you manage state in a large-scale web application?'
      ],
      hr: [
        'Tell me about a time you had a technical disagreement with a team member. How did you resolve it?',
        'What is your approach to balancing code quality with tight project deadlines?',
        'Where do you see your software engineering career in 5 years?'
      ],
      aptitude: [
        'If 5 programmers can fix 5 bugs in 5 minutes, how many minutes will it take 100 programmers to fix 100 bugs?',
        'Find the next number in the sequence: 2, 6, 12, 20, 30, ?',
        'A train running at 60 km/hr crosses a pole in 9 seconds. What is the length of the train?'
      ]
    },
    'data scientist': {
      technical: [
        'Explain the difference between supervised and unsupervised learning.',
        'How do you handle missing or corrupted data in a dataset?',
        'What is the bias-variance tradeoff and how does it affect model performance?',
        'Write a SQL query to find the second highest salary from an Employee table.'
      ],
      hr: [
        'How do you communicate complex statistical findings to non-technical stakeholders?',
        'Describe a time when your data analysis led to a significant business decision.',
        'What motivates you to pursue a career in Data Science?'
      ],
      aptitude: [
        'In a class of 50 students, 30 study Python and 25 study R. 10 study both. How many study neither?',
        'What is the probability of rolling a sum of 7 with two standard six-sided dice?',
        'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?'
      ]
    },
    'default': {
      technical: [
        'Describe the core tools and technologies you use daily in this role.',
        'Walk me through a complex project you recently completed from start to finish.',
        'How do you stay updated with the latest industry trends and methodologies?'
      ],
      hr: [
        'Tell me about yourself and your professional journey so far.',
        'What is your greatest professional achievement?',
        'Why are you interested in working for our company?'
      ],
      aptitude: [
        'Solve: If A is the brother of B; B is the sister of C; and C is the father of D, how is D related to A?',
        'Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?',
        'If a machine produces 100 widgets in 5 hours, how many widgets can 3 machines produce in 10 hours?'
      ]
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!career.trim()) return;

    setIsGenerating(true);
    setInterviewData(null);

    // Simulate API delay
    setTimeout(() => {
      const lowerCareer = career.toLowerCase().trim();
      let selectedData = mockInterviewDatabase['default'];
      
      for (const key in mockInterviewDatabase) {
        if (lowerCareer.includes(key)) {
          selectedData = mockInterviewDatabase[key];
          break;
        }
      }

      setInterviewData({ title: career, questions: selectedData });
      setIsGenerating(false);
    }, 800);
  };

  const renderQuestionList = (title, questions, icon, color) => (
    <div style={{ border: `1px solid ${color}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
      <div style={{ backgroundColor: color, color: '#fff', padding: '12px 15px', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span> {title}
      </div>
      <ul style={{ margin: 0, padding: '15px 15px 15px 35px', color: '#444', lineHeight: '1.6' }}>
        {questions.map((q, index) => (
          <li key={index} style={{ marginBottom: '10px' }}>{q}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Interview Preparation Module</h1>
        <p style={{ color: '#666', margin: 0 }}>Generate personalized technical, HR, and aptitude questions to help you prepare for your next big interview.</p>
      </div>

      <section style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '40px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>Target Career</label>
          <input 
            type="text" 
            value={career} 
            onChange={(e) => setCareer(e.target.value)}
            placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }}
            required
          />
          <button 
            type="submit" 
            disabled={isGenerating}
            style={{ padding: '12px 20px', backgroundColor: isGenerating ? '#6c757d' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', alignSelf: 'flex-start' }}
          >
            {isGenerating ? 'Generating Questions...' : 'Generate Questions'}
          </button>
        </form>
      </section>

      {interviewData && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <h2 style={{ color: '#333', marginBottom: '5px' }}>Questions for: <span style={{ color: '#007bff' }}>{interviewData.title}</span></h2>
          {renderQuestionList('Technical Questions', interviewData.questions.technical, '💻', '#17a2b8')}
          {renderQuestionList('HR & Behavioral Questions', interviewData.questions.hr, '🤝', '#6f42c1')}
          {renderQuestionList('Aptitude & Logical Questions', interviewData.questions.aptitude, '🧩', '#e83e8c')}
        </section>
      )}
    </div>
  );
};

export default InterviewPreparation;