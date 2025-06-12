"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from 'next/image';
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { cn } from "../libs/utils";

interface FormData {
  policy_category: string;
  client_name: string;
  spouse_name?: string;
  client_age?: number;
  spouse_age?: number;
  date: string;
  existing_company: string;
  existing_policy_type: string;
  existing_policy_number: string;
  existing_coverage: string;
  existing_coverage_primary?: string;
  existing_coverage_spouse?: string;
  existing_premium: string;
  existing_premium_primary?: string;
  existing_premium_spouse?: string;
  new_company: string;
  new_policy_type: string;
  new_coverage: string;
  new_coverage_primary?: string;
  new_coverage_spouse?: string;
  new_premium: string;
  new_premium_primary?: string;
  new_premium_spouse?: string;
  existing_premium_frequency?: string;
  existing_premium_primary_frequency?: string;
  existing_premium_spouse_frequency?: string;
  new_premium_frequency?: string;
  new_premium_primary_frequency?: string;
  new_premium_spouse_frequency?: string;
  replacement_reason: string;
  benefits_new: string;
  disadvantages_old: string;
  agent_name: string;
  agent_license?: string;
  agent_phone?: string;
}

interface AITextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  required?: boolean;
  rows?: number;
  formData?: FormData;
  setError?: (error: string) => void;
}

const AITextarea: React.FC<AITextareaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  rows = 4,
  formData = {} as FormData,
  setError,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const enhanceText = async () => {
    if (!value.trim() || value.trim().length < 20) {
      setError?.('Please write at least a few sentences before enhancing.');
      return;
    }

    setIsEnhancing(true);
    
    try {
      const fieldContext = {
        replacement_reason: "explaining why the current insurance policy should be replaced",
        benefits_new: "describing the advantages and benefits of the new insurance policy", 
        disadvantages_old: "outlining the problems and disadvantages of the current policy"
      };
      
      const prompt = `You are helping complete and improve insurance policy text.

CONTEXT:
- Field: ${fieldContext[id as keyof typeof fieldContext] || id}
- Client: ${formData.client_name || 'Not specified'}

ORIGINAL TEXT:
"${value}"

Please make this text clear, concise, and complete. Fix any incomplete sentences and improve clarity. Keep it simple and professional - don't make it overly verbose since this will be enhanced again later.

RULES:
1. Complete any incomplete sentences
2. Keep the same core meaning
3. Make it clear and easy to read
4. Use simple, direct language
5. Don't add excessive detail or flowery language
6. Return only the improved text, no explanations

Improved text:`;

      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.suggestion && data.suggestion.trim()) {
          onChange(data.suggestion.trim());
        }
      } else {
        const errorData = await response.json();
        setError?.(errorData.error || 'Failed to enhance text. Please try again.');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      setError?.('Network error during enhancement. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {value.trim().length > 20 && (
          <button
            type="button"
            onClick={enhanceText}
            disabled={isEnhancing}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Enhance with AI
              </>
            )}
          </button>
        )}
      </div>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          rows={rows}
          className="font-mono resize-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      {value.trim().length > 0 && value.trim().length < 20 && (
        <p className="text-xs text-muted-foreground">
          Write at least a few sentences to enable AI enhancement
        </p>
      )}
    </div>
  );
};

const PremiumInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  frequencyValue: string;
  onFrequencyChange: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
}> = ({ id, value, onChange, frequencyValue, onFrequencyChange, label, placeholder = "", required = false }) => {
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  const handleCurrencyChange = (inputValue: string) => {
    const formatted = formatCurrency(inputValue);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
            $
          </span>
          <Input
            id={id}
            type="text"
            value={value}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            placeholder={placeholder}
            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pl-8"
          />
        </div>
        <Select value={frequencyValue} onValueChange={onFrequencyChange}>
          <SelectTrigger className="h-11 w-32 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/month">per month</SelectItem>
            <SelectItem value="/year">per year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const AnimatedInput: React.FC<{
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
  isCurrency?: boolean;
}> = ({ id, type = "text", value, onChange, label, required = false, placeholder = "", isCurrency = false }) => {
  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Split by decimal point
    const parts = numericValue.split('.');
    
    // Format the integer part with commas
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Return formatted value (limit to 2 decimal places)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  const handleCurrencyChange = (inputValue: string) => {
    if (isCurrency) {
      const formatted = formatCurrency(inputValue);
      onChange(formatted);
    } else {
      onChange(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {isCurrency && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
            $
          </span>
        )}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          placeholder={placeholder}
          className={`h-11 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${
            isCurrency ? 'pl-8' : ''
          }`}
        />
      </div>
    </div>
  );
};

const HoverButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    isLoading?: boolean;
  }
>(({ className, children, isLoading = false, ...props }, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [circles, setCircles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    fadeState: "in" | "out" | null;
  }>>([]);
  const lastAddedRef = useRef(0);

  // Combine internal ref with forwarded ref
  React.useImperativeHandle(ref, () => buttonRef.current!);

  const createCircle = useCallback((x: number, y: number) => {
    const buttonWidth = buttonRef.current?.offsetWidth || 0;
    const xPos = x / buttonWidth;
    const color = `linear-gradient(to right, hsl(var(--primary)) ${xPos * 100}%, hsl(var(--primary)/0.8) ${xPos * 100}%)`;

    setCircles((prev) => [
      ...prev,
      { id: Date.now(), x, y, color, fadeState: null },
    ]);
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isListening) return;
      
      const currentTime = Date.now();
      if (currentTime - lastAddedRef.current > 100) {
        lastAddedRef.current = currentTime;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        createCircle(x, y);
      }
    },
    [isListening, createCircle]
  );

  const handlePointerEnter = useCallback(() => {
    setIsListening(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsListening(false);
  }, []);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    circles.forEach((circle) => {
      if (!circle.fadeState) {
        timers.push(setTimeout(() => {
          setCircles((prev) =>
            prev.map((c) =>
              c.id === circle.id ? { ...c, fadeState: "in" } : c
            )
          );
        }, 0));

        timers.push(setTimeout(() => {
          setCircles((prev) =>
            prev.map((c) =>
              c.id === circle.id ? { ...c, fadeState: "out" } : c
            )
          );
        }, 1000));

        timers.push(setTimeout(() => {
          setCircles((prev) => prev.filter((c) => c.id !== circle.id));
        }, 2200));
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [circles]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative isolate px-8 py-4 rounded-lg",
        "text-primary-foreground font-semibold text-base leading-6",
        "bg-primary hover:bg-primary/90",
        "cursor-pointer overflow-hidden transition-all duration-200",
        "shadow-lg hover:shadow-xl",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      disabled={isLoading}
      {...props}
    >
      {circles.map(({ id, x, y, color, fadeState }) => (
        <div
          key={id}
          className={cn(
            "absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "blur-lg pointer-events-none z-[-1] transition-opacity duration-300",
            fadeState === "in" && "opacity-75",
            fadeState === "out" && "opacity-0 duration-[1.2s]",
            !fadeState && "opacity-0"
          )}
          style={{
            left: x,
            top: y,
            background: color,
          }}
        />
      ))}
      <div className="flex items-center justify-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </div>
    </button>
  );
});

HoverButton.displayName = "HoverButton";

interface PolicyReplacementGeneratorProps {
  onDocumentGenerated: (content: string, data: FormData) => void;
  initialFormData?: FormData | null;
}

const PolicyReplacementGenerator: React.FC<PolicyReplacementGeneratorProps> = ({ onDocumentGenerated, initialFormData }) => {
  const [formData, setFormData] = useState<FormData>(() => {
    // Initialize with provided data or defaults
    if (initialFormData) {
      return initialFormData;
    }
    return {
      policy_category: '',
      client_name: '',
      date: new Date().toISOString().split('T')[0],
      existing_company: '',
      existing_policy_type: '',
      existing_policy_number: '',
      existing_coverage: '',
      existing_premium: '',
      existing_premium_frequency: '/month',
      existing_premium_primary_frequency: '/month',
      existing_premium_spouse_frequency: '/month',
      new_company: '',
      new_policy_type: '',
      new_coverage: '',
      new_premium: '',
      new_premium_frequency: '/month',
      new_premium_primary_frequency: '/month',
      new_premium_spouse_frequency: '/month',
      replacement_reason: '',
      benefits_new: '',
      disadvantages_old: '',
      agent_name: ''
    };
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCouple, setIsCouple] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setIsCouple(formData.policy_category === 'couple');
  }, [formData.policy_category]);

  const updateFormData = useCallback((field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  }, [error]);

  const handleGenerate = useCallback(async () => {
    // Validation
    const errors: string[] = [];
    if (!formData.client_name.trim()) errors.push('Client name is required');
    if (!formData.agent_name.trim()) errors.push('Agent name is required');
    if (!formData.existing_company.trim()) errors.push('Existing company is required');
    if (!isCouple && !formData.existing_policy_number.trim()) errors.push('Current policy number is required');
    if (!formData.new_company.trim()) errors.push('New company is required');
    if (!formData.replacement_reason.trim()) errors.push('Replacement reason is required');
    
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }
    
    setError('');
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        onDocumentGenerated(result.content, formData);
      } else {
        setError(result.message || 'Failed to generate document');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [formData, onDocumentGenerated]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/policyadvisorlogo.png"
              alt="PolicyAdvisor"
              width={160}
              height={50}
              className="h-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Policy Replacement Generator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create professional policy replacement documents with AI assistance
          </p>
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6 lg:p-8">
            <div className="space-y-8">
              {/* Policy Information */}
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Policy Information</h2>
                  <p className="text-sm text-gray-500">Basic information about the policy and client</p>
                </div>
                
                {/* Row 1: Policy Type and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Policy Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.policy_category} onValueChange={(value) => updateFormData("policy_category", value)}>
                      <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200">
                        <SelectItem value="individual" className="cursor-pointer">Individual</SelectItem>
                        <SelectItem value="couple" className="cursor-pointer">Couple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <AnimatedInput
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(value) => updateFormData("date", value)}
                    label="Date"
                    required
                  />
                </div>

                {/* Row 2: Primary Client Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <AnimatedInput
                    id="client_name"
                    value={formData.client_name}
                    onChange={(value) => updateFormData("client_name", value)}
                    label="Primary Client Name"
                    placeholder="Enter full name"
                    required
                  />
                  
                  {isCouple && (
                    <AnimatedInput
                      id="client_age"
                      type="number"
                      value={formData.client_age?.toString() || ""}
                      onChange={(value) => updateFormData("client_age", parseInt(value) || 0)}
                      label="Primary Age"
                      placeholder="Age"
                    />
                  )}
                </div>

                {/* Row 3: Spouse Info (couples only) */}
                {isCouple && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <AnimatedInput
                      id="spouse_name"
                      value={formData.spouse_name || ""}
                      onChange={(value) => updateFormData("spouse_name", value)}
                      label="Spouse Name"
                      placeholder="Enter spouse name"
                    />
                    
                    <AnimatedInput
                      id="spouse_age"
                      type="number"
                      value={formData.spouse_age?.toString() || ""}
                      onChange={(value) => updateFormData("spouse_age", parseInt(value) || 0)}
                      label="Spouse Age"
                      placeholder="Age"
                    />
                  </div>
                )}
              </section>

              <Separator className="bg-gray-200" />

              {/* Current Policy */}
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Policy (Policy to be replaced)</h2>
                  <p className="text-sm text-gray-500">Details about the existing insurance policy to be replaced</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatedInput
                    id="existing_company"
                    value={formData.existing_company}
                    onChange={(value) => updateFormData("existing_company", value)}
                    label="Insurance Company"
                    placeholder="Current insurer"
                    required
                  />
                  
                  <AnimatedInput
                    id="existing_policy_type"
                    value={formData.existing_policy_type}
                    onChange={(value) => updateFormData("existing_policy_type", value)}
                    label="Policy Type"
                    placeholder="Type of policy"
                    required
                  />

                  <div className="md:col-span-full">
                    <AnimatedInput
                      id="existing_policy_number"
                      value={formData.existing_policy_number || ""}
                      onChange={(value) => updateFormData("existing_policy_number", value)}
                      label="Current Policy Number"
                      placeholder="Enter policy number"
                      required={!isCouple}
                    />
                  </div>

                  {!isCouple ? (
                    <>
                      <AnimatedInput
                        id="existing_coverage"
                        value={formData.existing_coverage}
                        onChange={(value) => updateFormData("existing_coverage", value)}
                        label="Coverage Amount"
                        placeholder="500,000"
                        required
                        isCurrency={true}
                      />
                      
                      <PremiumInput
                        id="existing_premium"
                        value={formData.existing_premium}
                        onChange={(value) => updateFormData("existing_premium", value)}
                        frequencyValue={formData.existing_premium_frequency || '/month'}
                        onFrequencyChange={(value) => updateFormData("existing_premium_frequency", value)}
                        label="Premium"
                        placeholder="150"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <AnimatedInput
                        id="existing_coverage_primary"
                        value={formData.existing_coverage_primary || ""}
                        onChange={(value) => updateFormData("existing_coverage_primary", value)}
                        label={`${formData.client_name || 'Primary'} Coverage`}
                        placeholder="500,000"
                        isCurrency={true}
                      />
                      
                      <AnimatedInput
                        id="existing_coverage_spouse"
                        value={formData.existing_coverage_spouse || ""}
                        onChange={(value) => updateFormData("existing_coverage_spouse", value)}
                        label={`${formData.spouse_name || 'Spouse'} Coverage`}
                        placeholder="500,000"
                        isCurrency={true}
                      />
                      
                      <PremiumInput
                        id="existing_premium_primary"
                        value={formData.existing_premium_primary || ""}
                        onChange={(value) => updateFormData("existing_premium_primary", value)}
                        frequencyValue={formData.existing_premium_primary_frequency || '/month'}
                        onFrequencyChange={(value) => updateFormData("existing_premium_primary_frequency", value)}
                        label={`${formData.client_name || 'Primary'} Premium`}
                        placeholder="150"
                      />
                      
                      <PremiumInput
                        id="existing_premium_spouse"
                        value={formData.existing_premium_spouse || ""}
                        onChange={(value) => updateFormData("existing_premium_spouse", value)}
                        frequencyValue={formData.existing_premium_spouse_frequency || '/month'}
                        onFrequencyChange={(value) => updateFormData("existing_premium_spouse_frequency", value)}
                        label={`${formData.spouse_name || 'Spouse'} Premium`}
                        placeholder="150"
                      />
                    </>
                  )}
                </div>
              </section>

              <Separator className="bg-gray-200" />

              {/* New Policy */}
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">New Policy</h2>
                  <p className="text-sm text-gray-500">Details about the replacement (new) insurance policy</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatedInput
                    id="new_company"
                    value={formData.new_company}
                    onChange={(value) => updateFormData("new_company", value)}
                    label="Insurance Company"
                    placeholder="New insurer"
                    required
                  />
                  
                  <AnimatedInput
                    id="new_policy_type"
                    value={formData.new_policy_type}
                    onChange={(value) => updateFormData("new_policy_type", value)}
                    label="Policy Type"
                    placeholder="Type of new policy"
                    required
                  />

                  {!isCouple ? (
                    <>
                      <AnimatedInput
                        id="new_coverage"
                        value={formData.new_coverage}
                        onChange={(value) => updateFormData("new_coverage", value)}
                        label="Coverage Amount"
                        placeholder="500,000"
                        required
                        isCurrency={true}
                      />
                      
                      <PremiumInput
                        id="new_premium"
                        value={formData.new_premium}
                        onChange={(value) => updateFormData("new_premium", value)}
                        frequencyValue={formData.new_premium_frequency || '/month'}
                        onFrequencyChange={(value) => updateFormData("new_premium_frequency", value)}
                        label="Premium"
                        placeholder="120"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <AnimatedInput
                        id="new_coverage_primary"
                        value={formData.new_coverage_primary || ""}
                        onChange={(value) => updateFormData("new_coverage_primary", value)}
                        label={`${formData.client_name || 'Primary'} Coverage`}
                        placeholder="500,000"
                        isCurrency={true}
                      />
                      
                      <AnimatedInput
                        id="new_coverage_spouse"
                        value={formData.new_coverage_spouse || ""}
                        onChange={(value) => updateFormData("new_coverage_spouse", value)}
                        label={`${formData.spouse_name || 'Spouse'} Coverage`}
                        placeholder="500,000"
                        isCurrency={true}
                      />
                      
                      <PremiumInput
                        id="new_premium_primary"
                        value={formData.new_premium_primary || ""}
                        onChange={(value) => updateFormData("new_premium_primary", value)}
                        frequencyValue={formData.new_premium_primary_frequency || '/month'}
                        onFrequencyChange={(value) => updateFormData("new_premium_primary_frequency", value)}
                        label={`${formData.client_name || 'Primary'} Premium`}
                        placeholder="120"
                      />
                      
                      <PremiumInput
                        id="new_premium_spouse"
                        value={formData.new_premium_spouse || ""}
                        onChange={(value) => updateFormData("new_premium_spouse", value)}
                        frequencyValue={formData.new_premium_spouse_frequency || '/month'}
                        onFrequencyChange={(value) => updateFormData("new_premium_spouse_frequency", value)}
                        label={`${formData.spouse_name || 'Spouse'} Premium`}
                        placeholder="120"
                      />
                    </>
                  )}
                </div>
              </section>

              <Separator className="bg-gray-200" />

              {/* AI Analysis */}
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">AI-Powered Analysis</h2>
                  <p className="text-sm text-gray-500">Let AI help you articulate the replacement rationale</p>
                </div>
                
                <div className="space-y-4">
                  <AITextarea
                    id="replacement_reason"
                    value={formData.replacement_reason}
                    onChange={(value) => updateFormData("replacement_reason", value)}
                    label="Reason for Replacement"
                    placeholder="Describe why the current policy is being replaced..."
                    required
                    rows={4}
                    formData={formData}
                    setError={setError}
                  />
                  
                  <AITextarea
                    id="benefits_new"
                    value={formData.benefits_new}
                    onChange={(value) => updateFormData("benefits_new", value)}
                    label="Benefits of New Policy"
                    placeholder="Describe the benefits of the new policy..."
                    required
                    rows={4}
                    formData={formData}
                    setError={setError}
                  />
                  
                  <AITextarea
                    id="disadvantages_old"
                    value={formData.disadvantages_old}
                    onChange={(value) => updateFormData("disadvantages_old", value)}
                    label="Disadvantages of Current Policy"
                    placeholder="Describe the disadvantages of the current policy..."
                    rows={3}
                    formData={formData}
                    setError={setError}
                  />
                </div>
              </section>

              <Separator className="bg-gray-200" />

              {/* Agent Information */}
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Agent Information</h2>
                  <p className="text-sm text-gray-500">Your professional details</p>
                </div>
                
                <div className="max-w-md">
                  <AnimatedInput
                    id="agent_name"
                    value={formData.agent_name}
                    onChange={(value) => updateFormData("agent_name", value)}
                    label="Agent Name"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </section>

              {/* Generate Button */}
              <div className="pt-4 border-t border-gray-200">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <HoverButton
                    onClick={handleGenerate}
                    isLoading={isGenerating}
                    className="px-8 py-3 text-base font-medium"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Document
                      </>
                    )}
                  </HoverButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolicyReplacementGenerator; 