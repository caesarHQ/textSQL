export const DatabaseConfigPicker = ({ config, setConfig }) => {
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
