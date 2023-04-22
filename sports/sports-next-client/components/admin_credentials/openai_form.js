import { useState } from "react";

export const OpenaiKeyForm = () => {
  const [openaiKey, setOpenaiKey] = useState("");

  const handleOpenaiKeyChange = (event) => {
    setOpenaiKey(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Submit the form data, e.g. to a server.
    console.log("Submitted OpenAI API Key: ", openaiKey);
  };

  return (
    <form onSubmit={handleSubmit} className="justify-start">
      <div className="flex items-center mb-4">
        <label
          htmlFor="openai-key"
          className="block mr-2 font-bold w-24 text-right"
        >
          OpenAI API Key:
        </label>
        <input
          type="text"
          id="openai-key"
          className="border border-gray-400 p-2 rounded w-64"
          value={openaiKey}
          onChange={handleOpenaiKeyChange}
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
