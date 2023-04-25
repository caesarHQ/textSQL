import React, { useState } from "react";
import Link from "next/link";

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAdminPanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative h-screen flex">
      {isOpen && (
        <div className="h-full w-64 bg-gray-100">
          <nav className="flex flex-col p-4 space-y-2">
            <Link
              href="/credentials"
              className="text-gray-700 hover:text-blue-500"
            >
              Credentials
            </Link>
            <Link
              href="/database"
              className="text-gray-700 hover:text-blue-500"
            >
              Database
            </Link>
            <Link href="/" className="text-gray-700 hover:text-blue-500">
              Query
            </Link>
            <Link href="/sports" className="text-gray-700 hover:text-blue-500">
              Sports
            </Link>
          </nav>
        </div>
      )}
      <div className={"flex-1"}>{children}</div>
      <button
        onClick={toggleAdminPanel}
        style={{ left: isOpen ? "12rem" : "1rem", zIndex: 100 }}
        className="absolute top-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 z-10"
      >
        {isOpen ? "<" : ">"}
      </button>
    </div>
  );
};

export default AdminLayout;
