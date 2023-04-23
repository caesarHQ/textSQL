"use client";

import dynamic from "next/dynamic";
import "@/styles/globals.css";
import { AdminProvider } from "@/contexts/admin_context";

const AdminLayout = dynamic(() => import("../components/admin_layout"));

export default function App({ Component, pageProps }) {
  return (
    <AdminProvider>
      <AdminLayout>
        <Component {...pageProps} />
      </AdminLayout>
    </AdminProvider>
  );
}
