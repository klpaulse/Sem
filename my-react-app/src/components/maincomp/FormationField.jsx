import { forwardRef } from "react";

const FormationField = forwardRef(function FormationField(
  { children, interactive = true },
  ref
) {
  return (
    <div
      className={`formation-field ${interactive ? "" : "no-interaction"}`}
      ref={ref}
    >
      {/* ⭐ Målstreker */}
      <div className="goal-line goal-line--top" />
      <div className="goal-line goal-line--bottom" />

      {/* ⭐ Keeperfelt */}
      <div className="keeper-box keeper-box--top" />
      <div className="keeper-box keeper-box--bottom" />

      {/* ⭐ Corner arcs */}
      <div className="corner-arc corner-arc--tl" />
      <div className="corner-arc corner-arc--tr" />
      <div className="corner-arc corner-arc--bl" />
      <div className="corner-arc corner-arc--br" />

      {/* ⭐ Spillere */}
      {children}
    </div>
  );
});

export default FormationField;




