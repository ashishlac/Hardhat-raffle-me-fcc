const { assert, expect } = require("chai");
const { ethers, deployments, network } = require("hardhat");
const { networkConfig } = require("../../helper-hardhat-config");

describe("Raffle", () => {
    let deployer;
    let raffle;
    let vrfCoordinatorV2Mock;
    let chainId;
    let entranceFee;
    let interval;

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        chainId = network.config.chainId;
        entranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();

    });

    describe("constructor", async () => {
        it("constructor", async () => {
            const raffleState = await raffle.getRaffleState();
            const interval = await raffle.getInterval();
            assert.equal(raffleState.toString(), "0");
            assert.equal(interval, networkConfig[chainId]["keepersUpdateInterval"]);
        });
    })
    describe("enterRaffle", async () => {
        it("reverts when you dont pay enough", async () => {
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__SendMoreToEnterRaffle");
        });
        it("records player when they enter", async () => {
            await raffle.enterRaffle({ value: entranceFee });
            const playerFromContract = await raffle.getPlayer(0);
            assert.equal(playerFromContract, deployer);
        });
        it("emits an event", async () => {
            await expect(raffle.enterRaffle({ value: entranceFee })).to.emit(raffle, "RaffleEnter");
        });
        it("reverts when raffle is calculating", async () => {
            await raffle.enterRaffle({ value: entranceFee });
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            await raffle.performUpkeep([]);
            // await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith("Raffle__RaffleNotOpen");
        });

    });

    describe("checkUpkeep", () => {
        if ("revert if eth not send", async () => {
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            const { upKeepNeeded } = await raffle.checkUpkeep([]);

            assert(!upKeepNeeded);
            // await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith("Raffle__RaffleNotOpen");
        });
        it("revert false if raffle not open", async () => {
            await raffle.enterRaffle({ value: entranceFee });
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            await raffle.performUpkeep([]);
            const raffleState = await raffle.getRaffleState();
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
            assert.equal(raffleState.toString(), "1");
            assert.equal(upkeepNeeded, false);
        });
        it("returns false if enough time hasn't passed", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() - 5])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
            assert(!upkeepNeeded)
        })
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
            assert(upkeepNeeded)
        })


    });


    describe("performupKeep", function () {
        it("it will run only if checkup keep is true", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const tx = await raffle.performUpkeep([])
            assert(tx);
        })
        it("reverts when checkup is false", async () => {
            await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded")
        });
        it("updates the raffle state, calls vrf and emits an event", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const txResponse = await raffle.performUpkeep([])
            const txReciept = await txResponse.wait(1);
            const requestId = txReciept.events[1].args.requestId;
            const raffleState = await raffle.getRaffleState();
            assert(raffleState.toString() == 1);
            assert(requestId.toNumber() > 0);
            //check state
            //check request id
        })
    });
    describe("fulfillRandomWords", function () {
        let startingTimestamp;
        let winnerStartingBalance;

        beforeEach(async () => {
            const raffleBalance = (await raffle.getContractBalance()).toString();
            console.log("0. raffleBalance", raffleBalance);
            console.log("entranceFee", entranceFee.toString());

            await raffle.enterRaffle({ value: entranceFee });
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.request({ method: "evm_mine", params: [] });
            startingTimestamp = await raffle.getLastTimeStamp();
        });
        it("can be called after performUpKeep", async () => {
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request");
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request");
        });
        it("picks a winner, resets, and sends money", async () => {
            const additionalEntrances = 3;
            const startingIndex = 1;
            const accounts = await ethers.getSigners();

            const winnerIndex = 1; //hardcoding for now
            for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
                const accountConnectedRaffle = raffle.connect(accounts[i]);
                await accountConnectedRaffle.enterRaffle({ value: entranceFee });
            }
            await new Promise(async (resolve, reject) => {
                raffle.once("WinnerPicked", async () => {
                    console.log("winner picked event fired");
                    try {
                        const raffleState = await raffle.getRaffleState();
                        const endingTimestamp = await raffle.getLastTimeStamp();
                        assert.equal(raffleState, 0);
                        await expect(raffle.getPlayer(0));
                        assert(endingTimestamp > startingTimestamp);
                        const winner = await raffle.getRecentWinner();
                        assert.equal(winner, accounts[winnerIndex].address);
                        const winnerEndingBalance = (await accounts[winnerIndex].getBalance()).toString();
                        console.log("2. winnerEndingBalance", winnerEndingBalance);
                        const raffleBalance1 = (await raffle.getContractBalance()).toString();
                        console.log("2. raffleBalance", raffleBalance1);
                        expectedBalance = (winnerStartingBalance.add(entranceFee.mul(additionalEntrances)).add(entranceFee)).toString();
                        console.log("winnerEndingBalance", winnerEndingBalance);
                        console.log("expectedBalance", expectedBalance);
                        assert.equal(winnerEndingBalance, expectedBalance);
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                const tx = await raffle.performUpkeep("0x")
                const txReceipt = await tx.wait(1)
                winnerStartingBalance = (await accounts[winnerIndex].getBalance());
                console.log("0. winnerStartingBalance", winnerStartingBalance.toString());
                console.log("raffle.address", raffle.address);
                const raffleBalance = (await raffle.getContractBalance()).toString();
                console.log("1. raffleBalance", raffleBalance);
                hasBalance =

                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.toString(),
                        raffle.address
                    )

            });
        });
    });
});