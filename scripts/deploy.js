const hre = require("hardhat");

const items = require("../frontend/src/items.json");

const tokens = (n) => hre.ethers.parseUnits(n.toString(), "ether");

async function main(){
	const [deployer, benef1, benef2, donator1, donator2] = await hre.ethers.getSigners();

	const beneficiarySigners = [benef1, benef2];
	const donatorSigners = [donator1, donator2];

	const Charity = await hre.ethers.getContractFactory("Charity");
	const charity = await Charity.deploy(items.charityName);

	// this is the function that is now used to wait for the contract object to be deployed
	await charity.waitForDeployment();

	console.log(`Deployed Charity contract at address : ${await charity.getAddress()}`);

	await registerAllBeneficiaries(items.beneficiaries, beneficiarySigners, charity);
	await registerAllDonators(items.donators, donatorSigners, charity);
}

async function registerAllBeneficiaries(beneficiaries, beneficiarySigners, charityContract){
	// the for-of loop allows iteration over an array of objects
	
	let i = 0;
	let transaction;
	for(let { name, targetAmount } of beneficiaries){
		transaction = await charityContract.connect(beneficiarySigners[i]).registerBeneficiary(name, tokens(targetAmount));
		await transaction.wait();
		
		i++;
	}
}

async function registerAllDonators(donators, donatorSigners, charityContract){
	
	let i = 0;
	let transaction;
	for(let { name } of donators){		
		transaction = await charityContract.connect(donatorSigners[i]).registerDonator(name);
		await transaction.wait();
		
		i++;
	}
}

main().catch((error) => {
	console.log(error);
	process.exitCode = 1;
})