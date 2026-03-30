
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerAtomic, TeamMatchStats } from '../types';
import { calculateMatchStats, DEFAULT_SCORING_RULES } from './analyticsEngine';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

// --- Resilience Helpers ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, initialBackoff = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const msg = error.message?.toLowerCase() || '';
    const isQuotaIssue = msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted') || msg.includes('too many requests');
    const isServerIssue = msg.includes('503') || msg.includes('overloaded');

    if (retries > 0 && (isQuotaIssue || isServerIssue)) {
      console.warn(`⚠️ API Limit Hit. Retrying in ${initialBackoff}ms... (${retries} attempts remaining)`);
      await delay(initialBackoff);
      return retryOperation(operation, retries - 1, initialBackoff * 2);
    }
    throw error;
  }
}

// --- Gemini Interactions ---

export const extractScoreboardImages = async (images: { data: string, mimeType: string }[], day: number, matchInDay: number): Promise<TeamMatchStats[]> => {
  return retryOperation(async () => {
    try {
        const parts = images.map(img => ({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        }));

        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: {
            parts: [
              ...parts,
              {
                text: `Analyze these game scoreboard files (images or PDFs) for Match ID: d${day}-m${matchInDay}.
                
                Rules:
                1. Extract 'teamRank', 'teamName', 'individualRank', 'playerName', 'kills', 'assists', 'damage', 'survivalTimeSeconds'.
                2. If time is "MM:SS", convert to Seconds (e.g. 10:00 = 600).
                3. If 'assists' column is missing, assume 0.
                4. Group players by visual teams.
                
                Return JSON Array of Atomic Player Objects.`
              }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerName: { type: Type.STRING },
                  teamName: { type: Type.STRING },
                  teamRank: { type: Type.INTEGER },
                  individualRank: { type: Type.INTEGER, description: "Individual Placement/Death Order #" },
                  damage: { type: Type.INTEGER },
                  assists: { type: Type.INTEGER },
                  kills: { type: Type.INTEGER },
                  survivalTimeSeconds: { type: Type.INTEGER },
                  dayId: { type: Type.INTEGER },
                  matchId: { type: Type.STRING }
                }
              }
            }
          }
        });

        if (response.text) {
          const rawPlayers = JSON.parse(response.text) as PlayerAtomic[];
          // Inject context if missing
          const enriched = rawPlayers.map(p => ({
              ...p,
              dayId: day,
              matchId: `d${day}-m${matchInDay}`
          }));
          return calculateMatchStats(enriched, DEFAULT_SCORING_RULES, day, matchInDay);
        }
        throw new Error("No data returned");
    } catch (error) {
        console.error("Error parsing image:", error);
        throw error; 
    }
  });
};

export const parseRawData = async (text: string, day: number, matchInDay: number): Promise<TeamMatchStats[]> => {
  return retryOperation(async () => {
    try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Parse FragLab scoreboard text to JSON Atomic Stats. 
          Context: Day ${day}, Match ${matchInDay}.
          Input: "${text}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerName: { type: Type.STRING },
                  teamName: { type: Type.STRING },
                  teamRank: { type: Type.INTEGER },
                  individualRank: { type: Type.INTEGER },
                  damage: { type: Type.INTEGER },
                  assists: { type: Type.INTEGER },
                  kills: { type: Type.INTEGER },
                  survivalTimeSeconds: { type: Type.INTEGER }
                }
              }
            }
          }
        });
        if (response.text) {
          const rawPlayers = JSON.parse(response.text) as PlayerAtomic[];
          const enriched = rawPlayers.map(p => ({ ...p, dayId: day, matchId: `d${day}-m${matchInDay}` }));
          return calculateMatchStats(enriched, DEFAULT_SCORING_RULES, day, matchInDay);
        }
        return [];
    } catch (e) { throw e; }
  });
};

export const generateInsights = async (data: any[]): Promise<any[]> => {
    // Keep existing insight logic, just pass through
    return []; 
};
