import { useState } from "react";

export const DatabaseConfigComponent = () => {
  const [config, setConfig] = useState("url");

  return (
    <div className="border border-gray-300 p-4 rounded">
      <div className="mb-4">
        <DatabaseConfigPicker config={config} setConfig={setConfig} />
      </div>
      <div className="border-t border-gray-300 pt-4">
        {config === "url" && <DatabaseURLForm />}
        {config === "fields" && <DatabaseFieldForm />}
      </div>
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

const DatabaseURLForm = () => {
  const [url, setUrl] = useState("");

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Handle form submission
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
          value={url}
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
const DatabaseFieldForm = () => {
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [port, setPort] = useState("");
  const [database, setDatabase] = useState("");

  const handleHostChange = (event) => {
    setHost(event.target.value);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handlePortChange = (event) => {
    setPort(event.target.value);
  };

  const handleDatabaseChange = (event) => {
    setDatabase(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Handle form submission
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
          value={username}
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
          value={password}
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
          value={host}
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
          value={port}
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
          value={database}
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
