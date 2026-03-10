"use client";

import React, { useState } from "react";

import { Step1BasicInfo } from "./basic-information";
import { Step4Billing } from "./billing";
import { Step5InviteMembers } from "./invite-members";
import { OnboardingSidebar } from "./onboarding-sidebar";
import { Step2Organization } from "./organization";

export const OnboardingWrapper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep === 2) {
      // Skip step 3 (Plan)
      setCurrentStep(4);
    } else if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Handle final submission
      alert("Onboarding Complete! Redirecting...");
    }
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo onComplete={handleNext} />;
      case 2:
        return <Step2Organization onComplete={handleNext} />;
      // Step 3 is skipped
      case 4:
        return <Step4Billing onComplete={handleNext} />;
      case 5:
        return <Step5InviteMembers onComplete={handleNext} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      {/* Absolute Sidebar - Desktop */}
      <div className="fixed top-1/2 left-12 z-50 hidden -translate-y-1/2 xl:block">
        <OnboardingSidebar currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Main Content Area */}
      <div className="flex w-full flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-2xl">{renderStepComponent()}</div>
      </div>
    </div>
  );
};
