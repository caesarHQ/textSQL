import { useState, useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";
import {
  convertConnectionFieldsToUrl,
  convertConnectionUrlToFields,
} from "./utils";

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

const DatabaseConfigPicker = ({ config, setConfig }) => {
  const handleConfigChange = (event) => {
    setConfig(event.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="config" className="block mb-2 font-bold">
        Configuration
      </label>
      <select
        id="config"
        className="w-full border border-gray-400 p-2 rounded"
        value={config}
        onChange={handleConfigChange}
      >
        <option value="url">URL</option>
        <option value="fields">Fields</option>
      </select>
    </div>
  );
};

const DatabaseURLForm = ({ handleSubmit }) => {
  const { dbInfo, setDbInfo } = useContext(AdminContext);

  const handleUrlChange = (event) => {
    setDbInfo({
      ...dbInfo,
      urlString: event.target.value,
      fields: convertConnectionUrlToFields(event.target.value),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center mb-4">
        <label htmlFor="url" className="block mr-2 font-bold">
          URL
        </label>
        <input
          type="text"
          id="url"
          className="w-3/4 border border-gray-400 p-2 rounded"
          placeholder="postgresql://username:password@host:port/database"
          value={dbInfo?.urlString || ""}
          onChange={handleUrlChange}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded"
      >
        Submit
      </button>
    </form>
  );
};

const DatabaseFieldForm = ({ handleSubmit }) => {
  const { dbInfo, setDbInfo } = useContext(AdminContext);

  const handleHostChange = (event) => {
    const old_info = dbInfo.fields;
    const new_info = {
      ...old_info,
      host: event.target.value,
    };
    setDbInfo({
      ...dbInfo,
      fields: new_info,
      urlString: convertConnectionFieldsToUrl(new_info),
    });
  };

  const handleUsernameChange = (event) => {
    const old_info = dbInfo.fields;
    const new_info = {
      ...old_info,
      username: event.target.value,
    };
    setDbInfo({
      ...dbInfo,
      fields: new_info,
      urlString: convertConnectionFieldsToUrl(new_info),
    });
  };

  const handlePasswordChange = (event) => {
    const old_info = dbInfo.fields;
    const new_info = {
      ...old_info,
      password: event.target.value,
    };
    setDbInfo({
      ...dbInfo,
      fields: new_info,
      urlString: convertConnectionFieldsToUrl(new_info),
    });
  };

  const handlePortChange = (event) => {
    const old_info = dbInfo.fields;
    const new_info = {
      ...old_info,
      port: event.target.value,
    };
    setDbInfo({
      ...dbInfo,
      fields: new_info,
      urlString: convertConnectionFieldsToUrl(new_info),
    });
  };

  const handleDatabaseChange = (event) => {
    const old_info = dbInfo.fields;
    const new_info = {
      ...old_info,
      database: event.target.value,
    };
    setDbInfo({
      ...dbInfo,
      fields: new_info,
      urlString: convertConnectionFieldsToUrl(new_info),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="justify-start">
      <div className="flex items-center mb-4">
        <label
          htmlFor="username"
          className="block mr-2 font-bold w-24 text-right"
        >
          Username:
        </label>
        <input
          type="text"
          id="username"
          className="border border-gray-400 p-2 rounded w-64"
          value={dbInfo?.fields?.username || ""}
          onChange={handleUsernameChange}
        />
      </div>
      <div className="flex items-center mb-4">
        <label
          htmlFor="password"
          className="block mr-2 font-bold w-24 text-right"
        >
          Password:
        </label>
        <input
          type="password"
          id="password"
          className="border border-gray-400 p-2 rounded w-64"
          value={dbInfo?.fields?.password || ""}
          onChange={handlePasswordChange}
        />
      </div>
      <div className="flex items-center mb-4">
        <label htmlFor="host" className="block mr-2 font-bold w-24 text-right">
          Host:
        </label>
        <input
          type="text"
          id="host"
          className="border border-gray-400 p-2 rounded w-64"
          value={dbInfo?.fields?.host || ""}
          onChange={handleHostChange}
        />
      </div>
      <div className="flex items-center mb-4">
        <label htmlFor="port" className="block mr-2 font-bold w-24 text-right">
          Port:
        </label>
        <input
          type="text"
          id="port"
          className="border border-gray-400 p-2 rounded w-64"
          value={dbInfo?.fields?.port || ""}
          onChange={handlePortChange}
        />
      </div>
      <div className="flex items-center mb-4">
        <label
          htmlFor="database"
          className="block mr-2 font-bold w-24 text-right"
        >
          Database:
        </label>
        <input
          type="text"
          id="database"
          className="border border-gray-400 p-2 rounded w-64"
          value={dbInfo?.fields?.database || ""}
          onChange={handleDatabaseChange}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded"
      >
        Submit
      </button>
    </form>
  );
};
