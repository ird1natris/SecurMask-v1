import React, { useState, useEffect } from 'react';

const OtpModal = ({ otp, setOtp, otpError, handleOtpSubmit, closeModal, canResend, handleResendOtp,email }) => {
  const [timer, setTimer] = useState(60); // Initialize timer state
  const [isResendEnabled, setIsResendEnabled] = useState(canResend);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1); // Decrement the timer
      }, 1000);
    } else {
      setIsResendEnabled(true); // Enable resend button when the timer finishes
    }
    return () => clearInterval(interval); // Clean up interval when component unmounts or timer reaches 0
  }, [timer]);

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? `0${secs}` : secs}`;
  };

  const handleResend = () => {
    if (!isResendEnabled) return; // Do nothing if resend is disabled

    setIsResendEnabled(false); // Disable resend button while timer is active
    setTimer(60); // Reset timer to 60 seconds
    handleResendOtp(); // Call the parent function to handle OTP resend
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Verify OTP</h2>
          <button onClick={closeModal} className="text-red-500 font-bold">X</button>
        </div>
        <form onSubmit={handleOtpSubmit} className="mt-4">
          <label htmlFor="otp" className="text-sm">Enter OTP</label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-md mt-2 mb-4 px-3"
            maxLength="6"
          />
          {otpError && <p className="text-red-500 text-sm">{otpError}</p>}

          <button type="submit" className="w-full h-12 bg-[#875eff] text-white rounded-md mt-4">Verify OTP</button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">Resend OTP available in {formatTimer(timer)}</span>
        </div>
        <div className="mt-2 text-center">
          <button
            onClick={handleResend}
            disabled={!isResendEnabled || timer > 0}
            className={`text-sm ${!isResendEnabled || timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#875eff] hover:text-[#6f47d1]'}`}
          >
            {timer > 0 ? 'Please wait...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
