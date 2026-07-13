import React, { useState } from 'react';

const CourseRecommendationSystem = () => {
  const [missingSkills, setMissingSkills] = useState('');
  const [courses, setCourses] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const mockCoursesDatabase = [
    { id: 1, skill: 'python', title: 'Python for Everybody', platform: 'Coursera', level: 'Beginner' },
    { id: 2, skill: 'python', title: '100 Days of Code: Python', platform: 'Udemy', level: 'Intermediate' },
    { id: 3, skill: 'machine learning', title: 'Machine Learning Crash Course', platform: 'YouTube', level: 'Beginner' },
    { id: 4, skill: 'machine learning', title: 'Introduction to Machine Learning', platform: 'NPTEL', level: 'Advanced' },
    { id: 5, skill: 'react', title: 'React JS Course for Beginners', platform: 'YouTube', level: 'Beginner' },
    { id: 6, skill: 'react', title: 'Advanced React and Redux', platform: 'Udemy', level: 'Advanced' },
    { id: 7, skill: 'sql', title: 'SQL for Data Science', platform: 'Coursera', level: 'Intermediate' }
  ];

  const platformColors = {
    'YouTube': '#ff0000',
    'Coursera': '#0056d2',
    'Udemy': '#a435f0',
    'NPTEL': '#ff9900'
  };

  const handleRecommend = (e) => {
    e.preventDefault();
    const skillsArray = missingSkills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    
    const recommendations = mockCoursesDatabase.filter(course => 
      skillsArray.includes(course.skill.toLowerCase())
    );

    setCourses(recommendations);
    setHasSearched(true);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Course Recommendation System</h1>
        <p style={{ color: '#666', margin: 0 }}>Upskill by finding top courses across YouTube, Coursera, Udemy, and NPTEL.</p>
      </div>

      <form onSubmit={handleRecommend} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <label style={{ fontWeight: 'bold', color: '#333' }}>What skills are you missing?</label>
        <input 
          type="text" 
          value={missingSkills} 
          onChange={(e) => setMissingSkills(e.target.value)}
          placeholder="e.g., Python, Machine Learning, React, SQL"
          style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
          required
        />
        <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', alignSelf: 'flex-start' }}>
          Get Course Recommendations
        </button>
      </form>

      {hasSearched && (
        <section>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Recommended Courses</h2>
          {courses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {courses.map(course => (
                <div key={course.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ backgroundColor: platformColors[course.platform] || '#333', color: '#fff', padding: '10px 15px', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{course.platform}</span>
                    <span style={{ textTransform: 'capitalize' }}>{course.skill}</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>{course.title}</h3>
                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>Level: <strong>{course.level}</strong></p>
                    <button style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>
                      View Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No courses found for those skills in our mock database. Try "Python" or "Machine Learning".
            </p>
          )}
        </section>
      )}
    </div>
  );
};

export default CourseRecommendationSystem;