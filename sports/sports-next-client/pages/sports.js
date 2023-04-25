import { NbaDisplay } from "@/components/nba/nba_display";
import { NbaProvider } from "@/components/nba/nba_context";

const Sports = () => {
  return (
    <NbaProvider>
      <NbaDisplay />
    </NbaProvider>
  );
};

export default Sports;
