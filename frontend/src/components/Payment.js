import React, { useState } from 'react'

import { toEther, toWei } from '../utils/utils.js';

import EtherDisplay from './EtherDisplay';
import close from "../assets/close.svg";


function Payment({ currentBenef, provider, charity, loadBlockchainData, togglePop }) {

	async function donationHandler(amt) {
		const signer = await provider.getSigner();

		let transaction = await charity.connect(signer).donate(Number(currentBenef.id), { value : toWei(amt) });
		await transaction.wait();

		alert("Donation successful!");
	}
	

	const [donateAmt, setDonateAmt] = useState(0);
	const targetAmount = toEther(currentBenef.targetAmount);

	console.log(donateAmt, targetAmount, Number(currentBenef.id));

	return (
		<div className="payment" >
			<div className='payment__details' >
				<div className="payment__overview">
					<h1>{currentBenef.name}</h1>
					Target Amount: <EtherDisplay amt={targetAmount} />
				</div>

				<input
					type="number"
					value={donateAmt}
					onChange={(e) => setDonateAmt(Number(e.target.value))}
				/>
				<button
					className="connect-btn"
					onClick={async () => {
						await donationHandler(donateAmt);
					}}
				>
					Donate
				</button>
			</div>

			<button
				className="payment__close"
				onClick={togglePop}
			>
				<img src={close} alt="Close Button" />
			</button>
		</div>
	)
}

export default Payment;