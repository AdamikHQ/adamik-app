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
  validatorAddress: string;
  amount: string;
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
    rewards: {
      native: Reward[];
      tokens: Reward[];
    };
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
        {
          amount: "2",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/5CAE744C89BC70AE7B38019A1EDF83199B7E10F00F160E7F4F12BCA7A32A7EE5",
            name: "stLUNA",
            ticker: "stLUNA",
            decimals: 6,
          },
        },
        {
          amount: "534",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/6B8A3F5C2AD51CD6171FA41A7E8C35AD594AB69226438DB94450436EA57B3A89",
            name: "STRD",
            ticker: "STRD",
            decimals: 6,
          },
        },
        {
          amount: "418",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/715BD634CF4D914C3EE93B0F8A9D2514B743F6FE36BC80263D1BC5EE4B3C5D40",
            name: "stSTARS",
            ticker: "stSTARS",
            decimals: 6,
          },
        },
        {
          amount: "34",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/88DCAA43A9CD099E1F9BBB80B9A90F64782EBA115A84B2CD8398757ADA4F4B40",
            name: "stJUNO",
            ticker: "stJUNO",
            decimals: 6,
          },
        },
        {
          amount: "6",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/A4D99E716D91A579AC3A9684AAB7B5CB0A0861DD3DD942901D970EDB6787860E",
            name: "stSOMM",
            ticker: "stSOMM",
            decimals: 6,
          },
        },
        {
          amount: "1313522799645",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
            name: "stINJ",
            ticker: "stINJ",
            decimals: 18,
          },
        },
        {
          amount: "39",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/B05539B66B72E2739B986B86391E5D08F12B8D5D2C2A7F8F8CF9ADF674DFA231",
            name: "stATOM",
            ticker: "stATOM",
            decimals: 6,
          },
        },
        {
          amount: "215978225667018",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
            name: "stEVMOS",
            ticker: "stEVMOS",
            decimals: 18,
          },
        },
        {
          amount: "368",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8",
            name: "stUMEE",
            ticker: "stUMEE",
            decimals: 6,
          },
        },
        {
          amount: "47",
          token: {
            chainId: "cosmoshub",
            type: "IBC",
            id: "ibc/E92E07E68705FAD13305EE9C73684B30A7B66A52F54C9890327E0A4C0F1D22E3",
            name: "stCMDX",
            ticker: "stCMDX",
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
        rewards: {
          native: [
            {
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "3410",
            },
            {
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "2598",
            },
            {
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "11865",
            },
            {
              validatorAddress:
                "cosmosvaloper1crqm3598z6qmyn2kkcl9dz7uqs4qdqnr6s8jdn",
              amount: "99",
            },
            {
              validatorAddress:
                "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
              amount: "169",
            },
          ],
          tokens: [
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7",
              amount: "246",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7",
              amount: "41575",
            },
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper1vf44d85es37hwl9f4h9gv0e064m0lla60j9luj",
              amount: "595539",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper1vf44d85es37hwl9f4h9gv0e064m0lla60j9luj",
              amount: "100390571",
            },
            {
              tokenId:
                "ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "1",
            },
            {
              tokenId:
                "ibc/054892D6BB43AF8B93AAC28AA5FD7019D2C59A15DAFD6F45C1FA2BF9BDA22454",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "2",
            },
            {
              tokenId:
                "ibc/6B8A3F5C2AD51CD6171FA41A7E8C35AD594AB69226438DB94450436EA57B3A89",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "7",
            },
            {
              tokenId:
                "ibc/715BD634CF4D914C3EE93B0F8A9D2514B743F6FE36BC80263D1BC5EE4B3C5D40",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "4",
            },
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "4470452337",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "1068188190886",
            },
            {
              tokenId:
                "ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8",
              validatorAddress:
                "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
              amount: "4",
            },
            {
              tokenId:
                "ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "4",
            },
            {
              tokenId:
                "ibc/054892D6BB43AF8B93AAC28AA5FD7019D2C59A15DAFD6F45C1FA2BF9BDA22454",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "1",
            },
            {
              tokenId:
                "ibc/6B8A3F5C2AD51CD6171FA41A7E8C35AD594AB69226438DB94450436EA57B3A89",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "5",
            },
            {
              tokenId:
                "ibc/715BD634CF4D914C3EE93B0F8A9D2514B743F6FE36BC80263D1BC5EE4B3C5D40",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "3",
            },
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "3244560381",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "966383192604",
            },
            {
              tokenId:
                "ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8",
              validatorAddress:
                "cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf",
              amount: "3",
            },
            {
              tokenId:
                "ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "5",
            },
            {
              tokenId:
                "ibc/054892D6BB43AF8B93AAC28AA5FD7019D2C59A15DAFD6F45C1FA2BF9BDA22454",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "3",
            },
            {
              tokenId:
                "ibc/6B8A3F5C2AD51CD6171FA41A7E8C35AD594AB69226438DB94450436EA57B3A89",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "12",
            },
            {
              tokenId:
                "ibc/715BD634CF4D914C3EE93B0F8A9D2514B743F6FE36BC80263D1BC5EE4B3C5D40",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "9",
            },
            {
              tokenId:
                "ibc/88DCAA43A9CD099E1F9BBB80B9A90F64782EBA115A84B2CD8398757ADA4F4B40",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "1",
            },
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "30303211279",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "5159302577134",
            },
            {
              tokenId:
                "ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "8",
            },
            {
              tokenId:
                "ibc/E92E07E68705FAD13305EE9C73684B30A7B66A52F54C9890327E0A4C0F1D22E3",
              validatorAddress:
                "cosmosvaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d",
              amount: "1",
            },
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper1crqm3598z6qmyn2kkcl9dz7uqs4qdqnr6s8jdn",
              amount: "132626248",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper1crqm3598z6qmyn2kkcl9dz7uqs4qdqnr6s8jdn",
              amount: "32260703827",
            },
            {
              tokenId:
                "ibc/B011C1A0AD5E717F674BA59FD8E05B2F946E4FD41C9CB3311C95F7ED4B815620",
              validatorAddress:
                "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
              amount: "225583993",
            },
            {
              tokenId:
                "ibc/B38AAA0F7A3EC4D7C8E12DFA33FF93205FE7A42738A4B0590E2FF15BC60A612B",
              validatorAddress:
                "cosmosvaloper1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn",
              amount: "54871811664",
            },
          ],
        },
      },
    },
  };
};
