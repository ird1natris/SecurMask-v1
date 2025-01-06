import React from 'react';
import { logo } from '../assets';

const LoadingPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <img src={logo} className="w-[300px] h-[80px] pt-5 mb-8" alt="Logo" />
            <div className="w-12 h-12 border-8 border-t-8 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-8"></div> {/* Added mb-8 for space below the spinner */}
            <h2 className="text-[#747a85] text-2xl font-medium font-['Inter']">“Privacy is Best Guaranteed by Anonymity”</h2>
        </div>
    );
};

export default LoadingPage;
