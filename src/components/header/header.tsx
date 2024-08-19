import React from 'react';

const Header = ({ title }: any) => {
  return (
    <div className='p-8 text-black flex items-center text-lg border'>
        <span className="text-2xl font-bold">{title}</span>
    </div> 
  );
};

export default Header;
