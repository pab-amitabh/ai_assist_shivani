"use client";

import React, { useState, useRef } from "react";
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
  line_of_credit?: string;
  date: string;
  existing_company: string;
  existing_policy_type: string;
  existing_policy_number?: string;
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
  new_premium_total?: string;
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

const AnimatedInput: React.FC<{
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
}> = ({ id, type = "text", value, onChange, label, required = false, placeholder = "" }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      />
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

  const createCircle = React.useCallback((x: number, y: number) => {
    const buttonWidth = buttonRef.current?.offsetWidth || 0;
    const xPos = x / buttonWidth;
    const color = `linear-gradient(to right, hsl(var(--primary)) ${xPos * 100}%, hsl(var(--primary)/0.8) ${xPos * 100}%)`;

    setCircles((prev) => [
      ...prev,
      { id: Date.now(), x, y, color, fadeState: null },
    ]);
  }, []);

  const handlePointerMove = React.useCallback(
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

  const handlePointerEnter = React.useCallback(() => {
    setIsListening(true);
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    setIsListening(false);
  }, []);

  React.useEffect(() => {
    circles.forEach((circle) => {
      if (!circle.fadeState) {
        setTimeout(() => {
          setCircles((prev) =>
            prev.map((c) =>
              c.id === circle.id ? { ...c, fadeState: "in" } : c
            )
          );
        }, 0);

        setTimeout(() => {
          setCircles((prev) =>
            prev.map((c) =>
              c.id === circle.id ? { ...c, fadeState: "out" } : c
            )
          );
        }, 1000);

        setTimeout(() => {
          setCircles((prev) => prev.filter((c) => c.id !== circle.id));
        }, 2200);
      }
    });
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
}

const PolicyReplacementGenerator: React.FC<PolicyReplacementGeneratorProps> = ({ onDocumentGenerated }) => {
  const [formData, setFormData] = useState<FormData>({
    policy_category: '',
    client_name: '',
    date: new Date().toISOString().split('T')[0],
    existing_company: '',
    existing_policy_type: '',
    existing_coverage: '',
    existing_premium: '',
    new_company: '',
    new_policy_type: '',
    new_coverage: '',
    new_premium: '',
    replacement_reason: '',
    benefits_new: '',
    disadvantages_old: '',
    agent_name: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCouple, setIsCouple] = useState(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    setIsCouple(formData.policy_category === 'couple');
  }, [formData.policy_category]);

  const updateFormData = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleGenerate = async () => {
    if (!formData.client_name.trim()) {
      setError('Client name is required');
      return;
    }
    if (!formData.agent_name.trim()) {
      setError('Agent name is required');
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
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.status === 'success') {
          onDocumentGenerated(result.content, formData);
        } else {
          setError(result.message || 'Failed to generate document');
        }
      } else {
        setError(result.message || 'Failed to generate document. Please try again.');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    id="client_name"
                    value={formData.client_name}
                    onChange={(value) => updateFormData("client_name", value)}
                    label="Primary Client Name"
                    placeholder="Enter full name"
                    required
                  />
                  
                  <AnimatedInput
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(value) => updateFormData("date", value)}
                    label="Date"
                    required
                  />
                </div>

                {isCouple && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <AnimatedInput
                      id="spouse_name"
                      value={formData.spouse_name || ""}
                      onChange={(value) => updateFormData("spouse_name", value)}
                      label="Spouse Name"
                      placeholder="Enter spouse name"
                    />
                    
                    <AnimatedInput
                      id="client_age"
                      type="number"
                      value={formData.client_age?.toString() || ""}
                      onChange={(value) => updateFormData("client_age", parseInt(value) || 0)}
                      label="Primary Age"
                      placeholder="Age"
                    />
                    
                    <AnimatedInput
                      id="spouse_age"
                      type="number"
                      value={formData.spouse_age?.toString() || ""}
                      onChange={(value) => updateFormData("spouse_age", parseInt(value) || 0)}
                      label="Spouse Age"
                      placeholder="Age"
                    />

                    <div className="md:col-span-full">
                      <AnimatedInput
                        id="line_of_credit"
                        value={formData.line_of_credit || ""}
                        onChange={(value) => updateFormData("line_of_credit", value)}
                        label="Current Line of Credit (Optional)"
                        placeholder="e.g., $250,000"
                      />
                    </div>
                  </div>
                )}
              </section>

              <Separator className="bg-gray-200" />

              {/* Current Policy */}
              <section>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Policy</h2>
                  <p className="text-sm text-gray-500">Details about the existing insurance policy</p>
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
                      label="Current Policy Number (Optional)"
                      placeholder="Enter policy number"
                    />
                  </div>

                  {!isCouple ? (
                    <>
                      <AnimatedInput
                        id="existing_coverage"
                        value={formData.existing_coverage}
                        onChange={(value) => updateFormData("existing_coverage", value)}
                        label="Coverage Amount"
                        placeholder="e.g., $500,000"
                        required
                      />
                      
                      <AnimatedInput
                        id="existing_premium"
                        value={formData.existing_premium}
                        onChange={(value) => updateFormData("existing_premium", value)}
                        label="Premium"
                        placeholder="e.g., $150/month"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <AnimatedInput
                        id="existing_coverage_primary"
                        value={formData.existing_coverage_primary || ""}
                        onChange={(value) => updateFormData("existing_coverage_primary", value)}
                        label="Primary Coverage"
                        placeholder="Primary coverage amount"
                      />
                      
                      <AnimatedInput
                        id="existing_coverage_spouse"
                        value={formData.existing_coverage_spouse || ""}
                        onChange={(value) => updateFormData("existing_coverage_spouse", value)}
                        label="Spouse Coverage"
                        placeholder="Spouse coverage amount"
                      />
                      
                      <AnimatedInput
                        id="existing_premium_primary"
                        value={formData.existing_premium_primary || ""}
                        onChange={(value) => updateFormData("existing_premium_primary", value)}
                        label="Primary Premium"
                        placeholder="Primary premium"
                      />
                      
                      <AnimatedInput
                        id="existing_premium_spouse"
                        value={formData.existing_premium_spouse || ""}
                        onChange={(value) => updateFormData("existing_premium_spouse", value)}
                        label="Spouse Premium"
                        placeholder="Spouse premium"
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
                  <p className="text-sm text-gray-500">Details about the replacement insurance policy</p>
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

                  <AnimatedInput
                    id="new_coverage"
                    value={formData.new_coverage}
                    onChange={(value) => updateFormData("new_coverage", value)}
                    label="Coverage Amount"
                    placeholder="e.g., $500,000"
                    required
                  />
                  
                  <AnimatedInput
                    id="new_premium"
                    value={formData.new_premium}
                    onChange={(value) => updateFormData("new_premium", value)}
                    label="Premium"
                    placeholder="e.g., $120/month"
                    required
                  />

                  {isCouple && (
                    <div className="md:col-span-full">
                      <AnimatedInput
                        id="new_premium_total"
                        value={formData.new_premium_total || ""}
                        onChange={(value) => updateFormData("new_premium_total", value)}
                        label="Total Premium (Combined)"
                        placeholder="Total premium amount"
                      />
                    </div>
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