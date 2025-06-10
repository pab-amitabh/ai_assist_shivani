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
        // COUPLES PROMPT - Dynamic based on form data
        prompt = `Generate a professional insurance policy replacement explanation letter for a COUPLE with the EXACT structure and format as shown in the sample. Use the client information provided to create a detailed, personalized letter.

IMPORTANT: This is a COUPLE/FAMILY POLICY replacement.

Client Information:
- Primary Client Name: ${formData.client_name}
${age_context}
${spouse_context}
- Date: ${formData.date}
- Agent Name: ${formData.agent_name}
- Existing Insurance Company: ${formData.existing_company}
- Existing Policy Type: ${formData.existing_policy_type || 'life insurance policy'}
- Company Issuing New Policy: ${formData.new_company}
- Primary Client Current Coverage: ${formData.existing_coverage_primary || formData.existing_coverage || ''}
- Spouse Current Coverage: ${formData.existing_coverage_spouse || ''}
- Primary Client Current Premium: ${formData.existing_premium_primary || formData.existing_premium || ''}
- Spouse Current Premium: ${formData.existing_premium_spouse || ''}
- New Coverage Primary: ${formData.new_coverage_primary || formData.new_coverage || ''}
- New Coverage Spouse: ${formData.new_coverage_spouse || ''}
- New Policy Type: ${formData.new_policy_type || 'life insurance'}
- Total New Premium: ${formData.new_premium_total || formData.new_premium || ''}
- Replacement Reason: ${formData.replacement_reason}
- Existing Policy Details/Issues: ${formData.disadvantages_old || ''}
- New Policy Benefits: ${formData.benefits_new || ''}

FOLLOW THIS EXACT STRUCTURE AND FORMAT:

**Explanation of Advantages and Disadvantages of Policy Replacement**

Client Name: ${formData.client_name}${formData.existing_policy_number ? `\nCurrent Policy Number: ${formData.existing_policy_number}` : ''}
Existing Insurance Company: ${formData.existing_company}
Company Issuing New Policy: ${formData.new_company}

Dear ${formData.client_name ? formData.client_name.split()[0] : 'Client'},

You have requested new ${formData.new_policy_type || 'life insurance'} coverage to potentially replace your existing ${formData.existing_policy_type || 'life insurance policy'} issued by ${formData.existing_company}. The analysis below is based on the information you have provided regarding your current policy and how it does not align with your coverage preferences. You have indicated that you are comfortable proceeding with the requested replacement based on the information you already have about the new policy. Below, I have outlined some key comparison points for your consideration as you make your decision.

**Summary of policy replacement**

You initially reached out to us to explore replacing your current ${formData.existing_policy_type || 'life insurance'} coverage issued by ${formData.existing_company}.

Your existing coverage amounts with ${formData.existing_company} are:
• ${formData.client_name ? formData.client_name.split()[0] : 'Primary'}: ${formData.existing_coverage_primary || formData.existing_coverage || 'current coverage amount'}
• ${formData.spouse_name || 'Spouse'}: ${formData.existing_coverage_spouse || 'current coverage amount'}

[Write detailed explanation of why the existing policy doesn't meet their needs based on: ${formData.replacement_reason} and ${formData.disadvantages_old}. Include specific details about current premiums and policy features.]

Current Premiums: The current premiums being paid are as follows
• ${formData.client_name ? formData.client_name.split()[0] : 'Primary'}: ${formData.existing_premium_primary || formData.existing_premium || 'current premium'} for ${formData.existing_coverage_primary || formData.existing_coverage || 'current coverage'}
• ${formData.spouse_name || 'Spouse'}: ${formData.existing_premium_spouse || 'current premium'} for ${formData.existing_coverage_spouse || 'current coverage'}

[Based on the replacement reason provided (${formData.replacement_reason}), explain the specific issues with the current policy and why the client expressed a desire to replace it.]

Based on our discussions, you have chosen:
• ${formData.new_policy_type || 'New life insurance'} coverage of ${formData.new_coverage_primary || 'coverage amount'} for ${formData.client_name ? formData.client_name.split()[0] : 'primary insured'}
• ${formData.new_policy_type || 'New life insurance'} coverage of ${formData.new_coverage_spouse || 'coverage amount'} for ${formData.spouse_name || 'spouse'}

**Why doesn't the existing policy meet your needs?**

[Write detailed explanation based on the specific issues provided: ${formData.disadvantages_old} and ${formData.replacement_reason}. Consider the ages if provided: primary at ${formData.client_age || 'current age'} and spouse at ${formData.spouse_age || 'current age'}.]

**How does the new policy meet your needs?**

To address your coverage needs, the following policies have been proposed:

${formData.new_policy_type || 'Life Insurance'}

• ${formData.client_name ? formData.client_name.split()[0] : 'Primary'}: ${formData.new_coverage_primary || formData.new_coverage || 'new coverage amount'}

• ${formData.spouse_name || 'Spouse'}: ${formData.new_coverage_spouse || 'new coverage amount'}

• Total proposed premium of ${formData.new_premium_total || formData.new_premium || 'new premium amount'}

[Write detailed explanation of how the new policy addresses their needs based on: ${formData.benefits_new}]

**What are the risks associated with the proposed replacement?**

Life insurance policies typically include a two-year contestability and suicide exclusion period. This means that for the first two years from the effective date of a new policy:

• The insurance company has the right to review and deny a claim if there was a misstatement of material information in the application.

• If the insured passes away due to self-harm, the policy will not pay out the death benefit.

When you take a new policy with ${formData.new_company}, or any other insurer, this two-year period resets and will begin from the effective date of the new contract. It's important to keep this in mind when considering policy replacement.

[Compare coverage amounts ${formData.existing_coverage} vs ${formData.new_coverage} and premium amounts ${formData.existing_premium} vs ${formData.new_premium}. Note any reductions or increases and explain client's comfort level with the changes.]

**More Information**

If you have any questions about the policy or this document, please let me know. Our strong recommendation will be to not cancel your existing ${formData.existing_company} policy, until your new coverage has been approved.

${formData.agent_name}
Advisor

I understand the explanation provided to me regarding the advantages and disadvantages of the Policy Replacement.

${formData.client_name}

__________________________
Date: 

${formData.spouse_name || ''}

__________________________
Date: 

Make this sound professional, detailed, and personalized to the specific situation. Use insurance industry terminology and maintain the formal but approachable tone. Include specific dollar amounts and policy details. Write in paragraph form where indicated, not bullet points for the main content sections.

IMPORTANT: 
- This is a COUPLE replacement - focus on the specific reasons provided by the client for replacement and the benefits of the new policy as described in the form data.
- DO NOT add any notes, brackets, or placeholder text about policy numbers. If a policy number is provided, use it exactly as given. If not provided, omit the policy number line entirely.
- Keep all information clean and professional without explanatory notes.`;
    } else {
        // INDIVIDUAL PROMPT - Dynamic based on form data
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

Client Name: ${formData.client_name}${formData.existing_policy_number ? `\nCurrent Policy Number: ${formData.existing_policy_number}` : ''}
Existing Insurance Company: ${formData.existing_company}
Company Issuing New Policy: ${formData.new_company}

Dear ${formData.client_name ? formData.client_name.split()[0] : 'Client'},

You have reached out to us requesting for a ${formData.new_policy_type || 'new life insurance'} policy to potentially replace your current ${formData.existing_policy_type || 'life insurance'} policy issued by ${formData.existing_company}. The analysis below is based on information you have shared with us regarding your existing policy and how your coverage preferences are not met in the existing coverage. You are comfortable with the life insurance replacement that you have requested based on the information you already have about the policy. I am enclosing below some comparison points that you should consider, as you decide on the replacement.

**Summary of policy replacement**

You have reached out to us seeking a replacement of your current ${formData.existing_policy_type || 'life insurance policy'} issued by ${formData.existing_company}.

[Write a detailed paragraph about the current policy situation - coverage amount ${formData.existing_coverage}, premium ${formData.existing_premium}, and why client wants replacement based on: ${formData.replacement_reason}. ${formData.client_age ? `Consider the client's age of ${formData.client_age} in your analysis.` : ""} Include specific details about the existing policy issues: ${formData.disadvantages_old}]

You are therefore seeking a new ${formData.new_policy_type || 'policy'} in order to:
• [Extract first main benefit from: ${formData.benefits_new}]
• [Extract second main benefit from: ${formData.benefits_new}]

**Why doesn't the existing policy meet your needs?**

[Write detailed explanation based on: ${formData.disadvantages_old} and ${formData.replacement_reason}. Be specific about the policy type issues and why it doesn't work for the client's current situation.]

**How does the new policy meet your needs?**

[Write detailed explanation of new ${formData.new_policy_type || 'policy'} features and benefits, including coverage amount ${formData.new_coverage} and premium ${formData.new_premium}. Base this on: ${formData.benefits_new}]

The new proposed ${formData.new_policy_type || 'coverage'} has the following features which make it attractive to you:
[Extract specific benefits from ${formData.benefits_new} and present as bullet points]

**What are the risks associated with the proposed replacement?**

Life insurance policies typically include a two-year contestability and suicide exclusion period. This means that for the first two years from the effective date of a new policy:

• The insurance company has the right to review and deny a claim if there was a misstatement of material information in the application.
• If the insured passes away due to self-harm, the policy will not pay out the death benefit.

When you take a new policy with ${formData.new_company}, or any other insurer, this two-year period resets and will begin from the effective date of the new contract. It's important to keep this in mind when considering policy replacement.

[Compare coverage amounts ${formData.existing_coverage} vs ${formData.new_coverage} and premium amounts ${formData.existing_premium} vs ${formData.new_premium}. Note any reductions or increases and explain client's comfort level with the changes.]

**More Information**

If you have any questions about the policy or this document, please let me know. Our strong recommendation will be to not cancel your existing ${formData.existing_company} policy, until your new coverage has been approved.

${formData.agent_name}
Advisor

I understand the explanation provided to me regarding the advantages and disadvantages of the Policy Replacement.

${formData.client_name}

__________________________
Date: 

Make this sound professional, detailed, and personalized to the specific situation. Use insurance industry terminology and maintain the formal but approachable tone. Include specific dollar amounts and policy details. Write in paragraph form where indicated, not bullet points for the main content sections.

IMPORTANT: 
- This is an INDIVIDUAL POLICY replacement - focus on the specific reasons and benefits provided in the form data rather than generic scenarios.
- DO NOT add any notes, brackets, or placeholder text about policy numbers. If a policy number is provided, use it exactly as given. If not provided, omit the policy number line entirely.
- Keep all information clean and professional without explanatory notes.`;
    }

    // Create the document header with client and policy information
    let headerInfo = `Client Name: ${formData.client_name}`;
    if (formData.existing_policy_number) {
      headerInfo += `\nCurrent Policy Number: ${formData.existing_policy_number}`;
    }
    headerInfo += `\nExisting Insurance Company: ${formData.existing_company}
Company Issuing New Policy: ${formData.new_company}
Date: ${formData.date}

**Explanation of Advantages and Disadvantages of Policy Replacement**`;

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