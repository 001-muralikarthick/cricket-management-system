import React, { useState } from 'react';

const CareerDatasetProcessing = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processLogs, setProcessLogs] = useState([]);
  const [stats, setStats] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null);
      setProgress(0);
      setProcessLogs([]);
    }
  };

  const handleProcess = () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessLogs(['Initializing dataset processing...']);

    // Mock data processing steps
    const steps = [
      'Parsing CSV/JSON file structure...',
      'Cleaning missing or null values...',
      'Normalizing career titles and skill keywords...',
      'Extracting feature vectors for prediction model...',
      'Finalizing dataset mapping...'
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 20;
        
        if (currentStep < steps.length) {
          setProcessLogs((logs) => [...logs, steps[currentStep]]);
          currentStep++;
        }

        if (newProgress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setStats({
            totalRecords: '15,420',
            uniqueCareers: '124',
            extractedSkills: '845',
            missingValuesFixed: '132',
            dataHealthScore: '98.5%'
          });
          return 100;
        }
        return newProgress;
      });
    }, 800);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Career Dataset Processing</h1>
        <p style={{ color: '#666', margin: 0 }}>Upload and process raw career data to train the prediction model and update the skill database.</p>
      </div>

      {/* Upload Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <h2 style={{ color: '#007bff', marginTop: 0, marginBottom: '15px', fontSize: '20px' }}>Data Ingestion</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="file" 
            accept=".csv, .json" 
            onChange={handleFileChange}
            disabled={isProcessing}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
          />
          <button 
            onClick={handleProcess} 
            disabled={!file || isProcessing}
            style={{ padding: '10px 20px', backgroundColor: file && !isProcessing ? '#28a745' : '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: file && !isProcessing ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
          >
            {isProcessing ? 'Processing...' : 'Process Dataset'}
          </button>
        </div>
      </section>

      {/* Progress & Logs Section */}
      {(isProcessing || progress > 0) && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#007bff', fontSize: '18px', marginBottom: '10px' }}>Processing Status</h2>
          
          {/* Progress Bar */}
          <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '8px', overflow: 'hidden', height: '20px', marginBottom: '15px' }}>
            <div style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#28a745' : '#007bff', height: '100%', transition: 'width 0.5s ease-in-out' }} />
          </div>
          
          {/* Logs */}
          <div style={{ backgroundColor: '#212529', color: '#20c997', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', height: '120px', overflowY: 'auto' }}>
            {processLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>&gt; {log}</div>
            ))}
            {progress === 100 && <div style={{ color: '#28a745', fontWeight: 'bold', marginTop: '10px' }}>&gt; Processing complete! Dashboard updated.</div>}
          </div>
        </section>
      )}

      {/* Statistics Dashboard */}
      {stats && (
        <section>
          <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>Dataset Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
            
            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Total Records</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{stats.totalRecords}</div>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Unique Careers</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#17a2b8' }}>{stats.uniqueCareers}</div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Extracted Skills</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6f42c1' }}>{stats.extractedSkills}</div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Missing Values</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>{stats.missingValuesFixed}</div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Health Score</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>{stats.dataHealthScore}</div>
            </div>

          </div>
        </section>
      )}
    </div>
  );
};

export default CareerDatasetProcessing;