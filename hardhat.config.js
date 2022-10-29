require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL

const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKET_API_KEY = process.env.COINMARKET_API_KEY || ""

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.6"
      },
      {
        version: "0.8.17"
      }
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 6000000,

    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 5,
      blockConfirmations: 1,
      gas: 6000000,

    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    }
  },
  namedAccounts: {
    deployer: {
      default: 3,
      1: 0,
      5: 0,
    },
    player: {
      default: 1,
      1: 1,
      5: 0,
    }
  },
  gasReporter: {
    enabled: true,
    noColors: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    coinmarketcap: COINMARKET_API_KEY,
    token: "ETH"
  },
  mocha:
  {
    timeout: 100000,
  }
}
