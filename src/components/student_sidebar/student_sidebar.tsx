'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { HiMenuAlt3 } from 'react-icons/hi';
import { MdEditDocument, MdOutlineDoneAll, MdLogout } from 'react-icons/md';
import Image from 'next/image';
import schoolLogo from '@/assets/bcclogo.png';

const StudentSidebar = ({ setCurrentSection }: any) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const sidebars = [
    { name: 'View Clearance', section: 'View Clearance', icon: MdEditDocument },
    { name: 'Approved Clearance', section: 'Approved Clearance', icon: MdOutlineDoneAll },
    { name: 'Logout', section: 'Logout', icon: MdLogout },
  ];

  const handleLogout = async () => {
    setLoading(true);
    
    // Simulate a delay or perform any logout actions
    setTimeout(() => {
      // Clear any authentication or session data here, if applicable
      // e.g., localStorage.removeItem('token');

      // Redirect to the login page
      router.push('/login');
    }, 3000); // 3-second delay for demonstration
  };

  const [open, setOpen] = useState(false);

  return (
    <div className={`flex ${open ? 'w-72' : 'w-16'} bg-gray-900 text-white duration-500`}>
      <div className={`fixed top-0 left-0 bottom-0 bg-gray-900 text-white ${open ? 'w-72' : 'w-16'} duration-500 px-4 overflow-hidden`}>
        <div className="flex justify-start py-3">
          <HiMenuAlt3 size={39} className="cursor-pointer" onClick={() => setOpen(!open)} />
        </div>

        <div className="flex justify-center items-center h-48">
          <Image src={schoolLogo} alt="School Logo" width={150} height={150} />
        </div>
        <div className="border-t-2 border-gray-500 w-full"></div>
        <div className={`flex justify-between p-3 ${open ? '' : 'hidden'}`}>
          Example Name
          <span>Student</span>
        </div>
        <div className="border-t-2 border-gray-500 w-full"></div>
        <div className='mt-4 flex flex-col gap-4 relative'>
          {
            sidebars.map((sidebar, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-4 p-2 cursor-pointer hover:bg-gray-700 hover:text-white group rounded-md ${open ? 'pl-4' : 'pl-2'}`}
                onClick={() => {
                  if (sidebar.name === 'Logout') {
                    handleLogout();
                  } else {
                    setCurrentSection(sidebar.section);
                  }
                }}
              >
                <div>
                  {React.createElement(sidebar.icon, { size: 20 })}
                </div>
                <h2 className={`whitespace-nowrap duration-500 ${!open && 'opacity-0 translate-x-28 overflow-hidden'}`}>
                  {sidebar.name}
                </h2>
                <h2 className={`${open && 'hidden'} z-50 absolute left-48 bg-white font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg px-0 py-0 group-hover:px-2 group-hover:py-1 group-hover:left-14 group-hover:duration-300 w-0 overflow-hidden group-hover:w-fit`}>{sidebar?.name}</h2>
              </div>
            ))
          }
        </div>
        
        {loading && (
          <div className="fixed top-0 left-0 right-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="text-white text-lg">Logging out...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSidebar;