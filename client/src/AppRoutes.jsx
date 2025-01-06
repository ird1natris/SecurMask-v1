import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { About, ContactUs, Home, Login, Registration, ForgotPassword, Data,FileDisplay,Setting } from './pages';

const AppRoutes = ({ authenticated, handleLoginSuccess, handleLogout }) => {
  return (
    <Routes>
      {authenticated ? (
        <>
          <Route path="/homepage" element={<Home onLogout={handleLogout} />} />
          <Route path="/about-us" element={<About onLogout={handleLogout}/>} />
          <Route path="/contact" element={<ContactUs onLogout={handleLogout}/>} />
          <Route path="/folder" element={<Data onLogout={handleLogout}/>} />
          <Route path="/display" element={<FileDisplay onLogout={handleLogout}/>} />
          <Route path="/setting" element={<Setting onLogout={handleLogout}/>}/>
        </>
      ) : (
        <>
          <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </>
      )}
    </Routes>
  );
};

export default AppRoutes;