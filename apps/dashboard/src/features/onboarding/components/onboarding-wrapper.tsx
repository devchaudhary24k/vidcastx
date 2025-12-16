"use client";

import React, { useState } from "react";

import { Step1BasicInfo } from "./basic-information";
import { Step4Billing } from "./billing";
import { Step5InviteMembers } from "./invite-members";
import { OnboardingSidebar } from "./onboarding-sidebar";
import { Step2Organization } from "./organization";
import { Step3PlanSelection } from "./plan-selection";

export const OnboardingWrapper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    // Mark current step as complete
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    // Move to next step (Max 5)
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Handle final submission redirect or success state here
      alert("Onboarding Complete! Redirecting...");
    }
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo onComplete={handleNext} />;
      case 2:
        return <Step2Organization onComplete={handleNext} />;
      case 3:
        return <Step3PlanSelection onComplete={handleNext} />;
      case 4:
        return <Step4Billing onComplete={handleNext} />;
      case 5:
        return <Step5InviteMembers onComplete={handleNext} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-xl border shadow-lg md:flex-row">
        {/* LEFT SIDEBAR */}
        <OnboardingSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="mx-auto max-w-xl">{renderStepComponent()}</div>
        </div>
      </div>
    </div>
  );
};
