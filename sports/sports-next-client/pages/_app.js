"use client";

import dynamic from "next/dynamic";

const AdminLayout = dynamic(() => import("../components/admin_layout"));
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <AdminLayout>
      <Component {...pageProps} />
    </AdminLayout>
  );
}
