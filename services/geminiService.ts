
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BankTransaction, FinancialRecord, GeminiSuggestion } from '../types';

if (!process.env.API_KEY) {
    // This is a failsafe; the environment should have the API key.
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const findPotentialMatches = (
    item: BankTransaction | FinancialRecord,
    searchSpace: (BankTransaction | FinancialRecord)[],
    amountTolerance: number,
    dateTolerance: number
): (BankTransaction | FinancialRecord)[] => {
    const itemDate = new Date(item.date).getTime();
    return searchSpace
        .map(record => {
            const recordDate = new Date(record.date).getTime();
            const dateDiff = Math.abs(itemDate - recordDate) / (1000 * 3600 * 24);
            const amountDiff = Math.abs(item.amount - record.amount);
            
            // Looser tolerance for finding potential matches for AI analysis
            if (dateDiff <= dateTolerance * 5 && amountDiff <= amountTolerance * 5) {
                return record;
            }
            return null;
        })
        .filter((record): record is BankTransaction | FinancialRecord => record !== null)
        .slice(0, 5); // Limit to 5 potential matches
};

export const getCorrectionSuggestion = async (
    item: BankTransaction | FinancialRecord,
    potentialMatchesSource: (BankTransaction | FinancialRecord)[],
    type: 'bank' | 'record'
): Promise<GeminiSuggestion> => {

    const potentialMatches = findPotentialMatches(item, potentialMatchesSource, 500, 7);

    const unmatchedItemDetails = type === 'bank'
        ? `- Date: ${(item as BankTransaction).date}\n- Description: ${(item as BankTransaction).description}\n- Amount: ${(item as BankTransaction).amount}\n- Reference: ${(item as BankTransaction).reference_number}`
        : `- Date: ${(item as FinancialRecord).date}\n- Vendor: ${(item as FinancialRecord).vendor}\n- Amount: ${(item as FinancialRecord).amount}\n- Invoice ID: ${(item as FinancialRecord).invoice_id}`;

    const potentialMatchesDetails = potentialMatches.length > 0
        ? potentialMatches.map(p => {
            return type === 'bank'
                ? `- Date: ${(p as FinancialRecord).date}, Vendor: ${(p as FinancialRecord).vendor}, Amount: ${p.amount}, Invoice ID: ${(p as FinancialRecord).invoice_id}`
                : `- Date: ${(p as BankTransaction).date}, Description: ${(p as BankTransaction).description}, Amount: ${p.amount}, Reference: ${(p as BankTransaction).reference_number}`;
        }).join('\n')
        : "No potential matches found in the other list based on a loose search.";

    const prompt = `
        You are an expert financial reconciliation analyst.
        Analyze the following unmatched transaction and compare it against a list of potential matches from the other financial document.

        **Unmatched Transaction (${type === 'bank' ? 'from Bank Statement' : 'from Internal Records'}):**
        ${unmatchedItemDetails}

        **Potential Matching Transactions (from ${type === 'bank' ? 'Internal Records' : 'Bank Statement'}):**
        ${potentialMatchesDetails}

        Based on this data, please provide a concise analysis and suggest a corrective action.
        Your entire response MUST be a single, valid JSON object with two keys: "analysis" and "suggestion".
        Do not include any other text, explanations, or markdown fences like \`\`\`json.

        Example analysis: "The amount is slightly different, but the date and description are very close to a record. This could be due to a bank fee or a data entry error."
        Example suggestion: "Verify invoice [invoice_id] and adjust the amount in the financial record to match the bank statement."
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
        }
    });

    try {
        let jsonStr = response.text.trim();
        // Sometimes the model might still wrap the JSON in markdown, so we defensively clean it.
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        const parsedData = JSON.parse(jsonStr);
        return parsedData as GeminiSuggestion;
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text, e);
        return {
            analysis: "Could not automatically analyze the transaction.",
            suggestion: "The AI response was not in the expected format. Please manually review the transaction and potential matches."
        };
    }
};
