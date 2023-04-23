import { useState, useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";
import { convertConnectionUrlToFields } from "./utils";
import { DatabaseConfigPicker } from "./database_forms/database_config_picker";
import { DatabaseFieldForm } from "./database_forms/database_field_form";
import { DatabaseURLForm } from "./database_forms/database_url_form";

import { verifyDatabaseCredentials } from "@/apis/admin_apis";

export const DatabaseConfigComponent = () => {
  const { dbInfo, setDbInfo } = useContext(AdminContext);

  const isConnected = dbInfo?.connectionVerified;

  const [config, setConfig] = useState("url");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const res = await verifyDatabaseCredentials(
      convertConnectionUrlToFields(dbInfo.urlString)
    );
    if (res.status === "success") {
      setDbInfo({ ...dbInfo, connectionVerified: true });
    } else {
      setDbInfo({ ...dbInfo, connectionVerified: false });
    }
  };

  return (
    <div className="border border-gray-300 p-4 rounded">
      <div className="mb-4">
        <DatabaseConfigPicker config={config} setConfig={setConfig} />
      </div>
      <div className="border-t border-gray-300 pt-4">
        {config === "url" && <DatabaseURLForm handleSubmit={handleSubmit} />}
        {config === "fields" && (
          <DatabaseFieldForm handleSubmit={handleSubmit} />
        )}
      </div>
      {isConnected && (
        <div className="mt-4">
          <p className="text-green-500">Connection verified!</p>
        </div>
      )}
    </div>
  );
};
