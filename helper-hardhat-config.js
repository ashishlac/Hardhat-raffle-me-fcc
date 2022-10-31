const { ethers } = require("hardhat");


const networkConfig = {
    31337: {
        name: "localhost",
        raffleEntranceFee: ethers.utils.parseEther("0.01"),
        callbackGasLimit: "5000000",
        keepersUpdateInterval: "30",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "5764",
    },
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        raffleEntranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "5764",
        callbackGasLimit: "5000000",
        keepersUpdateInterval: "30",
    }
}
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains
}
