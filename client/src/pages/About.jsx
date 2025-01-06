import React, { useState } from 'react';
import { data_pic, backgroundImage } from '../assets';
import styles from '../style';
import Sidebar from '../components/sideBar'; // Ensure correct import
import Navbar from '../components/Navbar'; // Ensure correct import

const AboutUs = ({onLogout}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleToggleSidebar = (expanded) => {
    setSidebarExpanded(expanded);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Section */}
      <div className={`transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
        <Sidebar onToggle={handleToggleSidebar} expanded={sidebarExpanded} onLogout={onLogout}/>
      </div>

      {/* Main Content Section */}
      <div className="flex-1 flex flex-col">
        {/* Navbar Section */}
        <div
          className={`fixed top-0 left-0 w-full z-10 bg-primary transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-20'}`}
          style={{ width: `calc(100% - ${sidebarExpanded ? '16rem' : '5rem'})` }}
        >
          <Navbar />
        </div>

        {/* Content Section */}
        <div
          className="flex-1 relative bg-third"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            className={`flex flex-col items-start justify-center w-full h-full bg-opacity-80 p-8 rounded-lg ${styles.paddingY}`}
          >
            <h1 className="text-white text-5xl font-bold mb-6">About Us</h1>
            <div className="flex flex-col md:flex-row items-center">
              <div className="text-#1b1b1b font-semibold text-lg leading-relaxed mb-6 md:mb-0 md:w-1/2">
                <p>
                  Offering an intuitive web application that uses advanced data masking techniques to protect confidential data throughout its lifecycle. Tailored for end users like teachers, it minimizes the risk of data breaches and ensures compliance with international security policies.
                </p>
                <p>
                  By providing user-friendly tools and essential knowledge, SecurMask enhances data privacy and reduces vulnerability to cybercrimes, filling a crucial gap in Malaysia’s data protection landscape.
                </p>
              </div>
              <div className="flex justify-center pl-5 md:pl-20 ml-14 ">
                <img
                  src={data_pic}
                  alt="Data Security"
                  className="rounded-lg w-[350px] h-[350px] "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
