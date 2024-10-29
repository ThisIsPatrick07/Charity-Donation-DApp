import React from 'react'
import BeneficiaryCard from './BeneficiaryCard'

function BeneficiaryList({ beneficiaries, account, togglePop }) {

	return (
		<div>
			{beneficiaries.map((beneficiary) => (
				<BeneficiaryCard 
					key={beneficiary.id} 
				
					beneficiary={beneficiary} 
					account={account} 
					togglePop={togglePop}
				/>
			))}
		</div>
	)
}

export default BeneficiaryList