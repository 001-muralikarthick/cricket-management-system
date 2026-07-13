import React, { useState } from 'react';

// Import all your newly created components
import JobRecommendationEngine from './JobRecommendationEngine';
import CourseRecommendationSystem from './CourseRecommendationSystem';
import SalaryPrediction from './SalaryPrediction';
import CareerTrendDashboard from './CareerTrendDashboard';
import AICareerChatbot from './AICareerChatbot';

const MainDashboard = () => {
  // State to keep track of which tab is currently active
  const [activeTab, setActiveTab] = useState('trends');

  // Configuration for our navigation tabs
  const tabs = [
    { id: 'trends', label: 'Career Trends' },
    { id: 'jobs', label: 'Job Recommendations' },
    { id: 'courses', label: 'Course Recommendations' },
    { id: 'salary', label: 'Salary Prediction' },
    { id: 'chat', label: 'AI Chatbot' }
  ];

  // Function to render the correct component based on the active tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'trends':
        return <CareerTrendDashboard />;
      case 'jobs':
        return <JobRecommendationEngine />;
      case 'courses':
        return <CourseRecommendationSystem />;
      case 'salary':
        return <SalaryPrediction />;
      case 'chat':
        return <AICareerChatbot />;
      default:
        return <CareerTrendDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Header & Navigation Menu */}
      <header style={{ maxWidth: '1200px', margin: '0 auto 30px auto', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#007bff', textAlign: 'center' }}>AI Career Platform</h1>
        
        <nav style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === tab.id ? '#007bff' : '#e9ecef',
                color: activeTab === tab.id ? '#fff' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '20px', minHeight: '600px' }}>
        {renderActiveComponent()}
      </main>

    </div>
  );
};

export default MainDashboard;