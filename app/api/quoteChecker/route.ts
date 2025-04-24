import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getCombinations(gender: string | null, smoker: string | null, premium: number | null, paymentType: string | null) {
  const genders = gender === null ? ['M', 'F'] : [gender.toLowerCase().startsWith('m') ? 'M' : 'F']
  const smokers = smoker === null ? ['NT', 'T'] : [smoker === 'Non-Smoker' ? 'NT' : 'T']
  const premiums = premium ? [`B${premium}`] : ['B100']
  const products = paymentType ? [paymentType] : ['PLIFE', 'P20']

  const combos = []
  for (const g of genders) {
    for (const s of smokers) {
      for (const p of premiums) {
        for (const prod of products) {
          combos.push(`${g}-${prod}-${s}-${p}`)
        }
      }
    }
  }
  return combos
}

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  const extractRes = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a data extraction expert for an insurance chatbot. Your job is to extract structured values from user messages and return them in valid JSON. DO NOT return anything except a clean JSON object.

Identify:
- "gender": Based on words like male, female, man, woman, son, daughter
- "smoker_status": If not mentioned, default to "Non-Smoker"
- "payment_type": 
    • If the user says "20 years", "20-year", or "paying for 20 years", set "P20"
    • If they say "whole life", "lifetime", or "life pay", set "PLIFE"
- "premium": Extract numeric monthly premium from message
- "current_age": User's current age
- "projected_age": If provided

Return valid JSON in this exact structure:
{
  "current_age": number,
  "projected_age": number | null,
  "gender": "Male" | "Female" | null,
  "smoker_status": "Non-Smoker" | "Smoker" | null,
  "premium": number,
  "payment_type": "PLIFE" | "P20" | null
}
        Do NOT return any explanation or text. Only return a valid JSON object.`
      },
      { role: 'user', content: query }
    ]
  })

  let extracted: any = {}
  try {
    extracted = JSON.parse(extractRes.choices[0].message.content || '{}')
  } catch (err) {
    console.error('❌ GPT response is not valid JSON:', extractRes.choices[0].message.content)
    return NextResponse.json(
      { error: 'AI was unable to extract your data correctly. Please rephrase your input.' },
      { status: 400 }
    )
  }

  const {
    current_age,
    projected_age = null,
    gender = null,
    smoker_status = null,
    premium = null,
    payment_type = null
  } = extracted

  if (!current_age || !premium || typeof current_age !== 'number' || typeof premium !== 'number') {
    return NextResponse.json(
      { error: 'Missing or invalid required fields: current_age and premium must be numbers.' },
      { status: 400 }
    )
  }
  const filePath = path.join(process.cwd(), 'app/data/merged_combined_all.json')
  const fileData = await fs.readFile(filePath, 'utf-8')
  const allPremiumData = JSON.parse(fileData)
  
  const premiumKey = String(premium)
  const data = allPremiumData[premiumKey]
  
  if (!data) {
    return NextResponse.json(
      { error: `No data found for premium ${premium}` },
      { status: 404 }
    )
  }

  const keysToCheck = getCombinations(gender, smoker_status, premium, payment_type)
  const matches: any[] = []

  for (const key of keysToCheck) {
    const entries = data[key] || []
    const filtered = entries.filter((entry: any) =>
        entry.current_age === current_age &&
        entry.projected_age >= current_age &&
        (projected_age ? entry.projected_age <= projected_age : true)
      )
    matches.push(...filtered)
  }

  const summaryPrompt = `
You are an expert insurance assistant. DO NOT FORGET THAT YOU ARE EXPERT INSURANCE Agent. Based on this client profile:
- Age: ${current_age}
- Projected Age: ${projected_age || 'Not provided'}
- Gender: ${gender || 'Not provided'}
- Smoker Status: ${smoker_status || 'Not provided'}
- Monthly Premium: $${premium}
- Payment Type: ${payment_type || 'Not provided'}

Here is the matching data:
${JSON.stringify(matches.slice(0, 10), null, 2)}

Use the JSON data in best possible way and Generate a friendly and helpful insurance summary in natural language. Use short paragraphs or bullet points to explain what plans they qualify for, what benefits they might get till the age of 100 and do not give information about irr_death_benefit and irr_cash_value. Club the values and do  not give for every year as it is not going be an efficient way to show the information. Also give the data for bigger age numbers and not just for beginning values because it will not be impactful. Make sure to give data after 10 years gap. Also make sure you return data for bigger values too.

Also if projected age is "Not provided", then for more detailed points, consider projected age=current age+20, show various options data after projected age but in ascending order with the gap of 5 years.

Keep it very informative & USE BULLET POINTS TO SHOW INFORMATION IN THE BEST WAY WITH MAXIMUM OF 200 WORDS. 
DO NOT ADD ANYTHING LIKE "Let me know if you have any questions, I'm here to help you make the best insurance decision for your future.
do not add anything like 
If projected age was not provided, here's what your plan might look like:

- Current Age +20 years (Age 70): Plan options and benefits would be recalculated based on this age and shown in ascending order with a gap of 5 years.
"
`

  const aiRes = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful AI insurance advisor.' },
      { role: 'user', content: summaryPrompt }
    ]
  })

  const naturalLanguageSummary = aiRes.choices[0].message.content
//   const graphData = matches
//   .filter(entry => entry.projected_age && entry.projected_death_benefit)
//   .map(entry => ({
//     age: entry.projected_age,
//     deathBenefit: entry.projected_death_benefit,
//     premium
//   }))
//     .sort((a, b) => a.age - b.age)

    // console.log(graphData)
  return NextResponse.json({
    extracted,
    message: naturalLanguageSummary
  })
}
