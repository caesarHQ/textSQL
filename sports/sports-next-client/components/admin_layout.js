import React, { useState, useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";
import Link from "next/link";

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { adminEnabled } = useContext(AdminContext);

  const toggleAdminPanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative flex flex-row h-full">
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
            <Link
              href="/example_management"
              className="text-gray-700 hover:text-blue-500"
            >
              Example Management
            </Link>

            <Link href="/" className="text-gray-700 hover:text-blue-500">
              Query
            </Link>

            <Link href="/nba" className="text-gray-700 hover:text-blue-500">
              NBA Asker
            </Link>
          </nav>
        </div>
      )}
      <div className={"flex-1"}>{children}</div>
      {adminEnabled && (
        <button
          onClick={toggleAdminPanel}
          style={{ left: isOpen ? "12rem" : "1rem", zIndex: 100 }}
          className="fixed bottom-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 z-10"
        >
          {isOpen ? "<" : ">"}
        </button>
      )}
    </div>
  );
};

export default AdminLayout;
