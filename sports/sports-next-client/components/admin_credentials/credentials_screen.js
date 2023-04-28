import { useContext } from "react";

import { AdminContext } from "@/contexts/admin_context";

import { ClosableRow } from "../closable_row";
import { DatabaseConfigComponent } from "./database_form";
import { OpenaiKeyForm } from "./openai_form";
import { PineconeKeyForm } from "./pinecone_form";

const CredentialsScreen = () => {
  const { dbInfo, openaiKey, pineconeKey } = useContext(AdminContext);
  const isDBConnected = dbInfo?.connectionVerified;
  const isOpenAIAdded = openaiKey?.added;
  const isPineconeAdded = pineconeKey?.added;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-center">Credentials</h1>
      <div className="flex flex-col space-y-10">
        <ClosableRow title="Database Configuration" isGood={isDBConnected}>
          <DatabaseConfigComponent />
        </ClosableRow>
        <ClosableRow title="OpenAI API Key" isGood={isOpenAIAdded}>
          <OpenaiKeyForm />
        </ClosableRow>
        <ClosableRow title="Pinecone Credentials" isGood={isPineconeAdded}>
          <PineconeKeyForm />
        </ClosableRow>
      </div>
    </div>
  );
};

export default CredentialsScreen;
