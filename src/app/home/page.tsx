'use client'
import React, { useState } from 'react';
import Sidebar from '@/components/student_sidebar/student_sidebar';
import ViewClearance from '@/components/student_clearance/student_clearance/student_clearance';
import ApprovedClearance from '@/components/student_clearance/clearance_status/clearance_status';
import Header from '@/components/header/header';
import DisapprovedClearance from '@/features/students/disapprovedClearance/DisapprovedClearance';



const Home = () => {
  const [currentSection, setCurrentSection] = useState('View Clearance');

  const renderSection = () => {
    switch (currentSection) {
      case 'View Clearance':
        return <ViewClearance/>;
      case 'Clearance Status':
        return <ApprovedClearance/>;
      case 'Disapproved Clearance':
        return <DisapprovedClearance />
      default:
        return <ViewClearance />;
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
