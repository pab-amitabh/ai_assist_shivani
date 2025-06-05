import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for API key
const apiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey); // Initialize after check

export async function POST(request: NextRequest) {
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return NextResponse.json({ 
      status: 'error',
      message: 'API key not configured. Please contact support.' 
    }, { status: 500 });
  }
  const genAI = new GoogleGenerativeAI(apiKey); // Initialize here after check

  try {
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.client_name || !formData.agent_name) {
      return NextResponse.json({
        status: 'error',
        message: 'Client name and agent name are required'
      }, { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Get policy category - individual or couple
    const policy_category = formData.policy_category || 'individual';
    const is_couple = policy_category === 'couple';
    
    // Include age context if provided
    let age_context = "";
    if (formData.client_age) {
        age_context = `- Primary Client Age: ${formData.client_age} years old`;
    }
    
    // Handle spouse information for couples
    let spouse_context = "";
    if (is_couple) {
        if (formData.spouse_name) {
            spouse_context = `- Spouse Name: ${formData.spouse_name}`;
        }
        if (formData.spouse_age) {
            spouse_context += `\n- Spouse Age: ${formData.spouse_age} years old`;
        }
    }
    
    let prompt: string;
    
    if (is_couple) {
        // COUPLES PROMPT - Based on the sample document provided
        prompt = `Generate a professional insurance policy replacement explanation letter for a COUPLE with the EXACT structure and format as shown in the sample. Use the client information provided to create a detailed, personalized letter.

IMPORTANT: This is a COUPLE/FAMILY POLICY replacement.

Client Information:
- Primary Client Name: ${formData.client_name}
${age_context}
${spouse_context}
- Date: ${formData.date}
- Agent Name: ${formData.agent_name}
- Existing Insurance Company: ${formData.existing_company}
- Company Issuing New Policy: ${formData.new_company}
- Primary Client Current Coverage: ${formData.existing_coverage_primary || formData.existing_coverage || ''}
- Spouse Current Coverage: ${formData.existing_coverage_spouse || ''}
- Primary Client Current Premium: ${formData.existing_premium_primary || formData.existing_premium || ''}
- Spouse Current Premium: ${formData.existing_premium_spouse || ''}
- New Coverage Primary: ${formData.new_coverage_primary || formData.new_coverage || ''}
- New Coverage Spouse: ${formData.new_coverage_spouse || ''}
- Total New Premium: ${formData.new_premium_total || formData.new_premium || ''}
- Current Line of Credit: ${formData.line_of_credit || '$250k'}
- Replacement Reason: ${formData.replacement_reason}

FOLLOW THIS EXACT STRUCTURE AND FORMAT:

**Explanation of Advantages and Disadvantages of Policy Replacement**

Client Name: ${formData.client_name}
Existing Insurance Company: ${formData.existing_company}
Company Issuing New Policy: ${formData.new_company}

Dear ${formData.client_name ? formData.client_name.split()[0] : 'Client'},

You have requested new life insurance coverage to potentially replace your existing Group Term Life Insurance policy issued by ${formData.existing_company || 'Canada Life'} through PIPSC. The analysis below is based on the information you have provided regarding your current policy and how it does not align with your coverage preferences. You have indicated that you are comfortable proceeding with the requested replacement based on the information you already have about the new policy. Below, I have outlined some key comparison points for your consideration as you make your decision.

**Summary of policy replacement**

You initially reached out to us to explore replacing your current life insurance coverage issued by ${formData.existing_company || 'Canada Life'} through PIPSC.

Your existing coverage amounts with ${formData.existing_company || 'Canada Life'} / PIPSC are:
• ${formData.client_name ? formData.client_name.split()[0] : 'Primary'}: ${formData.existing_coverage_primary || formData.existing_coverage || '$400,000'}
• ${formData.spouse_name || (formData.client_name && formData.client_name.split().length > 1 ? formData.client_name.split().slice(-1)[0] : 'Spouse')}: ${formData.existing_coverage_spouse || '$200,000'}

The PIPSC plan is an age-banded plan, meaning that premiums increase as you age. Additionally, at age 65, the maximum available coverage under this plan reduces to $150,000. Given that ${formData.client_name ? formData.client_name.split()[0] : 'you are'} ${formData.client_age ? `is ${formData.client_age}` : 'are approaching this age'} and ${formData.spouse_name || 'your spouse'} ${formData.spouse_age ? `is ${formData.spouse_age}` : 'is also approaching retirement age'}, this upcoming reduction does not align with your ongoing coverage needs.

PIPSC Premiums: The current premiums being paid are as follows
• ${formData.client_name ? formData.client_name.split()[0] : 'Primary'}: ${formData.existing_premium_primary || formData.existing_premium || '$228.80 per month'} for ${formData.existing_coverage_primary || formData.existing_coverage || '$400,000'}
• ${formData.spouse_name || (formData.client_name && formData.client_name.split().length > 1 ? formData.client_name.split().slice(-1)[0] : 'Spouse')}: ${formData.existing_premium_spouse || '$58.96 per month'} for ${formData.existing_coverage_spouse || '$200,000'}

However these premiums will adjust at age-banded intervals as the premiums increase and/or coverage automatically reduces. You expressed a desire to replace your existing coverage with a fixed-rate term policy, locking in coverage for a longer period (15 years) at a level premium.

During our discussions, we reviewed various options, including both term and permanent life insurance:
• Term Life Insurance: Offers lower premiums but coverage is for a fixed period.
• Permanent (Whole Life) Insurance: Provides lifetime coverage, estate planning benefits, and cash value accumulation for retirement.

You indicated a preference for Term Life Insurance for a 15-year period.

Based on our discussions, you have chosen:
• Term Life coverage of ${formData.new_coverage_primary || '$200,000'} each for 15 years.

**Why doesn't the existing policy meet your needs?**

The existing coverage through ${formData.existing_company || 'Canada Life'}/PIPSC does not meet your long-term needs because it is an age-banded plan, meaning premiums increase over time and coverage amounts decrease significantly as you approach age 65. With ${formData.client_name ? formData.client_name.split()[0] : 'the primary insured'} at ${formData.client_age || '64'} and ${formData.spouse_name || 'spouse'} at ${formData.spouse_age || '61'}, you are close to the point where the maximum available coverage will drop to $150,000, leaving you underinsured at a time when maintaining stable protection is important.

**How does the new policy meet your needs?**

To address your coverage needs, the following policies have been proposed:

Term Life Insurance

• ${formData.client_name ? formData.client_name.split()[0] : 'Primary'}: ${formData.new_coverage_primary || '$200k'} coverage for a 15-year term

• ${formData.spouse_name || 'Spouse'}: ${formData.new_coverage_spouse || '$200k'} coverage for a 15-year term

• Total proposed premium (as applied) of ${formData.new_premium_total || '$246.42 per month'}

• This coverage is designed to protect your current line of credit of ${formData.line_of_credit || '$250k'} and provide family income replacement over the next 15 years as the line of credit is gradually paid down.

**What are the risks associated with the proposed replacement?**

Life insurance policies typically include a two-year contestability and suicide exclusion period. This means that for the first two years from the effective date of a new policy:

• The insurance company has the right to review and deny a claim if there was a misstatement of material information in the application.

• If the insured passes away due to self-harm, the policy will not pay out the death benefit.

When you take a new policy with ${formData.new_company}, or any other insurer, this two-year period resets and will begin from the effective date of the new contract. It's important to keep this in mind when considering policy replacement.

The total coverage at ${formData.new_coverage_primary || '$200k'} is lower than the ${formData.existing_coverage_primary || '$400k'} in coverage that ${formData.client_name ? formData.client_name.split()[0] : 'the primary insured'} currently has. However you are comfortable with the reduction in coverage amount as it fits your preferred budgetary allocation needs.

**More Information**

If you have any questions about the policy or this document, please let me know. Our strong recommendation will be to not cancel your existing plan with PIPSC, until your new coverage has been approved.

${formData.agent_name}
Advisor

________________________________________________________________________________________

I understand the explanation provided to me regarding the advantages and disadvantages of the Policy Replacement.

${formData.client_name}

_____
Date: 

${formData.spouse_name || ''}

_____
Date: 

Make this sound professional, detailed, and personalized to the specific situation. Use insurance industry terminology and maintain the formal but approachable tone. Include specific dollar amounts and policy details. Write in paragraph form where indicated, not bullet points for the main content sections.

IMPORTANT: This is a COUPLE replacement - focus on family income replacement, line of credit protection, age-banded group plan limitations, coverage reductions at age 65, joint planning considerations, etc.`;
    } else {
        // INDIVIDUAL PROMPT - simpler structure with placeholders like Flask app
        prompt = `Generate a professional insurance policy replacement explanation letter with the EXACT structure and format as shown in examples. Use the client information provided to create a detailed, personalized letter.

IMPORTANT: This is an INDIVIDUAL POLICY replacement.

Client Information:
- Client Name: ${formData.client_name}
${age_context}
- Date: ${formData.date}
- Agent Name: ${formData.agent_name}
- Existing Company: ${formData.existing_company}
- Existing Policy Type: ${formData.existing_policy_type}
- Existing Coverage: ${formData.existing_coverage}
- Existing Premium: ${formData.existing_premium}
- New Company: ${formData.new_company}
- New Policy Type: ${formData.new_policy_type}
- New Coverage: ${formData.new_coverage}
- New Premium: ${formData.new_premium}
- Replacement Reason: ${formData.replacement_reason}
- Benefits of New Policy: ${formData.benefits_new}
- Disadvantages of Old Policy: ${formData.disadvantages_old}

FOLLOW THIS EXACT STRUCTURE AND FORMAT:

**Explanation of Advantages and Disadvantages of Policy Replacement**

Client Name: ${formData.client_name}
Existing Insurance Company: ${formData.existing_company}
Company Issuing New Policy: ${formData.new_company}

Dear ${formData.client_name ? formData.client_name.split()[0] : 'Client'},

You have reached out to us requesting for a ${formData.new_policy_type} policy to potentially replace your current ${formData.existing_policy_type} policy issued by ${formData.existing_company}. The analysis below is based on information you have shared with us regarding your existing policy and how your coverage preferences are not met in the existing coverage. You are comfortable with the life insurance replacement that you have requested based on the information you already have about the policy. I am enclosing below some comparison points that you should consider, as you decide on the replacement.

**Summary of policy replacement**

You have reached out to us seeking a replacement of your current life insurance policy issued by ${formData.existing_company}.

[Write a detailed paragraph about the current policy situation - coverage amount ${formData.existing_coverage}, premium ${formData.existing_premium}, and why client wants replacement based on: ${formData.replacement_reason}. ${formData.client_age ? `Consider the client's age of ${formData.client_age} in your analysis.` : ""}]

You are therefore seeking a new policy in order to:
• [Extract first main benefit from: ${formData.benefits_new}]
• [Extract second main benefit from: ${formData.benefits_new}]

**Why doesn't the existing policy meet your needs?**

[Write detailed explanation based on: ${formData.disadvantages_old} and ${formData.replacement_reason}.]

**How does the new policy meet your needs?**

[Write detailed explanation of new policy features and benefits, including coverage amount ${formData.new_coverage} and premium ${formData.new_premium}.]

The new proposed coverage has the following features which make it attractive to you:
• [First benefit from new policy details]
• [Second benefit] 
• [Third benefit]
• [Fourth benefit if applicable]

**What are the risks associated with the proposed replacement?**

Life insurance policies typically include a two-year contestability and suicide exclusion period. This means that for the first two years from the effective date of a new policy:

• The insurance company has the right to review and deny a claim if there was a misstatement of material information in the application.
• If the insured passes away due to self-harm, the policy will not pay out the death benefit.

When you take a new policy with ${formData.new_company}, or any other insurer, this two-year period resets and will begin from the effective date of the new contract. It's important to keep this in mind when considering policy replacement.

[Add any specific coverage reduction or risk considerations based on the coverage amounts and policy type]

**More Information**

If you have any questions about the policy or this document, please let me know. Our strong recommendation will be to not cancel your existing ${formData.existing_company} policy, until your new coverage has been approved.

${formData.agent_name}
Advisor

________________________________________________________________________________________

I understand the explanation provided to me regarding the advantages and disadvantages of the Policy Replacement.

${formData.client_name}

_____
Date: 

Make this sound professional, detailed, and personalized to the specific situation. Use insurance industry terminology and maintain the formal but approachable tone. Include specific dollar amounts and policy details. Write in paragraph form where indicated, not bullet points for the main content sections.

IMPORTANT: This is an INDIVIDUAL POLICY replacement - focus on personal coverage needs, premium stability, individual underwriting, etc.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return NextResponse.json({
      status: 'success',
      content: content
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to generate document'
    }, { status: 500 });
  }
} 