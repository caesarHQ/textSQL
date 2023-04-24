import { useEffect, useState } from "react";

import QueryScreen from "@/components/query/query_screen";

const Query = () => {
  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) {
    return <main>Loading...</main>;
  } else {
    return <QueryScreen />;
  }
};

export default Query;
