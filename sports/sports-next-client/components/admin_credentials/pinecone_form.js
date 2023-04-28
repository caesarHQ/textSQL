import { useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";
import { verifyPineconeCredentials } from "@/apis/admin_apis";

export const PineconeKeyForm = () => {
  const { pineconeKey, setPineconeKey } = useContext(AdminContext);

  const isAdded = pineconeKey.added;

  const handlePineconeKeyChange = (event) => {
    setPineconeKey({
      ...pineconeKey,
      key: event.target.value,
      added: false,
    });
  };

  const handlePineconeIndexChange = (event) => {
    setPineconeKey({
      ...pineconeKey,
      added: false,
      index: event.target.value,
    });
  };

  const handlePineconeEnvChange = (event) => {
    setPineconeKey({
      ...pineconeKey,
      added: false,
      env: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const res = verifyPineconeCredentials(pineconeKey);
    if (res.status === "success") {
      setPineconeKey({
        key: pineconeKey.key,
        added: true,
        index: pineconeKey.index,
        env: pineconeKey.env,
      });
    } else {
      setPineconeKey({
        key: pineconeKey.key,
        added: false,
        index: pineconeKey.index,
        env: pineconeKey.env,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="justify-start">
      <div className="flex items-center mb-4">
        <label
          htmlFor="pinecone-key"
          className="block mr-2 font-bold w-24 text-right"
        >
          Pinecone API Key:
        </label>
        <input
          type="text"
          id="pinecone-key"
          className="border border-gray-400 p-2 rounded w-64"
          value={pineconeKey.key || ""}
          onChange={handlePineconeKeyChange}
        />
      </div>
      <div className="flex items-center mb-4">
        <label
          htmlFor="pinecone-index"
          className="block mr-2 font-bold w-24 text-right"
        >
          Pinecone Index:
        </label>
        <input
          type="text"
          id="pinecone-index"
          className="border border-gray-400 p-2 rounded w-64"
          value={pineconeKey.index || ""}
          onChange={handlePineconeIndexChange}
        />
      </div>
      <div className="flex items-center mb-4">
        <label
          htmlFor="pinecone-env"
          className="block mr-2 font-bold w-24 text-right"
        >
          Pinecone Env:
        </label>
        <input
          type="text"
          id="pinecone-env"
          className="border border-gray-400 p-2 rounded w-64"
          value={pineconeKey.env || ""}
          onChange={handlePineconeEnvChange}
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
