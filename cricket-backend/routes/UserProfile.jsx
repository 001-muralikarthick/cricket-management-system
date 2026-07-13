import React, { useState } from 'react';

const UserProfile = () => {
  // Mock data for the user profile - this could later be fetched from your API
  const [user, setUser] = useState({
    personalInfo: {
      name: 'Jane Doe',
      title: 'Senior Software Engineer',
      email: 'jane.doe@example.com',
      location: 'San Francisco, CA',
      bio: 'Passionate software engineer with 5+ years of experience in full-stack development. I love building scalable applications and mentoring junior developers.',
    },
    careerHistory: [
      {
        id: 1,
        role: 'Senior Software Engineer',
        company: 'Tech Solutions Inc.',
        startDate: 'Jan 2021',
        endDate: 'Present',
        description: 'Leading a team of 5 developers to build a cloud-based CRM platform. Improved system performance by 40% through microservices architecture.'
      },
      {
        id: 2,
        role: 'Software Engineer',
        company: 'WebDev Agency',
        startDate: 'Jun 2018',
        endDate: 'Dec 2020',
        description: 'Developed responsive web applications for various clients using React and Node.js. Integrated third-party APIs and payment gateways.'
      }
    ]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user.personalInfo);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    setUser({ ...user, personalInfo: formData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user.personalInfo);
    setIsEditing(false);
  };

  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    role: '',
    company: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const handleJobInputChange = (e) => {
    const { name, value } = e.target;
    setNewJob({ ...newJob, [name]: value });
  };

  const handleAddJob = () => {
    const newId = user.careerHistory.length > 0 
      ? Math.max(...user.careerHistory.map(j => j.id)) + 1 
      : 1;
    setUser({
      ...user,
      careerHistory: [...user.careerHistory, { ...newJob, id: newId }]
    });
    setIsAddingJob(false);
    setNewJob({ role: '', company: '', startDate: '', endDate: '', description: '' });
  };

  const handleDeleteJob = (id) => {
    setUser({
      ...user,
      careerHistory: user.careerHistory.filter(job => job.id !== id)
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>User Profile</h1>
          <p style={{ color: '#666', margin: 0 }}>View your personal information and career history below.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ padding: '10px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Personal Information Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#007bff', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Personal Information</h2>
        {isEditing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <strong>Name:</strong> <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <strong>Professional Title:</strong> <input type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <strong>Email:</strong> <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <strong>Location:</strong> <input type="text" name="location" value={formData.location} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <strong>Bio:</strong> <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSave} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
              <button onClick={handleCancel} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <strong>Name:</strong> <span>{user.personalInfo.name}</span>
            <strong>Professional Title:</strong> <span>{user.personalInfo.title}</span>
            <strong>Email:</strong> <span>{user.personalInfo.email}</span>
            <strong>Location:</strong> <span>{user.personalInfo.location}</span>
            <strong>Bio:</strong> <span style={{ lineHeight: '1.5' }}>{user.personalInfo.bio}</span>
          </div>
        )}
      </div>

      {/* Career History Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ color: '#007bff', margin: 0 }}>Career History</h2>
          <button 
            onClick={() => setIsAddingJob(true)}
            style={{ padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Job
          </button>
        </div>

        {isAddingJob && (
          <div style={{ border: '1px solid #007bff', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f0f8ff' }}>
            <h3 style={{ marginTop: 0, color: '#007bff' }}>New Career Entry</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
              <strong>Role:</strong> <input type="text" name="role" value={newJob.role} onChange={handleJobInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <strong>Company:</strong> <input type="text" name="company" value={newJob.company} onChange={handleJobInputChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <strong>Start Date:</strong> <input type="text" name="startDate" value={newJob.startDate} onChange={handleJobInputChange} placeholder="e.g., Jan 2021" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <strong>End Date:</strong> <input type="text" name="endDate" value={newJob.endDate} onChange={handleJobInputChange} placeholder="e.g., Present" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <strong>Description:</strong> <textarea name="description" value={newJob.description} onChange={handleJobInputChange} rows="3" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleAddJob} style={{ padding: '10px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Entry</button>
                <button onClick={() => setIsAddingJob(false)} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {user.careerHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {user.careerHistory.map((job) => (
              <div key={job.id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
                <button onClick={() => handleDeleteJob(job.id)} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', paddingRight: '70px' }}>
                  <h3 style={{ margin: 0, color: '#333' }}>{job.role}</h3>
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>{job.startDate} - {job.endDate}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#555', marginBottom: '10px' }}>
                  {job.company}
                </div>
                <p style={{ margin: 0, color: '#444', lineHeight: '1.5' }}>
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No career history found.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;