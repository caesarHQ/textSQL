import { useState, useEffect } from "react";

export const ExamplesScreen = () => {
  const [examples, setExamples] = useState([]);

  const updateExample = (example, idx) => {
    const newExamples = [...examples];
    newExamples[idx] = example;
    setExamples(newExamples);
  };

  useEffect(() => {
    console.log("loaded");
  }, []);

  return (
    <div
      className="flex flex-col items-center py-2 bg-gray-50 dark:bg-gray-900"
      style={{ height: "100vh" }}
    >
      <div> Examples Go here</div>
      <div
        className="bg-blue-500 text-white py-2 px-4 rounded"
        onClick={() => {
          setExamples([{ query: "", sql: "" }, ...examples]);
        }}
      >
        Add Example
      </div>
      {examples.map((example, idx) => {
        return (
          <ExampleEditor
            example={example}
            setExample={(newExample) => updateExample(newExample, idx)}
            key={idx}
          />
        );
      })}
    </div>
  );
};

const ExampleEditor = ({ example, setExample }) => {
  return (
    //give it a nice border
    <div className="flex flex-row g-4 py-2 bg-gray-300 dark:bg-gray-900 rounded my-2 border border-gray-400 w-full items-center">
      <div className="flex flex-col w-full">
        <div>Example</div>
        <div className="flex flex-row items-center w-full">
          <div className="flex flex-col items-center justify-center mr-2 w-full">
            <div>Query</div>
            <textarea
              style={{ width: "300px", height: "100px" }}
              value={example.query}
              onChange={(e) =>
                setExample({ ...example, query: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col items-center justify-center mr-2">
            <div>SQL</div>
            <textarea
              style={{ width: "300px", height: "100px" }}
              value={example.sql}
              onChange={(e) => setExample({ ...example, sql: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
