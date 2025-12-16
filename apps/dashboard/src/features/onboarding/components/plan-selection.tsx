import React from "react";
import { useForm } from "@tanstack/react-form";
import { Check } from "lucide-react";

import { Badge } from "@vidcastx/ui/components/badge";
import { Button } from "@vidcastx/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@vidcastx/ui/components/card";
import { Field, FieldError } from "@vidcastx/ui/components/field";
import { cn } from "@vidcastx/ui/lib/utils";

import { planSelectionSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

export const Step3PlanSelection: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: { planId: "pro" },
    validators: { onChange: planSelectionSchema },
    onSubmit: async ({ value }) => {
      console.log("Step 3 Data:", value);
      onComplete();
    },
  });

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$0",
      description: "Perfect for hobbyists",
      features: ["10GB Storage", "Basic Analytics", "Standard Support"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29",
      description: "For growing creators",
      features: [
        "1TB Storage",
        "Advanced Analytics",
        "Priority Support",
        "4k Streaming",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$99",
      description: "For large teams",
      features: [
        "Unlimited Storage",
        "Custom SSO",
        "Dedicated Manager",
        "White-labeling",
      ],
    },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit().then((r) => {});
      }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Choose your plan</h2>
        <p className="text-muted-foreground">
          Select the plan that best fits your needs.
        </p>
      </div>

      <form.Field name="planId">
        {(field) => (
          <Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => field.handleChange(plan.id)}
                  className="cursor-pointer outline-none"
                  role="radio"
                  aria-checked={field.state.value === plan.id}
                  tabIndex={0}
                >
                  <Card
                    className={cn(
                      "relative h-full border-2 transition-all",
                      field.state.value === plan.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {plan.popular && (
                      <Badge className="bg-primary absolute -top-2 -right-2">
                        Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        {field.state.value === plan.id && (
                          <Check className="text-primary h-5 w-5" />
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 text-3xl font-bold">
                        {plan.price}
                        <span className="text-muted-foreground text-sm font-normal">
                          /mo
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" /> {feat}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            <FieldError errors={field.state.meta.errors} className="mt-2" />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end pt-4">
        <Button type="submit">Continue to Billing</Button>
      </div>
    </form>
  );
};
