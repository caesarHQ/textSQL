/* global Promise */
import React, { useState, useEffect, useContext } from "react";
import dynamic from "next/dynamic";

import LoadingSpinner from "./components/loading_spinner";

import { logSentryError } from "../utils/sentry";
import { capturePosthog } from "../utils/posthog";

import { SearchContext } from "./contexts/search_context";

import {
  DarkModeButton,
  DiscordButton,
  GithubButton,
} from "../widgets/buttons";
import SearchBar from "./search_bar";
import { notify } from "../widgets/toast";

import { textToSql } from "@/apis/query_apis";

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

    let responseOuter = null;
    // Send the request

    const startTime = new Date().getTime();

    const response = await textToSql(natural_language_query);

    console.log("response: ", response);

    setIsLoading(false);

    // Handle errors
    if (!response.status === "success") {
      capturePosthog("backend_error", response);
      setErrorMessage(
        "Something went wrong. Please try again or try a different query"
      );
      setTableNames();
      return;
    }

    if (!("sql_query" in response) || !response.result) {
      capturePosthog("backend_error", response);
      setShowExplanationModal("attempted");
      setTableNames();
      return;
    }

    // Capture the response in posthog
    const duration = new Date().getTime() - startTime;

    capturePosthog("backend_response", {
      origin: "fetchBackend",
      duration,
    });

    // Set the state for SQL and Status Code
    responseOuter = response;
    setSQL(response.sql_query);

    // Filter out geolocation columns (lat, long, shape)
    let filteredColumns = [];
    if (props.version === "Census") {
      filteredColumns = response.result.column_names.filter(
        (c) => c !== "lat" && c !== "long"
      );
    } else {
      filteredColumns = response.result.column_names.filter(
        (c) => c !== "lat" && c !== "long" && c !== "shape"
      );
    }

    // Fit the order of columns and filter out lat and long row values
    let rows = response.result.results.map((value) => {
      let row = [];
      // Find each of the filtered column value in the object and push it into the row
      filteredColumns.map((c) => row.push(value[c]));
      return row;
    });
    setTableInfo({ rows, columns: filteredColumns });
  };

  return (
    <main
      className="h-screen bg-white dark:bg-dark-900 dark:text-white overflow-y-auto max-h-screen"
      style={{ position: "relative" }}
    >
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
        <LoadingSpinner isLoading={isLoading || isGetTablesLoading} />
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
