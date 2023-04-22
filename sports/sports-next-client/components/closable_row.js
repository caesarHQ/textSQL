import { useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faChevronUp, faChevronDown);

export const ClosableRow = ({ title, children, className, ...props }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className={className} {...props}>
      <div
        className="flex items-center cursor-pointer"
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
      </div>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
};
