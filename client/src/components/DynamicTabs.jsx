import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import FileContent from './FileContent';

const DynamicTabs = ({ uploadedFiles, setUploadedFiles }) => {
  const MAX_TABS = 4;

  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('data-history');
  const [openedTabs, setOpenedTabs] = useState([]);

  useEffect(() => {
    const dataHistoryTab = {
      name: 'Data History',
      fileId: 'data-history', // Unique identifier for Data History tab
      content: (
        <FileList
          onTab={handleTab}
          onDelete={handleDelete}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />
      ),
    };

    setTabs((prevTabs) => {
      const existingTabIndex = prevTabs.findIndex((tab) => tab.fileId === 'data-history');
      if (existingTabIndex === -1) {
        return [...prevTabs, dataHistoryTab];
      }
      const updatedTabs = [...prevTabs];
      updatedTabs[existingTabIndex] = dataHistoryTab;
      return updatedTabs;
    });
  }, [uploadedFiles]);

  const handleTab = (fileName, fileData, fileId, onMaskedUpdate, fileStatus,columns) => {
    setOpenedTabs((prevOpenedTabs) => {
      if (prevOpenedTabs.includes(fileId)) {
        setActiveTab(fileId);
        return prevOpenedTabs;
      }

      if (prevOpenedTabs.length >= MAX_TABS) {
        alert(`Cannot open more than ${MAX_TABS} tabs.`);
        return prevOpenedTabs;
      }

      const newTab = {
        name: fileName,
        fileId: fileId, 
        content: (
          <FileContent
            fileName={fileName}
            fileData={fileData}
            fileId={fileId}
            onMaskedUpdate={onMaskedUpdate}
            fileStatus={fileStatus}
            onTab={handleTab}
            columns={columns}
          />
        ),
      };

      setTabs((prevTabs) => [...prevTabs, newTab]);
      setOpenedTabs((prevOpenedTabs) => [...prevOpenedTabs, fileId]);
      setActiveTab(fileId);

      return [...prevOpenedTabs, fileId];
    });
  };
  

  const handleDelete = (fileId) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.fileId !== fileId));
    setOpenedTabs((prevOpenedTabs) => prevOpenedTabs.filter((id) => id !== fileId));
    if (activeTab === fileId) {
      setActiveTab(tabs.length > 1 ? tabs[0].fileId : 'data-history');
    }
  };

  return (
    <div>
      {/* Tabs container with responsiveness */}
      <div className="flex flex-wrap overflow-x-auto sm:flex-row sm:overflow-x-visible border-b border-solid border-[#ccc]">
        {tabs.map((tab, index) => (
          <div
            key={`${tab.fileId}-${index}`}
            className={`tab-button ${activeTab === tab.fileId ? 'bg-[#F4F4F4]' : 'bg-[#A6A6A6]'} 
              ${activeTab === tab.fileId ? 'active' : ''} p-2 cursor-pointer rounded-tl-[10px] rounded-tr-[10px] 
              border border-[#a5a5a5] mr-5 relative sm:w-auto w-full`}
          >
            <span onClick={() => setActiveTab(tab.fileId)}>{tab.name}</span>
            {tab.fileId !== 'data-history' && (
              <button
                onClick={() => handleDelete(tab.fileId)}
                className="ml-2 color-red font-bold cursor-pointer border-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="border border-solid border-[#ccc] border-t-none sm:p-4 ">
        {tabs.map((tab) =>
          activeTab === tab.fileId ? (
            <div
              key={tab.fileId}
              className={`${activeTab === tab.fileId ? 'bg-[#F4F4F4]' : 'bg-[#A6A6A6]'}`}
            >
              {tab.content}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default DynamicTabs;
