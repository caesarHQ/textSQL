import { useContext } from "react";

import { AdminContext } from "@/contexts/admin_context";

import { ClosableRow } from "../closable_row";
import { DatabaseConfigComponent } from "./database_form";
import { OpenaiKeyForm } from "./openai_form";

const CredentialsScreen = () => {
  const { dbInfo } = useContext(AdminContext);
  const isDBConnected = dbInfo?.connectionVerified;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4flex justify-center">
        Credentials
      </h1>
      <div className="flex flex-col space-y-10">
        <ClosableRow title="Database Configuration" isGood={isDBConnected}>
          <DatabaseConfigComponent />
        </ClosableRow>
        <ClosableRow title="OpenAI API Key">
          <OpenaiKeyForm />
        </ClosableRow>
      </div>
    </div>
  );
};

export default CredentialsScreen;
