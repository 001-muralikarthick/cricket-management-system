import React, { useState } from 'react';
import API from '../api';
import './AuthPage.css'; // New CSS file for styling

// Placeholder for Google Sign-In component/logic
const GoogleSignInButton = ({ onGoogleSuccess }) => {
  const handleGoogleLogin = () => {
    // In a real app, you would use the Google Identity Services library.
    // This is a placeholder to simulate the flow.
    console.log("Simulating Google Sign-In...");
    const mockGoogleToken = 'mock-google-id-token';
    onGoogleSuccess(mockGoogleToken);
  };

  return (
    <button type="button" className="google-btn" onClick={handleGoogleLogin}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google logo" />
      Sign in with Google
    </button>
  );
};


function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (token) => {
    setLoading(true);
    setError('');
    try {
      // The backend verifies the token and returns user data + session token
      const res = await API.post('/auth/google', { token });
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login' ? { email, password } : { name, email, password };
      const res = await API.post(url, payload);
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || `An error occurred during ${mode}.`);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'login' ? 'signup' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to continue to your dashboard.' : 'Join now to track your cricket journey.'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Virat Kohli"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="button primary full-width" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <GoogleSignInButton onGoogleSuccess={handleGoogleSuccess} />

        <p className="toggle-mode">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button onClick={toggleMode}>{mode === 'login' ? 'Sign Up' : 'Login'}</button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;