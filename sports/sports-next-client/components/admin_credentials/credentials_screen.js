import { ClosableRow } from "../closable_row";

const CredentialsScreen = () => {
  return (
    <div>
      <h1>Admin Credentials</h1>
      <ClosableRow title="Database">
        <div>Database stuff</div>
      </ClosableRow>
    </div>
  );
};

export default CredentialsScreen;
