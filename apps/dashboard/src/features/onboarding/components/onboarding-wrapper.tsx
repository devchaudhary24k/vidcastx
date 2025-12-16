"use client";

import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { Step1BasicInfo } from "./basic-information";
import { Step4Billing } from "./billing";
import { Step5InviteMembers } from "./invite-members";
import { OnboardingSidebar } from "./onboarding-sidebar";
import { Step2Organization } from "./organization";
import { Step3PlanSelection } from "./plan-selection";

export const OnboardingWrapper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const animateStepChange = contextSafe((callback: () => void) => {
    if (!contentRef.current) return;

    gsap.to(contentRef.current, {
      opacity: 0,
      y: -10,
      filter: "blur(5px)",
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        callback();
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 10, filter: "blur(5px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power2.out",
          },
        );
      },
    });
  });

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < 5) {
      animateStepChange(() => setCurrentStep((prev) => prev + 1));
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
    <div
      className="bg-background text-foreground relative flex min-h-screen flex-col"
      ref={containerRef}
    >
      {/* Absolute Sidebar - Desktop */}
      <div className="fixed top-1/2 left-12 z-50 hidden -translate-y-1/2 xl:block">
        <OnboardingSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>

      {/* Mobile/Tablet Step Indicator could go here if needed, keeping it simple for now */}

      {/* Main Content Area */}
      <div className="flex w-full flex-1 items-start justify-center pt-20">
        <div className="w-full max-w-4xl px-6 py-12 md:px-12">
          <div ref={contentRef} className="w-full">
            {renderStepComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};
