"use client"

const GlowCard = ({ children, identifier }) => {
  return (
    <div className={`ufo-panel w-full h-full`}>
      {children}
    </div>
  );
};

export default GlowCard;
