/* global Promise */
import React, { useState, useEffect, useContext } from "react";
import dynamic from "next/dynamic";

import LoadingSpinner from "./components/loading_spinner";

import { capturePosthog } from "../utils/posthog";

import { SearchContext } from "./contexts/search_context";

import loadShotChart from "../nba/shot_chart";

import {
  DarkModeButton,
  DiscordButton,
  GithubButton,
} from "../widgets/buttons";
import SearchBar from "./search_bar";
import { notify } from "../widgets/toast";

import { textToSql } from "@/apis/streaming_query_apis";

let api_endpoint = "http://localhost:9000";

let userId = null;

const ResultsContainer = dynamic(
  () => import("./components/results_container"),
  {
    ssr: false,
  }
);

const QueryScreen = (props) => {
  const [sql, setSQL] = useState("");
  const [tableInfo, setTableInfo] = useState({ rows: [], columns: [] });
  const [errorMessage, setErrorMessage] = useState("");
  const [showExplanationModal, setShowExplanationModal] = useState("");
  const [isGetTablesLoading, setIsGetTablesLoading] = useState(false);
  const [tableNames, setTableNames] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [sqlExplanationIsOpen, setSqlExplanationIsOpen] = useState(false);
  const [sqlExplanation, setSqlExplanation] = useState();
  const [isExplainSqlLoading, setIsExplainSqlLoading] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("Enter Something");

  const { setQuery, setTitle, setSearchParams } = useContext(SearchContext);

  const tableColumns = tableInfo?.columns;
  const tableRows = tableInfo?.rows;
  // Add system dark mode

  useEffect(() => {
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (errorMessage !== "") {
      console.log(errorMessage);
      notify(errorMessage);
    }
  }, [errorMessage]);

  useEffect(() => {
    let playerData = [
      ["MISS K. Leonard 25' pullup 3PT", -87.0, 235.0, 0],
      ["MISS K. Leonard 3PT", 230.0, 29.0, 0],
      ["MISS K. Leonard 28' 3PT", -42.0, 277.0, 0],
    ];
    loadShotChart(playerData);
  }, [])

  const clearAll = () => {
    setQuery("");
    setSQL("");
    setErrorMessage("");
    setTableInfo({ rows: [], columns: [] });
    setTitle("yolo");
    setSqlExplanationIsOpen(false);
    setSqlExplanation();
    setTableNames();
    setIsLoading(false);
  };

  const clearAllButQuery = () => {
    setSQL("");
    setErrorMessage("");
    setTableInfo({ rows: [], columns: [] });
    setTitle("yolo");
    setSqlExplanationIsOpen(false);
    setSqlExplanation();
    setTableNames();
    setIsLoading(false);
  };

  const getSession = async () => {
    const options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        scope: props.version === "San Francisco" ? "SF" : "USA",
      }),
    };

    fetch(api_endpoint + "/api/session", options)
      .then((response) => response.json())
      .then((response) => {})
      .catch((error) => {
        console.log("error", error);
        capturePosthog("backend_error", error);
      });
  };

  const fetchBackend = async (natural_language_query) => {
    if (natural_language_query == null) {
      return;
    }
    // Don't send a request if the query is empty!
    natural_language_query = natural_language_query.trim();
    if (!natural_language_query.length) return;

    setTableNames();
    setSqlExplanation();
    setShowExplanationModal(false);

    // clear previous layers
    clearAllButQuery();

    // Set the loading state
    setIsLoading(true);

    const startTime = new Date().getTime();

    const response = await textToSql(natural_language_query);

    setDisplayMessage("");

    if (response) {
      console.log("response: ", response);
      if (response.status === "success") {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let results = [];
        let done = false;
        let buffer = "";

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) {
            done = true;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const jsonStr = lines[i];
            const json = JSON.parse(jsonStr);
            results.push(json);
            if (json.state) {
              setDisplayMessage((oldMessage) => oldMessage + "\n" + json.state);
            }
            if (json.final_answer) {
              console.log("final answer: ", json);
              setSQL(json.sql_query);
              let filteredColumns = [];
              filteredColumns = json.response.column_names;

              // Fit the order of columns and filter out lat and long row values
              let rows = json.response.results.map((value) => {
                let row = [];
                // Find each of the filtered column value in the object and push it into the row
                filteredColumns.map((c) => row.push(value[c]));
                return row;
              });
              setTableInfo({ rows, columns: filteredColumns });
            }
          }

          buffer = lines[lines.length - 1];
        }
        buffer += decoder.decode();
        if (buffer) {
          const json = JSON.parse(buffer);
          results.push(json);
        }
      }
      // Handle errors
      if (!["success", "working"].includes(response.status)) {
        capturePosthog("backend_error", response);
        setErrorMessage(
          "Something went wrong. Please try again or try a different query"
        );
        setTableNames();
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setDisplayMessage("");
      return;
    }
  };

  return (
    <main
      className="h-screen bg-white dark:bg-dark-900 dark:text-white overflow-y-auto max-h-screen"
      style={{ position: "relative" }}
    >
      <div id="shot-chart"/>

      <div className="App flex flex-col h-full">
        <link
          href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css"
          rel="stylesheet"
        />

        <div className="relative w-full flex flex-col p-6 space-y-1.5 bg-gradient-to-b bg/10 backdrop-blur-sm pb-2.5 from-white dark:from-transparent z-50">
          <div className="inline-flex gap-x-2 align-middle justify-center mb-6">
            <GithubButton />
            <DiscordButton />
            <DarkModeButton />
          </div>

          <h1
            className="text-4xl font-bold text-black dark:text-white flex items-start justify-center"
            style={{ cursor: "pointer" }}
            onClick={() => {
              clearAll();
            }}
          >
            Streaming Sports GPT
            <div className="text-blue-600 font-bold uppercase text-sm ml-2 mt-[4px]">
              BETA
            </div>
          </h1>

          <div className="block px-6 pb-2">
            <SearchBar version={props.version} fetchBackend={fetchBackend} />
          </div>
        </div>
        {displayMessage && (
          <div className="text-center" style={{ whiteSpace: "pre" }}>
            {displayMessage}
          </div>
        )}

        <LoadingSpinner
          isLoading={isLoading || isGetTablesLoading}
          message={displayMessage}
        />
        {sql.length === 0 && !isLoading && !isGetTablesLoading ? (
          <div className="gap-3 flex flex-col w-full items-center">
            <div>enter something</div>
          </div>
        ) : (
          isLoading && <> </>
        )}
        {!!tableRows?.length && (
          <ResultsContainer
            tableInfo={tableInfo}
            sql={sql}
            props={props}
            isLoading={isLoading}
            isGetTablesLoading={isGetTablesLoading}
            setQuery={setQuery}
            fetchBackend={fetchBackend}
            tableColumns={tableColumns}
            tableRows={tableRows}
            tableNames={tableNames}
            sqlExplanationIsOpen={sqlExplanationIsOpen}
            setSqlExplanationIsOpen={setSqlExplanationIsOpen}
            isExplainSqlLoading={isExplainSqlLoading}
            sqlExplanation={sqlExplanation}
            setSQL={setSQL}
            isStartingState={false}
          />
        )}
      </div>
    </main>
  );
};

export default QueryScreen;
