import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/router";

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");

  const clearSearch = () => setQuery("");

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

  useEffect(() => {
    document.title = query || "Yolo let's see if this can do some work";
  }, [query]);

  return (
    <SearchContext.Provider
      value={{ query, setQuery, title, setTitle, setSearchParams, clearSearch }}
    >
      {children}
    </SearchContext.Provider>
  );
};
