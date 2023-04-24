export const Spinner = ({ width = 10 }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full h-${width} w-${width} border-t-4 border-b-4 border-blue-500`}
      ></div>
    </div>
  );
};
