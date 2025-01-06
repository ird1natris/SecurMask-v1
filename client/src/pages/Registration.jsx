import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../style';
import { logo, infocircle, loginimage, Vector, google } from '../assets';
import axios from 'axios';
import Swal from "sweetalert2";

const Registration = () => {
  const navigate = useNavigate();

  // State variables for form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Navigate back to login
  const handleBackLogin = () => {
    navigate('/');
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic form validation
    // Password matching check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    // Password format validation (at least 8 characters, 1 special char, 1 number, 1 lowercase, 1 uppercase)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, include at least one special character, one number, one lowercase letter, and one uppercase letter.');
      setLoading(false);
      return;
    }

    try {
      // Make the POST request to the backend
      const response = await axios.post('http://localhost:8081/register', { fullName, email, password });
      console.log('Registration successful:', response.data);
      Swal.fire({
        icon: "success",
        title: "Account Registration Success",
        text: "Successfully Registered!. Proceed to login.",
      });

      // Redirect to login page after successful registration
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err.response ? err.response.data : err.message);
      Swal.fire({
        icon: "error",
        title: "Fail To Register",
        text: "Registration fail!, please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`bg-login flex ${styles.paddingY} h-screen w-full overflow-y-auto`}
      style={{
        backgroundImage: `url(${Vector})`,
        backgroundSize: 'cover', // This makes the background image stretch
        backgroundPosition: 'center', // Centers the background image
        backgroundRepeat: 'no-repeat',
      }}
    >
      <form onSubmit={handleSubmit}>
        <div className={`flex-1 flex flex-col xl:px-0 sm:px-16 px-6`}>
          <div className="flex flex-col items-start justify-center mb-3 rounded shadow-md w-[386px] h-auto ">
            <img src={logo} className="w-[175px] h-[36px]" alt="Logo" />

            <h2 className="text-2xl font-poppins text-white font-semibold mb-6">Create account</h2>
            <p className="w-[226px] text-[#9695b9] text-lg font-normal font-['Roboto'] leading-[1px] mb-5">
              Let’s secure your data with us!
            </p>

            <label htmlFor="name" className="text-white text-xs font-normal font-['Roboto'] leading-normal mb-2">Full Name</label>
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="  Irdina Aiyani"
              className="shadow-md w-full h-[50px] rounded border border-[#eaeaf1] mb-4"
              required
            />

            <label htmlFor="email" className="text-white text-xs font-normal font-['Roboto'] leading-normal mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="  Email"
              className="shadow-md w-full h-[50px] rounded border border-[#eaeaf1] mb-4"
              required
            />

            <label htmlFor="password" className="text-white text-xs font-normal font-['Roboto'] leading-normal mb-2">Create Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="  ••••••••"
              className="shadow-md w-full h-[50px] rounded border border-[#eaeaf1] mb-4"
              required
            />

            <label htmlFor="confirmPassword" className="text-white text-xs font-normal font-['Roboto'] leading-normal mb-2">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="  ••••••••"
              className="shadow-md w-full h-[50px] rounded border border-[#eaeaf1] mb-4"
              required
            />

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword" className="text-white text-sm font-normal font-['Roboto'] cursor-pointer">Show Password</label>
            </div>

            <button
              type="submit"
              className="w-full h-[60px] bg-[#875eff] text-white rounded-[10px] border-2 border-[#875eff] mb-4 hover:bg-[#6d4c9a]"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Create account'}
            </button>

            <div className="flex items-center justify-center text-center text-[#9695b9]">
              <span className="text-sm mx-4 text-bold">or</span>
            </div>

            <div className="flex flex-col items-center mt-4">
              <p className="text-white text-sm">
                Already have an account?{' '}
                <Link to="/" className="text-[#875eff] font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="flex items-center mt-4 text-[#9695b9]">
              <img src={infocircle} className="mr-2 w-[20px] h-[20px]" alt="Info Icon" />
              <span className="text-sm">support(at)SecureMask.com</span>
            </div>
          </div>
        </div>
      </form>

      <div className="flex-1 flex items-center justify-center pr-10">
        <img
          src={loginimage}
          alt="loginImage"
          className="w-[696px] h-[784px] hidden sm:block" // This hides the image on smaller screens
        />
      </div>
    </section>
  );
};

export default Registration;
