import React from "react";
import { Building, Check, CreditCard, Layout, User, Users } from "lucide-react";

import { cn } from "@vidcastx/ui/lib/utils";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Organization", icon: Building },
  { id: 3, title: "Plan", icon: Layout },
  { id: 4, title: "Billing", icon: CreditCard },
  { id: 5, title: "Invite", icon: Users },
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
    <nav className="flex w-fit flex-col gap-6">
      {STEPS.map((step) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;

        return (
          <div
            key={step.id}
            className={cn(
              "group flex items-center gap-4 transition-all duration-300",
              isCurrent ? "opacity-100" : "opacity-40 hover:opacity-70",
            )}
          >
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                isCompleted
                  ? "border-primary bg-primary text-primary-foreground scale-90"
                  : isCurrent
                    ? "border-primary text-primary bg-background shadow-primary/20 scale-110 shadow-lg"
                    : "border-muted-foreground text-muted-foreground scale-90 bg-transparent",
              )}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}

              {/* Connector Line */}
              {step.id !== STEPS.length && (
                <div
                  className={cn(
                    "absolute top-full left-1/2 -z-10 -ml-px h-6 w-0.5",
                    completedSteps.includes(step.id)
                      ? "bg-primary"
                      : "bg-border",
                  )}
                />
              )}
            </div>

            <div
              className={cn(
                "origin-left whitespace-nowrap transition-all duration-300",
                isCurrent
                  ? "translate-x-0 text-sm font-semibold"
                  : "hidden -translate-x-2 text-xs font-medium opacity-0 group-hover:translate-x-0 group-hover:opacity-100 lg:block",
              )}
            >
              {step.title}
            </div>
          </div>
        );
      })}
    </nav>
  );
};
