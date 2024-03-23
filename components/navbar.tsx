import React from 'react';
import Link from 'next/link';
import Image from 'next/image'
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import AuthButton from '../components/AuthButton'
import { UserButton } from "@clerk/nextjs";
import { OrganizationSwitcher } from "@clerk/nextjs"; 
import { SignInButton } from "@clerk/nextjs";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import Navigation from "@/components/navigation"
import logo from '../public/logo.svg'



const Navbar = () => {
 
  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <Image className="h-8" src={logo} alt="Michael Todd Beauty Logo"/>
        </a>
        <div className="flex md:order-2 space-x-6 md:space-x-6 rtl:space-x-reverse">
        <UserButton />
    <OrganizationSwitcher hidePersonal={true} />
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
