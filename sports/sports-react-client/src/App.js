import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CredentialsScreen from "./components/admin_credentials/credentials-screen";
import DatabaseScreen from "./components/admin_database/database-screen";
import QueryScreen from "./components/query/query-screen";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/credentials" element={<CredentialsScreen />} />
        <Route path="/database" element={<DatabaseScreen />} />
        <Route path="*" element={<QueryScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
