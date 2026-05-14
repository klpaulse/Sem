import { forwardRef } from "react";

const FormationField = forwardRef(function FormationField(
  { children, interactive = true },
  ref
) {
  return (
    <div
      className={`formation-field ${interactive ? "interactive" : "no-interaction"}`}
      ref={ref}
    >
      <div className="goal-line goal-line--top" />
      <div className="goal-line goal-line--bottom" />

      <div className="keeper-box keeper-box--top" />
      <div className="keeper-box keeper-box--bottom" />

      <div className="corner-arc corner-arc--tl" />
      <div className="corner-arc corner-arc--tr" />
      <div className="corner-arc corner-arc--bl" />
      <div className="corner-arc corner-arc--br" />

      {children}
    </div>
  );
});

export default FormationField;





