// Price Selector Component - Variable pricing for registrations
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RegistrationType } from "@/lib/registration/types";

interface PriceSelectorProps {
  registrationType: RegistrationType;
  value: number;
  onChange: (value: number) => void;
}

const PRICE_CONFIG = {
  normal: {
    min: 300,
    max: 1000,
    default: 300,
    step: 10,
    label: "Registration Amount",
    labelTe: "",
    description: "Minimum ₹300, You can contribute more if you wish",
    descriptionTe: "కనీసం ₹300, మీరు కావాలనుకుంటే మరింత సహకరించవచ్చు. ",
  },
  faithbox: {
    min: 50,
    max: 1000,
    default: 50,
    step: 10,
    label: "Faithbox Registration Amount",
    labelTe: "ఫెయిత్ బాక్స్ రిజిస్ట్రేషన్ మొత్తం",
    description: "Minimum ₹50, You can contribute more if you wish",
    descriptionTe: "కనీసం ₹50, మీరు కావాలనుకుంటే మరింత దాన చేయవచ్చు",
  },
  kids: {
    min: 300,
    max: 1000,
    default: 300,
    step: 10,
    label: "Kids Registration Amount",
    labelTe: "పిల్లల రిజిస్ట్రేషన్ మొత్తం",
    description: "Minimum ₹300, You can contribute more if you wish",
    descriptionTe: "కనీసం ₹300, మీరు కావాలనుకుంటే మరింత దాన చేయవచ్చు",
  },
};

export function PriceSelector({ registrationType, value, onChange }: PriceSelectorProps) {
  const config = PRICE_CONFIG[registrationType];
  const [inputValue, setInputValue] = useState(value.toString());

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Only update parent if valid number
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= config.min && numValue <= config.max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Validate and correct on blur
    let numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < config.min) {
      numValue = config.min;
    } else if (numValue > config.max) {
      numValue = config.max;
    }
    onChange(numValue);
    setInputValue(numValue.toString());
  };

  return (
    <Card className="p-6 mb-6 shadow-lg border-0 bg-primary/5">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {config.label}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            {config.labelTe}
          </p>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
          <p className="text-sm text-muted-foreground">
            {config.descriptionTe}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="price-slider" className="text-sm font-medium mb-2 block">
              Select Amount
            </Label>
            <Slider
              id="price-slider"
              min={config.min}
              max={config.max}
              step={config.step}
              value={[value]}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>₹{config.min}</span>
              <span>₹{config.max}</span>
            </div>
          </div>

          <div className="w-32">
            <Label htmlFor="price-input" className="text-sm font-medium mb-2 block">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₹
              </span>
              <Input
                id="price-input"
                type="number"
                min={config.min}
                max={config.max}
                step={config.step}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="pl-7 rounded-full text-center font-semibold text-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Amount to Pay</p>
          <p className="text-3xl font-bold text-primary">₹{value}</p>
        </div>
      </div>
    </Card>
  );
}
