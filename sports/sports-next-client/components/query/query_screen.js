/* global Promise */
import React, { useState, useEffect } from "react";

import LoadingSpinner from "./components/loading_spinner";

import { ResultsContainer } from "./components/results_container";

import { logSentryError } from "../utils/sentry";
import { capturePosthog } from "../utils/posthog";

import {
  DarkModeButton,
  DiscordButton,
  GithubButton,
} from "../widgets/buttons";
import SearchBar from "./search_bar";
import { notify } from "../widgets/toast";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";

import { textToSql } from "@/apis/query_apis";

// Add system dark mode
localStorage.theme === "dark" ||
(!("theme" in localStorage) &&
  window.matchMedia("(prefers-color-scheme: dark)").matches)
  ? document.documentElement.classList.add("dark")
  : document.documentElement.classList.remove("dark");

let api_endpoint = "http://localhost:9000";

let userId = null;
let sessionId = null;

function App(props) {
  const [query, setQuery] = useState("");
  const [sql, setSQL] = useState("");
  const [tableInfo, setTableInfo] = useState({ rows: [], columns: [] });
  const [errorMessage, setErrorMessage] = useState("");
  const [showExplanationModal, setShowExplanationModal] = useState("");
  const [isGetTablesLoading, setIsGetTablesLoading] = useState(false);
  const [tableNames, setTableNames] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [sqlExplanationIsOpen, setSqlExplanationIsOpen] = useState(false);
  const [sqlExplanation, setSqlExplanation] = useState();
  const [isExplainSqlLoading, setIsExplainSqlLoading] = useState(false);

  const tableColumns = tableInfo?.columns;
  const tableRows = tableInfo?.rows;

  useEffect(() => {
    document.title = query || "Yolo let's see if this can do some work";
  }, [query]);

  useEffect(() => {
    if (errorMessage !== "") {
      console.log(errorMessage);
      notify(errorMessage);
    }
  }, [errorMessage]);
  const router = useRouter();

  const setSearchParams = (searchValue) => {
    if (searchValue === "") {
      router.replace({
        pathname: router.pathname,
        search: "",
      });
      return;
    }
    const params = new URLSearchParams();
    params.set("s", searchValue);

    router.replace({
      pathname: router.pathname,
      search: params.toString(),
    });
  };

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

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setSearchParams(value);
    setQuery(value);
    setTitle("");
  };

  const handleClearSearch = () => {
    setQuery("");
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
      .then((response) => {
        sessionId = response.session_id;
      })
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

  const handleSearchClick = () => {
    setSearchParams(query);
    setTitle(query);
    capturePosthog("search_clicked", {
      natural_language_query: query,
      trigger: "button",
    });
    fetchBackend(query);
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
            Sports GPT
            <div className="text-blue-600 font-bold uppercase text-sm ml-2 mt-[4px]">
              BETA
            </div>
          </h1>

          <div className="block px-6 pb-2">
            <form
              autoComplete={"off"}
              className="flex justify-center"
              onSubmit={(event) => {
                event.preventDefault();
                handleSearchClick(event);
              }}
            >
              <SearchBar
                value={query}
                onSearchChange={handleSearchChange}
                onClear={handleClearSearch}
                version={props.version}
                setTitle={setTitle}
                setQuery={setQuery}
                fetchBackend={fetchBackend}
              />
            </form>
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
          title={title}
          isStartingState={false}
        />
      </div>
    </main>
  );
}

App.defaultProps = {
  version: "Census",
};

export default App;
