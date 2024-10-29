import React from 'react';
import EtherDisplay from './EtherDisplay';
import { toEther } from '../utils/utils';


function BeneficiaryCard({ beneficiary, account, togglePop }) {

	const targetAmount = toEther(beneficiary.targetAmount);
	const currentAmount = toEther(beneficiary.currentAmount);
	const collectedAmount = toEther(beneficiary.collectedAmount);

	const donationRound = Math.floor(collectedAmount / targetAmount);

	const isThisBeneficiary = (account === beneficiary.beneficiaryAddress);
	const accountConnected = (account === null);

	return (
		<div>
			<p>Name: {beneficiary.name}</p>
			<p>Target Amount: <EtherDisplay amt={targetAmount} /></p>

			<label htmlFor="beneficiary-collection">Collection Progress </label>
			<progress id="beneficiary-collection" value={`${currentAmount}`} max={`${targetAmount}`} />

			<p>Donation Round: {donationRound}</p>
			<p>Collected Amount: <EtherDisplay amt={collectedAmount} /></p>
			<p>Current Amount: <EtherDisplay amt={currentAmount} /></p>

			{/* Disabling the button in case self donation is about to be attempted */}
			<button
				disabled={isThisBeneficiary || (accountConnected)}
				onClick={() => { togglePop(beneficiary) }}
			>
				Donate
			</button>
			<hr />
		</div>
	)
}

export default BeneficiaryCard;