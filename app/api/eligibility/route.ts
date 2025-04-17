// app/api/eligibility/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFile } from 'fs/promises'
import path from 'path'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY})

interface Product {
    name: string
    rules: string[]
    coverage: {
      age_range: string
      maximum: string 
    }[]
  }

async function loadProducts(): Promise<Product[]> {
  const filePath = path.resolve(process.cwd(), 'app/data/products.json')
  const data = await readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

async function extractClientFactors(userInput: string): Promise<string[]> {
  const prompt = `Extract all medically relevant factors, age, diseases, events, or lifestyle risks from the following input.\nReturn as a bullet list of conditions. Be concise and clear.\n\nInput:\n"""${userInput}"""\n\nOutput:`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  })

  const lines = response.choices[0].message.content?.trim().split('\n') || []
  return lines.map(line => line.replace(/^[-•\s]*/, '')).filter(Boolean)
}

async function gptDecide(product: Product, clientFactors: string[]): Promise<string> {
  const prompt = `
You are an expert insurance eligibility advisor.
Your job is to evaluate if the client is eligible for the given product based only on the specific condition(s) provided by the advisor.

Do not make assumptions or list unrelated conditions.

If you are certain based on the client’s condition and the product’s rules, respond clearly with:
- "Eligible" if there is no rule violation
- "Not Eligible" if the condition violates a rule

If the rules mention or imply the condition but are not completely definitive, respond with:
- "Check follow-Up Questions", and provide only follow-up questions that are directly related to the client's stated condition(s) and 
please Do not include coverage in the follow-up questions or eligibility explanation.
In addition, DO NOT FORGET TO determine the **coverage** the client may be eligible for based on their age.

Avoid vague answers and never list general eligibility questions. Focus only on what's relevant to the condition provided.

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
- <Only ask questions if eligibility depends on more detail about the provided condition(s)>  
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
  const body = await req.json() as { user_input: string }
  const userInput = body.user_input

  const clientFactors = await extractClientFactors(userInput)
  const products = await loadProducts()

  const results = await Promise.all(
    products.map(product => gptDecide(product, clientFactors))
  )

  return NextResponse.json({ clientFactors, results })
}
