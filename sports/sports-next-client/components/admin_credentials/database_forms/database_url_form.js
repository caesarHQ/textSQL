import { useContext } from "react";
import { AdminContext } from "@/contexts/admin_context";
import { convertConnectionUrlToFields } from "../utils";

export const DatabaseURLForm = ({ handleSubmit }) => {
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
