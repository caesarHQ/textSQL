import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/admin_layout";
import CredentialsScreen from "./components/admin_credentials/credentials_screen";
import DatabaseScreen from "./components/admin_database/database_screen";
import QueryScreen from "./components/query/query_screen";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<QueryScreen />} />
          <Route path="credentials" element={<CredentialsScreen />} />
          <Route path="database" element={<DatabaseScreen />} />
          <Route path="query" element={<QueryScreen />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
