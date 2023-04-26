export const Table = ({ children }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  );
};

export const TableHead = ({ children }) => {
  return (
    <thead className="bg-gray-50">
      <tr>{children}</tr>
    </thead>
  );
};

export const TableHeader = ({ children }) => {
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
      {children}
    </th>
  );
};

export const TableBody = ({ children }) => {
  return (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  );
};

export const TableRow = ({ children }) => {
  return <tr>{children}</tr>;
};

export const TableCell = ({ children }) => {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">{children}</div>
    </td>
  );
};
