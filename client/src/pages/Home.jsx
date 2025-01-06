import React, { useRef, useState } from "react";
import styles from "../style";
import { Detail, Statistics, Navbar, Sidebar, Fileupload, Hero } from "../components";

const Home = ({ onLogout }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileUploadRef = useRef(null);

  const handleToggleSidebar = (expanded) => {
    setSidebarExpanded(expanded);
  };

  return (
    <div className="flex h-screen w-full bg-third">
      {/* Sidebar Section */}
      <div
        className={`transition-all duration-300 bg-gray-800 ${
          sidebarExpanded ? "w-64" : "w-20"
        } min-h-screen`}
      >
        <Sidebar onToggle={handleToggleSidebar} expanded={sidebarExpanded} onLogout={onLogout} />
      </div>

      {/* Main Content Section */}
      <div className="flex-1 flex flex-col">
        {/* Navbar Section */}
        <div
          className={`fixed top-0 z-10 bg-primary transition-all duration-300 `}
          style={{ width: `calc(100% - ${sidebarExpanded ? "16rem" : "5rem"})` }}
        >
          <Navbar />
        </div>

        {/* Content Section */}
        <div className="pt-16 flex-1 overflow-auto flex flex-col">
          {/* Hero Section */}
          <div className="flex justify-center items-center bg-third py-6 px-4">
            <div className="w-full max-w-7xl">
              <Hero fileUploadRef={fileUploadRef} />
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-[#43005D] py-6 px-4">
            <div className="w-full max-w-7xl mx-auto">
              <Statistics />
            </div>
          </div>

          {/* Detail Section */}
          <div className="bg-gray-100 py-6 px-4">
            <div className="w-full max-w-7xl mx-auto">
              <Detail />
            </div>
          </div>

          {/* File Upload Section */}
          <div
            ref={fileUploadRef}
            className="bg-gray-100 py-6 px-4 flex justify-center items-center"
          >
            <div className="w-full max-w-7xl">
              <Fileupload uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
