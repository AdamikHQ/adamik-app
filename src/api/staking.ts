interface Token {
  chainId: string;
  type: string;
  id: string;
  name: string;
  ticker: string;
  decimals: number;
}

interface TokenAmount {
  amount: string;
  token: Token;
}

interface ValidatorPosition {
  validatorAddresses: string[];
  amount: string;
  status: string;
  completionDate?: number;
}

interface Reward {
  tokenId?: string;
  validatorAddresses: string[];
  amount: string;
  chainId?: string;
}

interface Balances {
  native: {
    available: string;
    total: string;
  };
  tokens: TokenAmount[];
  staking: {
    total: string;
    locked: string;
    unlocking: string;
    unlocked: string;
    positions: ValidatorPosition[];
    rewards: Reward[];
  };
}

export type DataAddressStateStaking = {
  chainId: string;
  address: string;
  balances: Balances;
};

export const getStaking = (): DataAddressStateStaking => {
  return {
    chainId: "cosmoshub",
    address: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
    balances: {
      native: {
        available: "1259620",
        total: "2816227",
      },
      tokens: [
        {
          amount: "267",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5",
            name: "NTRN",
            ticker: "NTRN",
            decimals: 6,
          },
        },
        {
          amount: "130",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/054892D6BB43AF8B93AAC28AA5FD7019D2C59A15DAFD6F45C1FA2BF9BDA22454",
            name: "stOSMO",
            ticker: "stOSMO",
            decimals: 6,
          },
        },
      ],
      staking: {
        total: "1556607",
        locked: "1529608",
        unlocking: "26999",
        unlocked: "0",
        positions: [
          {
            validatorAddresses: [
              "cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7",
            ],
            amount: "0",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper1vf44d85es37hwl9f4h9gv0e064m0lla60j9luj",
            ],
            amount: "0",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
            ],
            amount: "1109524",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
            ],
            amount: "75914",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
            ],
            amount: "33666",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper1crqm3598z6qmyn2kkcl9dz7uqs4qdqnr6s8jdn",
            ],
            amount: "117295",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
            ],
            amount: "193209",
            status: "locked",
          },
          {
            validatorAddresses: [
              "cosmosvaloper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcnj0",
            ],
            amount: "26999",
            status: "unlocking",
            completionDate: 1720536614913,
          },
        ],
        rewards: [
          {
            tokenId:
              "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
            validatorAddresses: [
              "cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7",
            ],
            amount: "246.123522994869418246",
          },
          {
            tokenId:
              "ibc/B05539B66B72E2739B986B86391E5D08F12B8D5D2C2A7F8F8CF9ADF674DFA231",
            validatorAddresses: [
              "cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7",
            ],
            amount: "0.000000007842107543",
          },
          {
            tokenId:
              "ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5",
            validatorAddresses: [
              "cosmosvaloper1vf44d85es37hwl9f4h9gv0e064m0lla60j9luj",
            ],
            amount: "0.000124538741140915",
          },
          {
            tokenId:
              "ibc/054892D6BB43AF8B93AAC28AA5FD7019D2C59A15DAFD6F45C1FA2BF9BDA22454",
            validatorAddresses: [
              "cosmosvaloper1vf44d85es37hwl9f4h9gv0e064m0lla60j9luj",
            ],
            amount: "0.000062417882303694",
          },
          {
            chainId: "cosmoshub",
            validatorAddresses: [
              "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
            ],
            amount: "85.682684083242962013",
          },
        ],
      },
    },
  };
};
