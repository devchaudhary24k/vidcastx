import React from "react";
import { Building, Check, CreditCard, Layout, User, Users } from "lucide-react";

import { cn } from "@vidcastx/ui/lib/utils";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Organization", icon: Building },
  { id: 3, title: "Select Plan", icon: Layout },
  { id: 4, title: "Billing", icon: CreditCard },
  { id: 5, title: "Invite Members", icon: Users },
];

interface OnboardingSidebarProps {
  currentStep: number;
  completedSteps: number[];
}

export const OnboardingSidebar: React.FC<OnboardingSidebarProps> = ({
  currentStep,
  completedSteps,
}) => {
  return (
    <div className="bg-muted/30 border-border w-full border-r p-6 md:w-64">
      <div className="mb-8">
        <h1 className="text-xl font-bold">VidCast</h1>
        <p className="text-muted-foreground text-sm">Setup your account</p>
      </div>

      <nav className="relative space-y-1">
        {/* Vertical Line Connector */}
        <div className="bg-border absolute top-4 bottom-4 left-[15px] -z-10 w-0.5" />

        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "bg-background flex items-center gap-4 rounded-lg p-2 transition-colors md:bg-transparent",
                isCurrent
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "bg-background z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted
                    ? "text-primary-foreground border-green-500 bg-green-500"
                    : isCurrent
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground/30",
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <span className="text-sm font-bold">{step.id}</span>
                ) : (
                  <span className="text-sm">{step.id}</span>
                )}
              </div>
              <span className="text-sm">{step.title}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
};
