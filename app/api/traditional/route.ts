import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ProductEntry {
  disease_name: string
  definition: string
  underwriting_focus: string[]
  requirements: string[]
  underwriting_action: {
    life: string | Record<string, string>
    critical_illness: {
      best_case: string
      otherwise: string
    }
  }
}

interface CompanyProduct {
  company_name: string
  data: ProductEntry[]
}

async function extractClientFactors(userInput: string) {
  const prompt = `
You are helping insurance underwriters.

From the following client input, extract key medical or lifestyle information.

Return in this format:
[
  { "label": "age", "value": "52" },
  { "label": "condition", "value": "diabetes type 1" },
  ...
]

Input:
"""${userInput}"""
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  })

  const content = response.choices[0].message.content?.trim()
  try {
    const match = content?.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonStr = match ? match[1] : content
    const parsed = JSON.parse(jsonStr || '')
    if (Array.isArray(parsed) && parsed.every(p => p.label && p.value)) return parsed
  } catch (err) {
    console.error('Failed to parse client factors:', err)
  }

  return []
}

async function loadTraditionalProducts(condition?: string): Promise<CompanyProduct[]> {
  const filePath = path.resolve(process.cwd(), 'app/data/underwriting.json')
  const data = await readFile(filePath, 'utf-8')
  const companies: CompanyProduct[] = JSON.parse(data)
  if (!condition) return companies

  const matches: CompanyProduct[] = []

  for (const company of companies) {
    const diseaseList = company.data.map((entry, idx) => `(${idx + 1}) ${entry.disease_name}`).join('\n')

    const prompt = `
You are a medical underwriting assistant.

The client condition is: "${condition}".

Below is a numbered list of known medical conditions from an insurance company. Your task is to return a list of numbers where each number corresponds to a condition that is either:
- An **exact match**,
- A **common synonym**, or
- A **very closely related variant** (e.g., "Diabetes Type 1" for "Type 1 Diabetes").

Do NOT include broader umbrella terms (e.g., do not return "Cancer" when the query is "Breast Cancer" or "Gastric bypass surgery" when the query is "Obesity").

List of known conditions:
${diseaseList}

Return the result as a JSON array of numbers, like: [1, 4, 6]
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    })

    let matchIndexes: number[] = []
    try {
      const content = response.choices[0].message.content?.trim() || ''
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonStr = match ? match[1] : content
      matchIndexes = JSON.parse(jsonStr)
    } catch (err) {
      console.warn(`Could not parse AI response for ${company.company_name}:`, err)
    }

    const relevantEntries = matchIndexes.map(i => company.data[i - 1]).filter(Boolean)
    if (relevantEntries.length > 0) {
      matches.push({ company_name: company.company_name, data: relevantEntries })
    }
  }

  return matches
}

export async function POST(req: Request) {
  const body = await req.json() as {
    user_input: string
    height?: string
    weight?: number
    gender?: 'Male' | 'Female'
  }

  const clientFactors = await extractClientFactors(body.user_input)
  const condition = clientFactors.find(f => f.label.toLowerCase() === 'condition')?.value || ''
  const clientAge = clientFactors.find(f => f.label.toLowerCase() === 'age')?.value || 'Unknown'
  const companies = await loadTraditionalProducts(condition)

  const rankingPrompt = `
You are an expert life insurance underwriter.

You have a list of companies offering life insurance products for the same condition.
Your task is to rank these companies from best to worst based only on their **"life underwriting action"**.

Use the provided client age to determine the most relevant underwriting rule for each company. 
Evaluate which company offers the most favourable terms (e.g., "Standard" is best, then +25%, +50%, etc., "Decline" is worst). 

### Client Information:
- Age: ${clientAge}

### Company Product Data:
${companies.map(company => {
    return `Company: ${company.company_name}
Products:
${company.data.map(product =>
      `- Condition: ${product.disease_name}
  - Life Underwriting Action:
${typeof product.underwriting_action.life === 'string'
        ? `    - General: ${product.underwriting_action.life}`
        : Object.entries(product.underwriting_action.life || {})
          .map(([key, val]) => `    - ${key}: ${val}`)
          .join('\n')}
  - Definition: ${product.definition}`
    ).join('\n')}`
  }).join('\n\n')}

### Task:
Based on the client's age and each company’s life underwriting action, return your output as a JSON array ranked from best to worst. Deeply analyse the life underwriting action and understand the language as an expert life insurance underwriter and return the most accurate answer. Do not repeat any company:
[
  { "company": "Company Name", "reason": "Why this company is ranked best or better than others on the basis of life underwriting action?" },
  ...
]
`

  const aiRankResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: rankingPrompt }],
    temperature: 0
  })

  let rankedCompanies: any[] = []
  try {
    const content = aiRankResponse.choices[0].message.content?.trim() || ''
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonStr = match ? match[1] : content
    rankedCompanies = JSON.parse(jsonStr)
  } catch (err) {
    console.error('Failed to parse ranked companies:', err)
  }

  const detailedRanked = rankedCompanies.map(entry => {
    const companyDetails = companies.find(c => c.company_name === entry.company)
    return {
      company: entry.company,
      reason: entry.reason,
      products: companyDetails?.data.map(p => ({
        condition: p.disease_name,
        definition: p.definition,
        underwriting_focus: p.underwriting_focus,
        requirements: p.requirements,
        underwriting_action_life: p.underwriting_action?.life || 'Unavailable'
      })) || []
    }
  })

  return NextResponse.json({
    clientFactors,
    results: detailedRanked
  })
}
