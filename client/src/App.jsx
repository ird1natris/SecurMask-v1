import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './AppRoutes'; // Import AppRoutes
import LoadingPage from './pages/LoadingPage'; // Adjust path if necessary

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const verifyToken = () => {
    console.log("Verifying token...");
    axios.get('http://localhost:8081/verifyToken', { withCredentials: true })
      .then(res => {
        if (res.data.Status === 'Success') {
          setAuthenticated(true);
          console.log("Token verified, user authenticated.");
          navigate('/homepage'); // Navigate only after successful verification
        } else {
          handleInvalidToken();
        }
      })
      .catch(err => {
        console.error('Token verification failed:', err.response?.data?.message || err);
        handleInvalidToken(); // Handle invalid token case
      })
      .finally(() => {
        setLoading(false); // Set loading to false here to indicate verification is done
      });
  };

  const handleInvalidToken = () => {
    setAuthenticated(false);
    console.log("Token invalid or expired, redirecting to login...");
    document.cookie = 'token=; Max-Age=0'; // Clear token
    navigate('/'); // Redirect to login
  };

  // Handle login success
  const handleLoginSuccess = () => {
    console.log("User logged in, verifying token...");
    verifyToken(); // Verify token after login
  };

  const handleLogout = () => {
    axios.post('http://localhost:8081/logout', {}, { withCredentials: true })
      .then(() => {
        document.cookie = 'token=; Max-Age=0'; // Clear cookie
        setAuthenticated(false);
        navigate('/');
      })
      .catch(err => console.error('Logout error:', err));
  };

  useEffect(() => {
    verifyToken(); // Verify token on initial load
  }, []);

  if (loading) {
    return <LoadingPage />; // Show loading page while the app is verifying the token
  }

  return (
    <div className="bg-primary h-screen overflow-hidden flex">
      <AppRoutes 
        authenticated={authenticated} 
        handleLoginSuccess={handleLoginSuccess} 
        handleLogout={handleLogout} 
      />
    </div>
  );
};

export default App;
