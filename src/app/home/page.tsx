'use client'
import React, { useState } from 'react';
import Sidebar from '@/components/student_sidebar/student_sidebar';
import StudentClearanceView from '@/components/student_clearance/clearance_status/clearance_status';
import PendingStatus from '@/components/student_clearance/pending_status/pending_status';
import Header from '@/components/header/header';
import ApprovedStatus from '@/components/student_clearance/approved_status/approved_status';
import DisapprovedStatus from '@/components/student_clearance/disapproved_status/disapproved_status';

const Home = () => {
  const [currentSection, setCurrentSection] = useState('Clearance Status');

  const renderSection = () => {
    switch (currentSection) {
      case 'Clearance Status':
        return <StudentClearanceView/>;
      case 'Pending List':
        return <PendingStatus />;
      case 'Approved List':
        return <ApprovedStatus />;
      case 'Disapproved List':
        return <DisapprovedStatus />;
      default:
        return <StudentClearanceView />;
    }
  };

  return (
    <div className="bg-white min-h-screen flex">
      <div className="relative">
        <Sidebar setCurrentSection={setCurrentSection} />
      </div>
      <div className="w-full min-h-screen text-black">
        <Header title={currentSection}/>
        {renderSection()}
      </div>
    </div>
  );
};

export default Home;
