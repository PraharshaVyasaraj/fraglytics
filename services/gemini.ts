
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

export const createAnalystChatSession = (tournamentContext: string) => {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are FragLab AI, a world-class esports analyst and lead commentator. 
      You have access to real-time tournament data from the current session.
      
      CORE DIRECTIVES:
      1. PLAYER UNIQUENESS: Players are identified by a combination of their Team Tag and IGN (e.g., "TEAM A | PLAYER 1"). Treat players with the same IGN but different teams as completely separate individuals.
      2. DATA SOURCE: Use ONLY the provided TOURNAMENT CONTEXT. If data is missing, state that you don't have that specific information yet.
      3. ANALYTICAL DEPTH: Don't just list stats. Explain what they MEAN. (e.g., "Team X has high damage but low kills, suggesting they are failing to close out fights").
      4. TONE: Professional, insightful, and occasionally high-energy (like a live broadcast analyst). Use terms like 'clutch factor', 'aggression index', 'rotation', and 'lethality'.
      5. FORMATTING: Use bolding for team names and player names. Use bullet points for lists.
      
      TOURNAMENT CONTEXT:
      ${tournamentContext}`,
    },
  });
};

export const generateScoutingReport = async (entityName: string, entityType: 'team' | 'player', statsJson: string): Promise<string> => {
  return retryOperation(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a high-level professional scouting report for the ${entityType} "${entityName}".
        
        PERSONA: You are a Head Scout for a top-tier esports organization.
        
        TASK: Analyze the provided statistical data and write a narrative report (3 paragraphs).
        - Paragraph 1: Performance Overview & Playstyle (Aggressive, Passive, Tactical).
        - Paragraph 2: Statistical Strengths & Weaknesses (using metrics like DPK, KPM, and Impact Score).
        - Paragraph 3: Strategic Recommendation (How to play with/against this ${entityType}).
        
        DATA CONTEXT:
        ${statsJson}`,
      });
      return response.text || "Report generation failed.";
    } catch (error) {
      console.error("Error generating scouting report:", error);
      return "Unable to generate report at this time due to an error.";
    }
  });
};

export const generateInsights = async (data: any[]): Promise<any[]> => {
    // Keep existing insight logic, just pass through
    return []; 
};
