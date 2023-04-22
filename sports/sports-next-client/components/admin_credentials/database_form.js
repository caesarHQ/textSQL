import { useState } from "react";

export const DatabaseConfigComponent = () => {
  const [config, setConfig] = useState("url");

  return (
    <div>
      <DatabaseConfigPicker config={config} setConfig={setConfig} />
      {config === "url" && <DatabaseURLForm />}
      {config === "fields" && <DatabaseFieldForm />}
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
      <div className="mb-4">
        <label htmlFor="url" className="block mb-2 font-bold">
          URL
        </label>
        <input
          type="text"
          id="url"
          className="w-full border border-gray-400 p-2 rounded"
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
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="host" className="block mb-2 font-bold">
          Host URL
        </label>
        <input
          type="text"
          id="host"
          className="w-full border border-gray-400 p-2 rounded"
          value={host}
          onChange={handleHostChange}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="username" className="block mb-2 font-bold">
          Username
        </label>
        <input
          type="text"
          id="username"
          className="w-full border border-gray-400 p-2 rounded"
          value={username}
          onChange={handleUsernameChange}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="password" className="block mb-2 font-bold">
          Password
        </label>
        <input
          type="password"
          id="password"
          className="w-full border border-gray-400 p-2 rounded"
          value={password}
          onChange={handlePasswordChange}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="port" className="block mb-2 font-bold">
          Port
        </label>
        <input
          type="text"
          id="port"
          className="w-full border border-gray-400 p-2 rounded"
          value={port}
          onChange={handlePortChange}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="database" className="block mb-2 font-bold">
          Database Name
        </label>
        <input
          type="text"
          id="database"
          className="w-full border border-gray-400 p-2 rounded"
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
