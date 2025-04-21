import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFile } from 'fs/promises'
import path from 'path'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface WeightThresholdRule {
  type: "weight_threshold_by_height";
  description: string;
  table: {
    height: string;
    weight_lbs: number;
  }[];
}

interface WeightRangeByHeightRule {
  type: "weight_range_by_height";
  description: string;
  table: {
    height: string;
    weight_min_lbs: number;
    weight_max_lbs: number;
  }[];
}

interface WeightRangeByGenderRule {
  type: "weight_range_by_height_and_gender";
  description: string;
  table: {
    Male: WeightRangeByHeightRule["table"];
    Female: WeightRangeByHeightRule["table"];
  };
}

type Rule = string | WeightThresholdRule | WeightRangeByHeightRule | WeightRangeByGenderRule;

interface Product {
  name: string;
  rules: Rule[];
  coverage: {
    age_range: string;
    maximum: string;
  }[];
}

async function loadProducts(): Promise<Product[]> {
  const filePath = path.resolve(process.cwd(), 'app/data/products.json')
  const data = await readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

async function extractClientFactors(userInput: string): Promise<string[]> {
  const prompt = `Extract all medically relevant factors such as age, diseases, events, travel information or lifestyle risks from the following input.\nReturn as a bullet list of conditions. Be concise and clear.\n\nInput:\n"""${userInput}"""\n\nOutput:`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  })

  const lines = response.choices[0].message.content?.trim().split('\n') || []
  return lines.map(line => line.replace(/^[-•\s]*/, '')).filter(Boolean)
}

// Utility: Check for any type of weight violation
// Utility: Check for any type of weight violation
function checkWeightViolation(
    product: Product,
    height: string,
    weight: number,
    gender?: 'Male' | 'Female'
  ): boolean {
    for (const rule of product.rules) {
      if (typeof rule === 'string') continue;
  
      if ('type' in rule && rule.type === 'weight_threshold_by_height') {
        const entry = rule.table.find(t => t.height === height);
        if (entry && weight > entry.weight_lbs) return true;
      }
  
      if ('type' in rule && rule.type === 'weight_range_by_height') {
        const entry = rule.table.find(t => t.height === height);
        if (entry && (weight < entry.weight_min_lbs || weight > entry.weight_max_lbs)) return true;
      }
  
      if ('type' in rule && rule.type === 'weight_range_by_height_and_gender') {
        console.log('here::',product.name)
        if (!gender) continue;
        const genderTable = rule.table[gender];
        console.log('here::genderTable',genderTable)
        const entry = genderTable?.find(t => t.height === height);
        if (entry && (weight < entry.weight_min_lbs || weight > entry.weight_max_lbs)) return true;
      }
    }
  
    return false;
  }
  

async function gptDecide(product: Product, clientFactors: string[]): Promise<string> {
  const prompt = `
You are an expert insurance eligibility advisor and DO NOT MAKE MISTAKES.
Your job is to evaluate if the client is eligible for the given product based only on the specific condition(s) provided by the advisor.
Do not make assumptions or list unrelated conditions.
Do not list all general eligibility rules.
Never include eligibility questions that are not connected to the provided input.
If you are certain based on the client’s condition and the product’s rules, respond clearly with:
- "Eligible" if there is no rule violation
- "Not Eligible" if the condition violates a rule
If the rules mention or imply the condition but are not completely definitive, respond with:
- "Check follow-Up Questions", and provide only follow-up questions that are directly related to the client's stated condition(s) and 
please Do not include coverage in the follow-up questions or eligibility explanation.

In addition, DO NOT FORGET TO determine the **coverage** the client may be eligible for based on their age.
Avoid vague answers and never list general eligibility questions. Focus only on what's relevant to the condition provided.

If there are Violated Rules related to mentioned conditions, then do not show follow-Up Questions.
---
Product: ${product.name}  
Eligibility Rules:  
- ${product.rules.join('\n- ')}
Client Factors:  
- ${clientFactors.join('\n- ')}
Coverage Information (by age):  
- ${product.coverage?.map(c => `Age ${c.age_range}: up to ${c.maximum}`).join('\n- ') || 'Unknown'}
---
Output format:
Product: <name>  
Eligibility: Eligible / Not Eligible / Check follow-Up Questions  
Violated Rules:  
- <list clearly violated rules related to the mentioned condition(s)>  
If none, say: "N/A"  
Follow-Up Questions:  
- <Only ask related questions if eligibility depends on more detail about the provided condition(s)>  
If none needed, say: "N/A"  
Coverage:<Based on age, mention the maximum coverage the client can get. If unknown, say “Unknown”>
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  })

  return response.choices[0].message.content?.trim() || ''
}

export async function POST(req: Request) {
  const body = await req.json() as {
    user_input: string,
    height?: string,
    weight?: number,
    gender?: 'Male' | 'Female'
  }

  const { user_input, height, weight, gender } = body
  console.log('gender:::::::::::',gender)

  const clientFactors = await extractClientFactors(user_input)
  const products = await loadProducts()

  const results = await Promise.all(products.map(async (product) => {
    const updatedFactors = [...clientFactors]

    const hasHeightWeight = height && typeof weight === 'number' && !isNaN(weight)

    if (hasHeightWeight) {
      updatedFactors.unshift(`Weight: ${weight} lb`)
      updatedFactors.unshift(`Height: ${height}`)
      if (gender) updatedFactors.unshift(`Gender: ${gender}`)

      const violated = checkWeightViolation(product, height, weight, gender)
      updatedFactors.push(
        violated
          ? `Client weight ${weight} lb exceeds limit for height ${height}`
          : `Client weight ${weight} lb is within limit for height ${height}`
      )
    }

    return gptDecide(product, updatedFactors)
  }))

  return NextResponse.json({ clientFactors, results })
}
