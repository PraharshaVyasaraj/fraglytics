import { Snapshot } from '../types';

export const SAMPLE_SNAPSHOT: Snapshot = {
  "meta": {
    "type": "FRAGLAB_SNAPSHOT",
    "version": "1.0",
    "timestamp": 1774886853305,
    "hash": "sample-hash"
  },
  "config": {
    "rules": {
      "killMultiplier": 1,
      "rankPoints": {
        "1": 10,
        "2": 6,
        "3": 5,
        "4": 4,
        "5": 3,
        "6": 2,
        "7": 1,
        "8": 1
      },
      "belowThresholdPoints": 0
    },
    "branding": {
      "orgName": "TCE",
      "tournamentName": "SPRINGS CUP 2026",
      "accentColor": "#ef4444"
    },
    "mode": "manual"
  },
  "data": {
    "matches": [
      {
        "id": "d1-m2",
        "day": 1,
        "matchInDay": 2,
        "label": "Day 1 - Match 2",
        "teams": [
          {
            "matchId": "d1-m2",
            "dayId": 1,
            "teamName": "RS",
            "rank": 1,
            "placementPoints": 10,
            "killPoints": 5,
            "manualPointsAdjustment": 0,
            "totalPoints": 15,
            "totalKills": 5,
            "totalDamage": 1000,
            "totalAssists": 0,
            "avgSurvivalSeconds": 825,
            "flags": [],
            "players": [
              {
                "playerName": "RSxPLAYER1",
                "teamName": "RS",
                "matchId": "d1-m2",
                "dayId": 1,
                "kills": 2,
                "damage": 400,
                "assists": 0,
                "survivalTimeSeconds": 825,
                "teamRank": 1,
                "individualRank": 1,
                "damagePerMinute": 0,
                "killsPerMatch": 2,
                "kpm": 2,
                "damageShare": 0,
                "impactScore": 0,
                "clutchRating": 0,
                "supportRating": 0,
                "performanceTrend": [],
                "carryClass": "BALANCED",
                "isOutlier": false,
                "zScoreDamage": 0,
                "zScoreKills": 0,
                "history": [],
                "matchesPlayed": 1,
                "finishes": 2,
                "playTimeMinutes": 13.75,
                "dpk": 200
              },
              {
                "playerName": "RSxPLAYER2",
                "teamName": "RS",
                "matchId": "d1-m2",
                "dayId": 1,
                "kills": 3,
                "damage": 600,
                "assists": 0,
                "survivalTimeSeconds": 825,
                "teamRank": 1,
                "individualRank": 2,
                "damagePerMinute": 0,
                "killsPerMatch": 3,
                "kpm": 3,
                "damageShare": 0,
                "impactScore": 0,
                "clutchRating": 0,
                "supportRating": 0,
                "performanceTrend": [],
                "carryClass": "BALANCED",
                "isOutlier": false,
                "zScoreDamage": 0,
                "zScoreKills": 0,
                "history": [],
                "matchesPlayed": 1,
                "finishes": 3,
                "playTimeMinutes": 13.75,
                "dpk": 200
              }
            ]
          },
          {
            "matchId": "d1-m2",
            "dayId": 1,
            "teamName": "TEAM B",
            "rank": 2,
            "placementPoints": 6,
            "killPoints": 2,
            "manualPointsAdjustment": 0,
            "totalPoints": 8,
            "totalKills": 2,
            "totalDamage": 800,
            "totalAssists": 1,
            "avgSurvivalSeconds": 700,
            "flags": [],
            "players": [
              {
                "playerName": "BxP1",
                "teamName": "TEAM B",
                "matchId": "d1-m2",
                "dayId": 1,
                "kills": 1,
                "damage": 300,
                "assists": 1,
                "survivalTimeSeconds": 700,
                "teamRank": 2,
                "individualRank": 3,
                "damagePerMinute": 0,
                "killsPerMatch": 1,
                "kpm": 1,
                "damageShare": 0,
                "impactScore": 0,
                "clutchRating": 0,
                "supportRating": 0,
                "performanceTrend": [],
                "carryClass": "BALANCED",
                "isOutlier": false,
                "zScoreDamage": 0,
                "zScoreKills": 0,
                "history": [],
                "matchesPlayed": 1,
                "finishes": 1,
                "playTimeMinutes": 11.67,
                "dpk": 300
              },
              {
                "playerName": "BxP2",
                "teamName": "TEAM B",
                "matchId": "d1-m2",
                "dayId": 1,
                "kills": 1,
                "damage": 500,
                "assists": 0,
                "survivalTimeSeconds": 700,
                "teamRank": 2,
                "individualRank": 4,
                "damagePerMinute": 0,
                "killsPerMatch": 1,
                "kpm": 1,
                "damageShare": 0,
                "impactScore": 0,
                "clutchRating": 0,
                "supportRating": 0,
                "performanceTrend": [],
                "carryClass": "BALANCED",
                "isOutlier": false,
                "zScoreDamage": 0,
                "zScoreKills": 0,
                "history": [],
                "matchesPlayed": 1,
                "finishes": 1,
                "playTimeMinutes": 11.67,
                "dpk": 500
              }
            ]
          }
        ],
        "status": "completed"
      }
    ]
  },
  "analysis": {
    "insights": []
  }
};
