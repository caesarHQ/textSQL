import { useEffect, useState } from "react";

import { SearchProvider } from "@/components/query/contexts/search_context";
import QueryScreen from "@/components/query/query_screen";

const Query = () => {
  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) {
    return <main>Loading...</main>;
  } else {
    return (
      <SearchProvider>
        <QueryScreen />;
      </SearchProvider>
    );
  }
};

export default Query;
