import React, { useState } from 'react'; // Import useState
import Sidebar from '../components/sideBar'; // Ensure correct import
import Navbar from '../components/Navbar'; // Ensure correct import
import DynamicTabs from '../components/DynamicTabs'; // Ensure correct import

const Data = ({onLogout}) => {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleToggleSidebar = (expanded) => {
        setSidebarExpanded(expanded);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f4f4] w-full">
            {/* Sidebar Section */}
            <div className={`transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
                <Sidebar onToggle={handleToggleSidebar} onLogout={onLogout}/>
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
                <div className="flex-grow mt-16 p-5 overflow-auto"> {/* Adjust margin top to prevent overlap with navbar */}
                    <DynamicTabs uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles}/>
                </div>
            </div>
        </div>
    );
}

export default Data;
