// GENERATED from the FY25 KPI workbooks — do not hand-edit values.
//
// FY25 participation values were absent from the workbook extract (wrong column
// mapping) and have been taken from the printed FY25 report. Re-point the
// extraction at the correct column before FY26 and these become automatic.
//
// Two FY25 printed figures do NOT match the sum of their components: the
// Prizemoney "Total ($M)" metro cell (print $177.4, correct $177.3) and total
// cell (print $288.6, correct $288.5). The print added the rounded components
// rather than rounding the true total. This file holds the true values.
// Re-run the extraction against the FY26 workbooks to regenerate.
// Variances are NOT stored: they are calculated at render time from the
// current and prior values below.
export const kpi = {
  "meta": {
    "current": "FY25",
    "prior": "FY24",
    "periodLabel": "FY25 (July 2024 to June 2025)",
    "generated": "2026-08-27",
    "sources": [
      "FY25 Racing_Prizemoney_Wagering KPIs (full year).xlsx — sheet Racing_$PM_Wagering_FY25",
      "FY25_Participation etc KPIs.xlsx — sheet ParticipantsAttendances_FY25"
    ]
  },
  "groups": [
    {
      "key": "picnic",
      "label": "Picnic Meetings"
    },
    {
      "key": "country",
      "label": "Country Meetings"
    },
    {
      "key": "metro",
      "label": "Metro Meetings"
    },
    {
      "key": "total",
      "label": "Total Meetings",
      "showPrior": true
    }
  ],
  "tables": [
    {
      "title": "Racing Statistics",
      "rows": [
        {
          "label": "Number of Meetings Conducted",
          "fmt": "int",
          "emph": false,
          "source": "row 16",
          "values": {
            "picnic": [
              32,
              30
            ],
            "country": [
              396,
              394
            ],
            "metro": [
              112,
              114
            ],
            "total": [
              540,
              538
            ]
          }
        },
        {
          "label": "Number of Races Conducted",
          "fmt": "int",
          "emph": false,
          "source": "row 17",
          "values": {
            "picnic": [
              193,
              186
            ],
            "country": [
              3166,
              3133
            ],
            "metro": [
              974,
              1005
            ],
            "total": [
              4333,
              4324
            ]
          }
        },
        {
          "label": "Number of Horse Starts",
          "fmt": "int",
          "emph": false,
          "source": "row 18",
          "values": {
            "picnic": [
              1384,
              1183
            ],
            "country": [
              31214,
              30728
            ],
            "metro": [
              9590,
              9910
            ],
            "total": [
              42188,
              41821
            ]
          }
        },
        {
          "label": "Number of Individual Horses",
          "fmt": "int",
          "emph": false,
          "source": "row 19",
          "values": {
            "picnic": [
              368,
              334
            ],
            "country": [
              7914,
              7787
            ],
            "metro": [
              3528,
              3658
            ],
            "total": [
              9093,
              9081
            ]
          }
        },
        {
          "label": "Number of Races < 8 Starters",
          "fmt": "int",
          "emph": false,
          "source": "row 20",
          "values": {
            "picnic": [
              109,
              135
            ],
            "country": [
              465,
              457
            ],
            "metro": [
              179,
              201
            ],
            "total": [
              753,
              793
            ]
          }
        },
        {
          "label": "Average Starters per Race",
          "fmt": "dec1",
          "emph": false,
          "source": "row 21",
          "values": {
            "picnic": [
              7.170984455958549,
              6.360215053763441
            ],
            "country": [
              9.85912823752369,
              9.807851899138207
            ],
            "metro": [
              9.845995893223819,
              9.860696517412935
            ],
            "total": [
              9.73644126471267,
              9.671831637372803
            ]
          }
        }
      ]
    },
    {
      "title": "Prizemoney Statistics",
      "rows": [
        {
          "label": "Prizemoney Paid ($M)*",
          "fmt": "money1",
          "emph": false,
          "source": "row 25",
          "values": {
            "picnic": [
              0.998285,
              0.88915
            ],
            "country": [
              105.13719,
              104.60461
            ],
            "metro": [
              174.63305,
              177.47855
            ],
            "total": [
              280.768525,
              282.97231
            ]
          }
        },
        {
          "label": "VOBIS Bonuses Claimed - Silver, Gold, Sires Nominator ($M)**",
          "fmt": "money1",
          "emph": false,
          "source": "row 26",
          "values": {
            "picnic": [
              null,
              null
            ],
            "country": [
              5.0698,
              4.596
            ],
            "metro": [
              2.66575,
              2.4845
            ],
            "total": [
              7.73555,
              7.080500000000001
            ]
          }
        },
        {
          "label": "Total ($M)",
          "fmt": "money1",
          "emph": false,
          "source": "row 27",
          "values": {
            "picnic": [
              0.998285,
              0.88915
            ],
            "country": [
              110.20699,
              109.20061
            ],
            "metro": [
              177.2988,
              179.96305
            ],
            "total": [
              288.504075,
              290.05281
            ]
          }
        }
      ]
    },
    {
      "title": "Wagering Statistics",
      "rows": [
        {
          "label": "Parimutuel Turnover ($M)",
          "fmt": "money1",
          "emph": false,
          "source": "row 31",
          "values": {
            "picnic": [
              0,
              0
            ],
            "country": [
              552.588893,
              580.428934
            ],
            "metro": [
              687.953776,
              732.740457
            ],
            "total": [
              1240.542669,
              1313.169391
            ]
          }
        },
        {
          "label": "Non Parimutuel Turnover ($M)",
          "fmt": "money1",
          "emph": false,
          "source": "row 32",
          "values": {
            "picnic": [
              2.085146,
              2.062614
            ],
            "country": [
              2739.211407,
              2701.967573
            ],
            "metro": [
              3628.951599,
              3913.26217
            ],
            "total": [
              6370.248152,
              6617.292357
            ]
          }
        },
        {
          "label": "Total Turnover ($M)",
          "fmt": "money1",
          "emph": false,
          "source": "row 33",
          "values": {
            "picnic": [
              2.085146,
              2.062614
            ],
            "country": [
              3291.8003,
              3282.396507
            ],
            "metro": [
              4316.905375,
              4646.002627
            ],
            "total": [
              7610.7908210000005,
              7930.461748
            ]
          }
        },
        {
          "label": "Average Turnover per Meeting ($M)",
          "fmt": "money1",
          "emph": false,
          "source": "row 34",
          "values": {
            "picnic": [
              0.0651608125,
              0.0687538
            ],
            "country": [
              8.31262702020202,
              8.330955601522842
            ],
            "metro": [
              38.54379799107143,
              40.75440900877193
            ],
            "total": [
              14.094057075925926,
              14.740635219330855
            ]
          }
        }
      ]
    }
  ],
  "participation": {
    "title": "Participation Statistics",
    "rows": [
      {
        "label": "Country attendances (includes Non-TAB/Picnic)",
        "fmt": "int",
        "emph": false,
        "source": "row 15",
        "values": [
          486566,
          442271
        ]
      },
      {
        "label": "Metro attendances",
        "fmt": "int",
        "emph": false,
        "source": "row 16",
        "values": [
          673849,
          666302
        ]
      },
      {
        "label": "Total attendances",
        "fmt": "int",
        "emph": false,
        "source": "row 17",
        "values": [
          1160415,
          1108573
        ]
      },
      {
        "label": "Average individual starts per horse",
        "fmt": "dec2",
        "emph": false,
        "source": "row 14",
        "values": [
          4.6396128,
          4.605329809492346
        ]
      },
      {
        "label": "Training stables with a race starter",
        "fmt": "int",
        "emph": false,
        "source": "row 18",
        "values": [
          877,
          884
        ]
      },
      {
        "label": "Training stables with a race winner",
        "fmt": "int",
        "emph": false,
        "source": "row 19",
        "values": [
          473,
          486
        ]
      },
      {
        "label": "% of stables with a race starter that trained a winner",
        "fmt": "pct1",
        "emph": false,
        "source": "row 20",
        "values": [
          0.5393386545040,
          0.5497737556561086
        ]
      },
      {
        "label": "Jockeys with a race ride",
        "fmt": "int",
        "emph": false,
        "source": "row 21",
        "values": [
          286,
          280
        ]
      },
      {
        "label": "Jockeys with a race winner",
        "fmt": "int",
        "emph": false,
        "source": "row 22",
        "values": [
          202,
          190
        ]
      },
      {
        "label": "% of jockeys with a race ride that rode a winner",
        "fmt": "pct1",
        "emph": false,
        "source": "row 23",
        "values": [
          0.7062937062937063,
          0.6785714285714286
        ]
      }
    ]
  },
  "footnotes": [
    "*  Includes $4.5 million in prizemoney paid throughout the VOBIS Premier Race Series.",
    "** In addition to Bonuses Claimed, $2.1 million in VOBIS Platinum vouchers were won in FY25 with $1.7 million redeemed."
  ]
};
export default kpi;
