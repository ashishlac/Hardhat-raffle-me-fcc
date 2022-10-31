const { ethers, network } = require("hardhat");

const FRONT_END_ADDRESS_FILE = ".././nextjs-smartcontract-lottery-fcc/constants/contractAddress.json";
const FRONT_END_ABI_FILE = ".././nextjs-smartcontract-lottery-fcc/constants/abi.json";
const fs = require("fs");


module.exports = async function () {

    if (process.env.UPDATE_FRONT_END) {
        console.log("updatedint front end................");
        await updateContractAddress();
        await updateContractabi();
        console.log("Front end written!")

    }
}

async function updateContractAddress() {
    const raffle = await ethers.getContract("Raffle");
    console.log("raffle.address", raffle.address);
    const chainId = (network.config.chainId).toString();
    console.log("chain id is", chainId);
    const contractAddress = JSON.parse(fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8"))

    if (chainId in contractAddress) {
        console.log("chainID present ");
        if (raffle.address && !contractAddress[chainId].includes(raffle.address)) {
            console.log("1");
            contractAddress[chainId].push(raffle.address);
        }
    }
    else {
        console.log("chain id not present");
        contractAddress[chainId] = [raffle.address];
    }
    console.log(contractAddress);
    fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(contractAddress));
    console.log("contract address updated");
}
async function updateContractabi() {
    const raffle = await ethers.getContract("Raffle");
    fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json));
    console.log("contract abi updated");
}