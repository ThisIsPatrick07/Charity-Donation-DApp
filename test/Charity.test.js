const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.parseUnits(n.toString(), "ether");

describe("Charity", function (){
	let charity;
	let deployer, beneficiary, donator;
	let transaction;
	let contractAddress;
	
	const CHARITY_NAME = "Daan de do re baba";

	// beneficiary info
	const BENEFICIARY_NAME = "Raghu";
	const TARGET_AMOUNT = tokens(2);

	// donator info
	const DONATOR_NAME = "Shambhu";
	const UNDER_DONATION_AMT = tokens(1);
	const EQUAL_DONATION_AMT = tokens(2);
	const OVER_DONATION_AMT = tokens(3);

	beforeEach(async () => {
		const Charity = await ethers.getContractFactory("Charity");
		charity = await Charity.deploy(CHARITY_NAME);

		// get the signing accounts for handling transactions
		[deployer, beneficiary, donator] = await ethers.getSigners();

		// registering the beneficiary

		transaction = await charity.connect(beneficiary).registerBeneficiary(BENEFICIARY_NAME, TARGET_AMOUNT);
		await transaction.wait();

		// registering the donator
		transaction = await charity.connect(donator).registerDonator(DONATOR_NAME);
		await transaction.wait();

		contractAddress = await charity.getAddress();
	});

	describe("Deployment", () => {
		it("Sets the owner", async() => {
			expect(await charity.owner()).to.be.equal(deployer.address);
		});

		it("Sets the name", async () => {
			expect(await charity.name()).to.be.equal(CHARITY_NAME);
		});

		it("Registers the Beneficiary", async () => {
			expect(await charity.numberOfBeneficiaries()).to.be.equal(1);
			const {
				id,
				name, 
				beneficiaryAddress,
				targetAmount,
				collectedAmount,
				currentAmount,
			} = await charity.beneficiaries(0);
			
			expect(id).to.be.equal(0);
			expect(name).to.be.equal(BENEFICIARY_NAME);
			expect(beneficiaryAddress).to.be.equal(beneficiary.address);

			// apparently we need to convert it to 256 bit integer again to compare it with solidity's own uint256
			
			expect(targetAmount).to.equal(TARGET_AMOUNT);
			expect(collectedAmount).to.be.equal(tokens(0));
			expect(currentAmount).to.be.equal(tokens(0));

			expect(await charity.amtForEachBeneficiary(0)).to.be.equal(0);

			// check if the beneficiary is registered or not
			expect(await charity.isBeneficiary(0)).to.be.equal(true);
		});
		
		it("Registers the Donator", async () => {
			expect(await charity.numberOfDonators()).to.be.equal(1);
			const {
				id,
				name,
				donatorAddress,
			} = await charity.donators(0);
			
			expect(id).to.be.equal(0);
			expect(name).to.be.equal(DONATOR_NAME);
			expect(donatorAddress).to.be.equal(donator.address);
			
			// check if the donator is registered or not
			const result = await charity.isDonator(donator.address);
			expect(result.exists).to.be.equal(true);
			expect(result.donatorId).to.be.equal(0);
		});
	});

	// TODO- Check if the amt for each beneficiary is affected or not (the mapping i mean)
	/** 3 STEPS
	 * 1. Donator's balance drops
	 * 2. Contract receives money
	 * 3. Beneficiary's balance stays same but collected and current amount increase
	 */
	describe("Donation", () => {
		let beneficiaryBeforeAmt, beneficiaryAfterAmt;
		let donatorBeforeAmt, donatorAfterAmt;

		describe("Under-Donation", () => {
			beforeEach(async () => {
				beneficiaryBeforeAmt = await ethers.provider.getBalance(beneficiary.address);
				donatorBeforeAmt = await ethers.provider.getBalance(donator.address);
	
				transaction = await charity.connect(donator).donate(0, { value : UNDER_DONATION_AMT });
				await transaction.wait();
			});
			
			// STEP 1
			it("Enables donator to donate", async () => {
				donatorAfterAmt = await ethers.provider.getBalance(donator.address);
				expect(donatorAfterAmt).to.be.lessThan(donatorBeforeAmt); // some extra gas amt will probably be reduced as well
			});

			// STEP 2
			it("Transfers the amount to the contract", async () => {
				// check if the contract collection is equal to the donation amount just received
				expect(await charity.totalCollection()).to.be.equal(UNDER_DONATION_AMT);
				expect(await charity.getBalance()).to.be.equal(UNDER_DONATION_AMT);
			});
			
			// STEP 3
			it("Sends the money to the beneficiary", async () => {
				// check the collected and current amount of the beneficiary
				const { collectedAmount, currentAmount } = await charity.beneficiaries(0);
				
				// since this is an under donation, the beneficiary hasn't received the amount yet, so the balance will stay the same
				beneficiaryAfterAmt = await ethers.provider.getBalance(beneficiary.address);
				expect(beneficiaryAfterAmt).to.be.equal(beneficiaryBeforeAmt);

				expect(collectedAmount).to.be.equal(UNDER_DONATION_AMT);
				expect(currentAmount).to.be.equal(UNDER_DONATION_AMT);

				expect(await charity.amtForEachBeneficiary(0)).to.be.equal(UNDER_DONATION_AMT);
			});
		});

		describe("Equal-Donation", () => {
			beforeEach(async () => {
				beneficiaryBeforeAmt = await ethers.provider.getBalance(beneficiary.address);
				donatorBeforeAmt = await ethers.provider.getBalance(donator.address);

				transaction = await charity.connect(donator).donate(0, { value : EQUAL_DONATION_AMT });
				receipt = await transaction.wait();
			});

			it("Enables donator to donate", async () => {
				donatorAfterAmt = await ethers.provider.getBalance(donator.address);
				expect(donatorAfterAmt).to.be.lessThan(donatorBeforeAmt); // some extra gas amt will probably be reduced as well
			});

			// STEP 2
			it("Transfers the amount to the contract", async () => {
				// since target amt is achieved, the contract's funds will clear out, transferred over to the beneficiary.
				expect(await charity.totalCollection()).to.be.equal(EQUAL_DONATION_AMT);
				expect(await charity.getBalance()).to.be.equal(0);
			});
			
			// STEP 3
			it("Sends the money to the beneficiary", async () => {
				// check the collected and current amount of the beneficiary
				const { collectedAmount, currentAmount, targetAmount } = await charity.beneficiaries(0);
			
				// since this is an under donation, the beneficiary hasn't received the amount yet, so the balance will stay the same
				beneficiaryAfterAmt = await ethers.provider.getBalance(beneficiary.address);
				expect(beneficiaryAfterAmt).to.be.greaterThan(beneficiaryBeforeAmt);

				expect(collectedAmount).to.be.equal(EQUAL_DONATION_AMT);
				expect(currentAmount).to.be.equal(0); // now that the target is reached, the current money collected for new round is 0

				expect(await charity.amtForEachBeneficiary(0)).to.be.equal(EQUAL_DONATION_AMT);
			});
		});

		describe("Over-Donation", () => {
			beforeEach(async () => {
				beneficiaryBeforeAmt = await ethers.provider.getBalance(beneficiary.address);
				donatorBeforeAmt = await ethers.provider.getBalance(donator.address);

				transaction = await charity.connect(donator).donate(0, { value : OVER_DONATION_AMT });
				await transaction.wait();
			});

			// STEP 1
			it("Enables donator to donate", async () => {
				donatorAfterAmt = await ethers.provider.getBalance(donator.address);
				expect(donatorAfterAmt).to.be.lessThan(donatorBeforeAmt); // some extra gas amt will probably be reduced as well
			});

			// STEP 2
			it("Transfers the amount to the contract", async () => {
				// check if the contract collection is equal to the donation amount just received
				expect(await charity.totalCollection()).to.be.equal(OVER_DONATION_AMT);
				expect(await charity.getBalance()).to.be.equal(0);
			});
			
			// STEP 3
			it("Sends the money to the beneficiary", async () => {
				const { targetAmount, collectedAmount, currentAmount } = await charity.beneficiaries(0);
				
				beneficiaryAfterAmt = await ethers.provider.getBalance(beneficiary.address)
				expect(beneficiaryAfterAmt).to.be.greaterThan(beneficiaryBeforeAmt);

				expect(collectedAmount).to.be.equal(OVER_DONATION_AMT);
				// expect(currentAmount).to.be.equal(OVER_DONATION_AMT % targetAmount);
				expect(currentAmount).to.be.equal(0); // since the entire amt was flushed out of the contract, we have essentially reset
				
				// the current collection for the next round of donation

				expect(await charity.amtForEachBeneficiary(0)).to.be.equal(OVER_DONATION_AMT);
			});
		});
	
	});
});