import React from "react";
import { getCountryCode } from "../../utils/helpers";

interface FlagProps {
  country: string;
  className?: string;
}

export const Flag: React.FC<FlagProps> = ({ country, className = "" }) => {
  const code = getCountryCode(country);

  if (!code) {
    return (
      <i
        className={`fas fa-globe ${className} text-neutral-600`}
        title={country}
      ></i>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={country}
      title={country}
      className={`object-cover rounded-sm shadow-sm ${className}`}
    />
  );
};
