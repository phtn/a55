P_BASE_URL=https://ftsb.vercel.app
D_BASE_URL=http://localhost:3001
# Use P_BASE_URL for production, D_BASE_URL for development
# how do i pass the base URL to curl?
curl -fSsX POST "$D_BASE_URL/api/bets/r1" \
  -H 'Authorization: Bearer token' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "roulette.spinResult",
    "schemaVersion": 1,
    "emittedAt": "2026-05-09T10:30:13.119Z",
    "controls": {
      "winVerb": "scooped",
      "lastWinProfit": 2000,
      "signalFound": false,
      "isTracking": true,
      "auto": true,
      "scatter": false,
      "allowOverlaps": false,
      "spreadSelectionMode": "within",
      "loaded": true,
      "betStatus": "idle"
    },
    "virtualBoard": {
      "startingQuadrant": "q3",
      "baseUnit": 50,
      "baseUnitInput": "50",
      "inputMode": "base",
      "selectedChip": 50,
      "betMultiplier": 1,
      "roundMultiplier": 1,
      "totalStaked": 200,
      "winAmount": 1800,
      "profit": 1600,
      "accWinnings": 8200,
      "accPct": 45.588235294117645,
      "winStreak": 6,
      "lockedBankValue": 13600,
      "spins": 236,
      "trackedSpins": 4,
      "hotNumbers": [
        9,
        1,
        32
      ],
      "tableState": "GAME_RESOLVED",
      "winningNumber": 9,
      "nextBet": {
        "round": 1,
        "quadrant": "q4",
        "quadrants": [
          "q4"
        ],
        "numbers": [
          8,
          9,
          12,
          11
        ],
        "quadrantNumbers": [
          8,
          9,
          12,
          11
        ],
        "unitStake": 50,
        "zeroStake": 0,
        "totalStake": 200,
        "coverageCount": 4,
        "coveragePercent": 10.81081081081081,
        "allowOverlaps": false,
        "spreadQuadrants": [],
        "spreadSelectionMode": "within",
        "scatter": false,
        "slots": [
          {
            "number": 8,
            "bet": 50,
            "placements": 1,
            "unitStake": 50,
            "isZeroHedge": false,
            "isQuadrantSlot": true
          },
          {
            "number": 9,
            "bet": 50,
            "placements": 1,
            "unitStake": 50,
            "isZeroHedge": false,
            "isQuadrantSlot": true
          },
          {
            "number": 11,
            "bet": 50,
            "placements": 1,
            "unitStake": 50,
            "isZeroHedge": false,
            "isQuadrantSlot": true
          },
          {
            "number": 12,
            "bet": 50,
            "placements": 1,
            "unitStake": 50,
            "isZeroHedge": false,
            "isQuadrantSlot": true
          }
        ]
      }
    },
    "spin": {
      "spinIndex": 4,
      "winningNumber": 9,
      "round": 0,
      "hit": true,
      "hitType": "quadrant",
      "sessionOutcome": "reset_after_win",
      "nextRound": 1,
      "nextQuadrant": "q4",
      "nextQuadrants": [
        "q4"
      ],
      "candidateQuadrants": [
        "q4"
      ],
      "selectedQuadrant": "q4"
    },
    "result": {
      "stake": 3400,
      "sessionStake": 200,
      "winAmount": 7200,
      "round": 1,
      "profit": 2000,
      "profitPct": 0.38461538461538464
    },
    "bet": {
      "round": 4,
      "quadrant": "q1",
      "quadrants": [
        "q3",
        "q4",
        "q11",
        "q1"
      ],
      "numbers": [
        7,
        8,
        11,
        10,
        9,
        12,
        6,
        15,
        31,
        32,
        35,
        34,
        1,
        2,
        5,
        4
      ],
      "quadrantNumbers": [
        7,
        8,
        11,
        10,
        9,
        12,
        31,
        32,
        35,
        34,
        1,
        2,
        5,
        4
      ],
      "unitStake": 200,
      "zeroStake": 200,
      "totalStake": 3400,
      "coverageCount": 17,
      "coveragePercent": 45.94594594594595,
      "allowOverlaps": false,
      "spreadQuadrants": [
        "q4"
      ],
      "spreadSelectionMode": "within",
      "scatter": false,
      "slots": [
        {
          "number": 0,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": true,
          "isQuadrantSlot": false
        },
        {
          "number": 1,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 2,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 4,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 5,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 6,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": false
        },
        {
          "number": 7,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 8,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 9,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 10,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 11,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 12,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 15,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": false
        },
        {
          "number": 31,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 32,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 34,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 35,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        }
      ]
    },
    "placed": {
      "numbers": [
        7,
        8,
        11,
        10,
        9,
        12,
        6,
        15
      ],
      "cumulativeNumbers": [
        7,
        8,
        11,
        10,
        9,
        12,
        6,
        15
      ],
      "slots": [
        {
          "number": 6,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": false
        },
        {
          "number": 7,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 8,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 9,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 10,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 11,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 12,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": true
        },
        {
          "number": 15,
          "bet": 200,
          "placements": 1,
          "unitStake": 200,
          "isZeroHedge": false,
          "isQuadrantSlot": false
        }
      ]
    }
  }' | jq .
