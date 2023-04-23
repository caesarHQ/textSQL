import { ClosableRow } from "../closable_row";
import { DatabaseConfigComponent } from "./database_form";
import { OpenaiKeyForm } from "./openai_form";

const CredentialsScreen = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4flex justify-center">
        Credentials
      </h1>
      <div className="flex flex-col space-y-10">
        <ClosableRow title="Database Configuration">
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
