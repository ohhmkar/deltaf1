import React, { useState } from "react";
import { getTeamHex, getTeamLogo, getCountryCode } from "../../utils/helpers";

interface TeamLogoProps {
  constructorId: string;
  name: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ constructorId, name }) => {
  const [error, setError] = useState(false);
  const logo = getTeamLogo(constructorId);
  const color = getTeamHex(constructorId);

  if (logo && !error) {
    return (
      <div
        className="w-8 h-5 bg-white/95 rounded-sm flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-sm"
        title={name}
      >
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10 shrink-0"
      style={{ backgroundColor: color }}
      title={name}
    />
  );
};
