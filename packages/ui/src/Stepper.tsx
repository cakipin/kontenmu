import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="stepper-container">
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        let circleClass = "step-circle";
        if (isActive) circleClass += " active";
        if (isCompleted) circleClass += " completed";

        let labelClass = "step-label";
        if (isActive || isCompleted) labelClass += " active";

        return (
          <div key={label} className="step-item">
            <div className={circleClass}>{isCompleted ? "✓" : index + 1}</div>
            <div className={labelClass}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
