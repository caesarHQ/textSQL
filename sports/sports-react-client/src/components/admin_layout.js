// components/AdminLayout.js
import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";

const AdminLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAdminPanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex h-screen">
      <div
        className={`flex flex-col h-full w-64 bg-gray-100 transition-all duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <button
            onClick={toggleAdminPanel}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          <Link to="/credentials" className="text-gray-700 hover:text-blue-500">
            Credentials
          </Link>
          <Link to="/database" className="text-gray-700 hover:text-blue-500">
            Database
          </Link>
          <Link to="/query" className="text-gray-700 hover:text-blue-500">
            Query
          </Link>
        </nav>
      </div>
      <div className="flex-grow">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
