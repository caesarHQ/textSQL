import { useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronUp,
  faChevronDown,
  faCheck,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faChevronUp, faChevronDown);

export const ClosableRow = ({
  title,
  children,
  isGood,
  startOpen = true,
  ...props
}) => {
  const [open, setOpen] = useState(startOpen);

  return (
    <div className="border border-gray-300 p-4 rounded bg-white" {...props}>
      <div
        className="flex items-center cursor-pointer border-b border-gray-300"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center">
          <div className="text-2xl">
            {open ? (
              <FontAwesomeIcon icon={faChevronUp} />
            ) : (
              <FontAwesomeIcon icon={faChevronDown} />
            )}
          </div>
          <div className="ml-2 mr-2">{open ? "Hide" : "Show"}</div>
        </div>

        <h3 className="text-lg font-bold">{title}</h3>
        {!!isGood && (
          <div className="ml-2 text-green-500">
            <FontAwesomeIcon icon={faCheck} />
          </div>
        )}
        {!isGood && isGood !== undefined && (
          <div className="ml-2 text-red-500">
            <FontAwesomeIcon icon={faStop} />
          </div>
        )}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
};
