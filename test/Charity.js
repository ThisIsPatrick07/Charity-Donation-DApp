const { expect } = require("chai");
const { toBigInt } = require("ethers");
const { ethers } = require("hardhat");

const tokens = (n) => BigInt(ethers.parseUnits(n.toString(), "ether"));

describe("Charity", function (){
	let charity;
	let deployer, beneficiary, donator;
	let transaction;
	
	const CHARITY_NAME = "Daan de do re baba";

	// beneficiary info
	const BENEFICIARY_NAME = "Raghu";
	const TARGET_AMOUNT = tokens(2);

	// donator info
	const DONATOR_NAME = "Shambhu";

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
			const beneficiaryDetails = await charity.beneficiaries(0);
			
			expect(beneficiaryDetails.name).to.be.equal(BENEFICIARY_NAME);
			expect(beneficiaryDetails.beneficiaryAddress).to.be.equal(beneficiary.address);

			// apparently we need to convert it to 256 bit integer again to compare it with solidity's own uint256
			expect(beneficiaryDetails.targetAmount).to.equal(tokens(TARGET_AMOUNT));
			
			expect(beneficiaryDetails.collectedAmount).to.be.equal(0);
			expect(beneficiaryDetails.currentAmount).to.be.equal(0);
		});

		it("Registers the Donator", async () => {
			expect(await charity.numberOfDonators()).to.be.equal(1);
			const donatorAddress = await charity.donators(0);

			expect(donatorAddress.name).to.be.equal(DONATOR_NAME);
			expect(donatorAddress.donatorAddress).to.be.equal(donator.address);
		});
	});
});