import React from "react";
import { Building, Check, CreditCard, User, Users } from "lucide-react";

import { cn } from "@vidcastx/ui/lib/utils";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Organization", icon: Building },
  // Step 3 (Plan) is skipped
  { id: 4, title: "Billing", icon: CreditCard },
  { id: 5, title: "Invite", icon: Users },
];

interface OnboardingSidebarProps {
  currentStep: number;
  completedSteps: number[];
}

export const OnboardingSidebar: React.FC<OnboardingSidebarProps> = ({ currentStep, completedSteps }) => {
  return (
    <nav className="flex w-fit flex-col gap-8">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;
        const isLast = index === STEPS.length - 1;
        const nextStep = STEPS[index + 1];
        const isNextCompleted = nextStep && completedSteps.includes(nextStep.id);

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-4 transition-colors duration-200",
              isCurrent || isCompleted ? "opacity-100" : "opacity-40",
            )}
          >
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-background text-primary shadow-sm"
                      : "border-muted-foreground bg-background text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute top-10 -z-10 h-full w-0.5",
                    completedSteps.includes(step.id) && isNextCompleted ? "bg-primary" : "bg-border",
                  )}
                  style={{ height: "calc(100% + 32px)" }}
                />
              )}
            </div>

            <div className={cn("text-sm font-medium", isCurrent ? "text-primary font-bold" : "text-muted-foreground")}>
              {step.title}
            </div>
          </div>
        );
      })}
    </nav>
  );
};
