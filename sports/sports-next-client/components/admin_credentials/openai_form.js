import { useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";
import { verifyOpenaiCredentials } from "@/apis/admin_apis";

export const OpenaiKeyForm = () => {
  const { openaiKey, setOpenaiKey } = useContext(AdminContext);

  const isAdded = openaiKey.added;

  const handleOpenaiKeyChange = (event) => {
    setOpenaiKey({ key: event.target.value, added: false });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const res = verifyOpenaiCredentials(openaiKey.key);
    if (res.status === "success") {
      setOpenaiKey({ key: openaiKey.key, added: true });
    } else {
      setOpenaiKey({ key: openaiKey.key, added: false });
    }
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
          value={openaiKey.key || ""}
          onChange={handleOpenaiKeyChange}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded"
      >
        Submit
      </button>
      {isAdded && (
        <div className="mt-4">
          <p className="text-green-500">Key Uploaded!</p>
        </div>
      )}
    </form>
  );
};
