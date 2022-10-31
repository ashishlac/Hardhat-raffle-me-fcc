const { ethers, network } = require("hardhat")

async function mockKeepers() {
    const raffle = await ethers.getContract("Raffle")
    const entranceFee = await raffle.getEntranceFee()
    console.log("entranceFee", entranceFee.toString())
    const getNumOfPlayers = await raffle.getNumberOfPlayers()
    console.log("getNumOfPlayers", getNumOfPlayers)

}

mockKeepers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })