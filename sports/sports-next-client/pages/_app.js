"use client";

import dynamic from "next/dynamic";
import "@/styles/globals.css";
import { AdminProvider } from "@/contexts/admin_context";
import { NBAProvider } from "@/components/nba/nba_context";

const AdminLayout = dynamic(() => import("../components/admin_layout"));

export default function App({ Component, pageProps }) {
  return (
    <AdminProvider>
      <AdminLayout>
        <NBAProvider>
          <Component {...pageProps} />
        </NBAProvider>
      </AdminLayout>
    </AdminProvider>
  );
}
