/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/mock_price_feed.json`.
 */
export type MockPriceFeed = {
  "address": "6H22uizWr1Pjd7T3vSExzXegdMsbTuDnLnTF4SPmWuqU",
  "metadata": {
    "name": "mockPriceFeed",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initializeMock",
      "discriminator": [
        64,
        137,
        170,
        116,
        11,
        111,
        97,
        92
      ],
      "accounts": [
        {
          "name": "mockFeed",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  111,
                  99,
                  107,
                  95,
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "symbol"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "initialPrice",
          "type": "i64"
        },
        {
          "name": "initialExpo",
          "type": "i32"
        }
      ]
    },
    {
      "name": "setStatus",
      "discriminator": [
        181,
        184,
        224,
        203,
        193,
        29,
        177,
        224
      ],
      "accounts": [
        {
          "name": "mockFeed",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  111,
                  99,
                  107,
                  95,
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "mock_feed.symbol",
                "account": "mockPriceFeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newStatus",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updatePrice",
      "discriminator": [
        61,
        34,
        117,
        155,
        75,
        34,
        123,
        208
      ],
      "accounts": [
        {
          "name": "mockFeed",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  111,
                  99,
                  107,
                  95,
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "mock_feed.symbol",
                "account": "mockPriceFeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newPrice",
          "type": "i64"
        },
        {
          "name": "newExpo",
          "type": "i32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "mockPriceFeed",
      "discriminator": [
        73,
        0,
        218,
        41,
        7,
        202,
        200,
        152
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidStatusValue",
      "msg": "Invalid status value provided."
    }
  ],
  "types": [
    {
      "name": "mockPriceFeed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "i64"
          },
          {
            "name": "expo",
            "type": "i32"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "lastUpdatedTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
