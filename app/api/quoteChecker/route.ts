// File: app/api/coverageChecker/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

let cachedData: Record<string, any> = {}

async function loadJsonData(): Promise<Record<string, any>> {
  if (Object.keys(cachedData).length === 0) {
    const filePath = path.join(process.cwd(),'app/data/all_sheets_combined.json')
    const fileData = await fs.readFile(filePath, 'utf-8')
    cachedData = JSON.parse(fileData)
  }
  return cachedData
}

function getCombinations(gender: string | null, smoker: string | null, premium: number | null) {
  const genders = gender === null ? ['M', 'F'] : [gender.toLowerCase().startsWith('m') ? 'M' : 'F']
  const smokers = smoker === null ? ['NT', 'T'] : [smoker === 'Non-Smoker' ? 'NT' : 'T']
  const premiums = premium ? [`B${premium}`] : ['B100'] // default to B100
  const products = ['PLIFE', 'P20']

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
    
    // Load full JSON data

    // Extract structured fields using GPT
    const gptRes = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent assistant trained to extract structured data from client messages for insurance planning.
    Identify and return:
    - current age (required)
    - projected age (optional)
    - gender (Male or Female)
    - smoker status (Non-Smoker or Smoker)
    - monthly premium in dollars (required)
    
    Use context clues in the client's language to infer gender and smoker status when not explicitly stated (e.g., he = Male, she = Female, 'doesn't smoke' = Non-Smoker).
    If still unclear, return null for those fields.
    
    Return result strictly in this JSON format:
    {
      "current_age": number,
      "projected_age": number | Not Provided,
      "gender": "Male" | "Female" | Not Provided,
      "smoker_status": "Non-Smoker" | "Smoker" | Not Provided,
      "premium": number
    }`
          },
          {
            role: 'user',
            content: query
          }
        ]
      })
    
      const extracted = JSON.parse(gptRes.choices[0].message.content || '{}')
      const {
        current_age,
        projected_age = null,
        gender = null,
        smoker_status = null,
        premium = null
      } = extracted

    const filePath = path.join(process.cwd(), 'app/data/all_sheets_combined_'+premium+'.json')
    const fileData = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(fileData)
  
    
  
    const keysToCheck = getCombinations(gender, smoker_status, premium)
  
    const baseAgeResults: Record<string, any[]> = {}
    const projectionResults: Record<string, any[]> = {}
  
    for (const key of keysToCheck) {
      const entries = data[key] || []
  
      const baseMatches = entries.filter((entry: any) =>
        entry.current_age === current_age && entry.projected_age === current_age
      )
  
      const projectionMatches = projected_age
        ? entries.filter((entry: any) =>
            entry.current_age === current_age && entry.projected_age === projected_age
          )
        : []
  
      if (baseMatches.length > 0) baseAgeResults[key] = baseMatches
      if (projectionMatches.length > 0) projectionResults[key] = projectionMatches
    }
  
    console.log({
        extracted,
        baseAgeResults,
        projectionResults
      })
    return NextResponse.json({
      extracted,
      baseAgeResults,
      projectionResults
    })
  }
  