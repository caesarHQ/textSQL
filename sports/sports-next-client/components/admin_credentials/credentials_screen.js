import { ClosableRow } from "../closable_row";
import { DatabaseConfigComponent } from "./database_form";

const CredentialsScreen = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4flex justify-center">
        Credentials
      </h1>
      <ClosableRow title="Database Configuration">
        <DatabaseConfigComponent />
      </ClosableRow>
    </div>
  );
};

export default CredentialsScreen;
