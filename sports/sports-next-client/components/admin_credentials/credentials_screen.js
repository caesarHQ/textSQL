import { ClosableRow } from "../closable_row";
import { DatabaseConfigComponent } from "./database_form";

const CredentialsScreen = () => {
  return (
    <div>
      <h1>Admin Credentials</h1>
      <ClosableRow title="Database">
        <DatabaseConfigComponent />
      </ClosableRow>
    </div>
  );
};

export default CredentialsScreen;
