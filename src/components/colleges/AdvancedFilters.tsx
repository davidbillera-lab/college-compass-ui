/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AdvancedFiltersState {
  state: string;
  type: string;
  size: string;
  satMin: string;
  satMax: string;
  actMin: string;
  actMax: string;
  tuitionMax: string;
}

export const defaultFilters: AdvancedFiltersState = {
  state: "",
  type: "",
  size: "",
  satMin: "",
  satMax: "",
  actMin: "",
  actMax: "",
  tuitionMax: "",
};

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  availableStates: string[];
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

const COLLEGE_TYPES = [
  { value: "Public", label: "Public" },
  { value: "Private", label: "Private" },
  { value: "Community College", label: "Community College" },
  { value: "Trade School", label: "Trade School" },
];

const SIZES = [
  { value: "Small", label: "Small (< 5,000)" },
  { value: "Medium", label: "Medium (5,000 - 15,000)" },
  { value: "Large", label: "Large (15,000 - 30,000)" },
  { value: "Very Large", label: "Very Large (30,000+)" },
];

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableStates,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const activeFilterCount = Object.entries(filters).filter(
    ([_, value]) => value !== ""
  ).length;

  const updateFilter = (key: keyof AdvancedFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  // Use available states from data, fallback to US_STATES
  const stateOptions = availableStates.length > 0 
    ? availableStates.sort() 
    : US_STATES;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
          {/* State Filter */}
          <div className="space-y-2">
            <Label htmlFor="state-filter" className="text-sm font-medium">
              State
            </Label>
            <Select
              value={filters.state}
              onValueChange={(v) => updateFilter("state", v === "all" ? "" : v)}
            >
              <SelectTrigger id="state-filter" className="bg-background">
                <SelectValue placeholder="Any state" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50 max-h-[300px]">
                <SelectItem value="all">Any state</SelectItem>
                {stateOptions.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* College Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="type-filter" className="text-sm font-medium">
              College Type
            </Label>
            <Select
              value={filters.type}
              onValueChange={(v) => updateFilter("type", v === "all" ? "" : v)}
            >
              <SelectTrigger id="type-filter" className="bg-background">
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Any type</SelectItem>
                {COLLEGE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Filter */}
          <div className="space-y-2">
            <Label htmlFor="size-filter" className="text-sm font-medium">
              Campus Size
            </Label>
            <Select
              value={filters.size}
              onValueChange={(v) => updateFilter("size", v === "all" ? "" : v)}
            >
              <SelectTrigger id="size-filter" className="bg-background">
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Any size</SelectItem>
                {SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Tuition */}
          <div className="space-y-2">
            <Label htmlFor="tuition-filter" className="text-sm font-medium">
              Max Tuition ($/year)
            </Label>
            <Input
              id="tuition-filter"
              type="number"
              placeholder="e.g., 50000"
              value={filters.tuitionMax}
              onChange={(e) => updateFilter("tuitionMax", e.target.value)}
              className="bg-background"
            />
          </div>

          {/* SAT Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">SAT Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.satMin}
                onChange={(e) => updateFilter("satMin", e.target.value)}
                className="bg-background"
                min={400}
                max={1600}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.satMax}
                onChange={(e) => updateFilter("satMax", e.target.value)}
                className="bg-background"
                min={400}
                max={1600}
              />
            </div>
          </div>

          {/* ACT Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ACT Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.actMin}
                onChange={(e) => updateFilter("actMin", e.target.value)}
                className="bg-background"
                min={1}
                max={36}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.actMax}
                onChange={(e) => updateFilter("actMax", e.target.value)}
                className="bg-background"
                min={1}
                max={36}
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
