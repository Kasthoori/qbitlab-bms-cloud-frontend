import type { FC } from "react";

const Rectangle: FC = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_60%)]" />
    </div>
  );
};

export default Rectangle;