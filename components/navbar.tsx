import React from 'react';
import Image from 'next/image'
import Navigation from "@/components/navigation"
import FullLogo from '../public/FullLogo.png'

const Navbar = () => {
 
  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <Image className="h-8 w-auto" src={FullLogo} alt="Reel Fuse Logo" priority/>
        </a>
        <div className="flex md:order-2 space-x-6 md:space-x-6 rtl:space-x-reverse">
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-sticky"
        >
          <Navigation />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;