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

const ExampleEditor = (example, setExample) => {
  return (
    <div>
      <textarea
        value={example.query}
        onChange={(e) => setExample({ ...example, query: e.target.value })}
      />
      <textarea
        value={example.sql}
        onChange={(e) => setExample({ ...example, sql: e.target.value })}
      />
    </div>
  );
};
