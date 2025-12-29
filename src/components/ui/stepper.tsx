import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({ 
  steps, 
  currentStep, 
  onStepClick, 
  orientation = 'vertical',
  className 
}: StepperProps) {
  return (
    <div 
      className={cn(
        "flex",
        orientation === 'vertical' ? 'flex-col gap-0' : 'flex-row gap-4 items-center',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isClickable = onStepClick && index <= currentStep;

        return (
          <div 
            key={step.id} 
            className={cn(
              "flex",
              orientation === 'vertical' ? 'flex-row gap-4' : 'flex-col items-center gap-2'
            )}
          >
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 font-semibold text-sm",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isActive && "border-primary bg-primary-light text-primary",
                  !isCompleted && !isActive && "border-border bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:shadow-soft",
                  !isClickable && "cursor-default"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </button>
              
              {/* Connector line for vertical orientation */}
              {orientation === 'vertical' && index < steps.length - 1 && (
                <div 
                  className={cn(
                    "w-0.5 h-8 mt-2 transition-colors duration-200",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )} 
                />
              )}
            </div>

            <div className={cn(
              "flex flex-col",
              orientation === 'vertical' ? 'pt-2' : 'items-center text-center'
            )}>
              <span className={cn(
                "font-medium text-sm transition-colors duration-200",
                (isActive || isCompleted) ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </span>
              {step.description && orientation === 'vertical' && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </span>
              )}
            </div>

            {/* Connector line for horizontal orientation */}
            {orientation === 'horizontal' && index < steps.length - 1 && (
              <div 
                className={cn(
                  "h-0.5 w-12 transition-colors duration-200",
                  index < currentStep ? "bg-primary" : "bg-border"
                )} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
