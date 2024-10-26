// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.27;

/*
    donators:
    - bob

    beneficiaries:
    - alice
*/

contract Charity{
    struct Donator{
        string name;
        address donatorAddress;
        uint[] donatedTo;
    }

    struct Beneficiary{
        string name;
        address payable beneficiaryAddress;
        uint targetAmount; // the amount of money the beneficiary wishes to collect
        uint collectedAmount;
        uint currentAmount;
    }

    struct Pair{
        bool exists;
        uint donatorId;
    }

    // TODO - add this to the donator's list rather than the beneficiary ID
    struct Donation{
        uint amount;
        uint beneficiaryId;
    }

    // owner of the charity
    address payable public owner;
	string public name; // name of the charity

    uint public numberOfBeneficiaries;
    uint public numberOfDonators;
    uint public totalCollection;

    
    mapping(uint => Beneficiary) public beneficiaries; // all the beneficiaries
    mapping(uint => Donator) public donators; // all the donators
    
    // total money collected by the contract for each beneficiary
    mapping(uint => uint) public amtForEachBeneficiary;

    mapping(address => Pair) public isDonator; // to check if a user is a donator
    mapping(uint => bool) public isBeneficiary; // to check if user is a beneficiary

    constructor(string memory _name){
		name = _name;
        owner = payable(msg.sender);
    }

    /* Donation function
        The heart of this smart contract. It allows donators to pay the smart contract a certain amount of money.
        The contract holds this amount until the amount of money crosses the target amount of the beneficiary.

        Once the target amount is reached, or better - exceeded, the entire amount is 
        transferred to the beneficiary.

        Of course, that doesn't mean that the beneficiary is removed immediately after the target amount is
        collected. There can indeed be more donators who want to donate and that amount can still be transferred.
    */
    function donate(uint _beneficiaryId) public payable{

        bool registered = isDonator[msg.sender].exists; // must be registered as a donator
        bool idInRange = (_beneficiaryId < numberOfBeneficiaries);
        bool selfDonate = (beneficiaries[_beneficiaryId].beneficiaryAddress == msg.sender); // self donation not allowed
        bool isMinAmount = (msg.value >= 0.0001 ether); // min. donation amount must be satisfied

        require(registered, "You must register as a donator to donate!");
        require(idInRange, "Beneficiary ID out of bounds!");
        require(!selfDonate, "Cannot donate to self!");
        require(isMinAmount, "Donation amount must be at least 0.0001 ether!");

        // get the beneficiary who is to receive the donation (from storage, not memory, since we need to make changes)
        Beneficiary storage beneficiary = beneficiaries[_beneficiaryId];

        // update the collected amount by charity and the beneficiary
        beneficiary.collectedAmount += msg.value;
        beneficiary.currentAmount += msg.value;
        amtForEachBeneficiary[_beneficiaryId] += msg.value;

        // in case target money has been reached or exceeded, initiate withdrawal of money for the beneficiary
        if(beneficiary.currentAmount >= beneficiary.targetAmount){
            withdraw(_beneficiaryId, beneficiary.targetAmount);
            beneficiary.currentAmount -= beneficiary.targetAmount;
        }

        totalCollection += msg.value;

        // now add this donation to the donator's list
        uint _donatorId = isDonator[msg.sender].donatorId;
        donators[_donatorId].donatedTo.push(_beneficiaryId);
    }

    function registerBeneficiary(string memory _name, uint _targetAmount)
        public {
        // get beneficiary address
        address payable _beneficiaryAddress = payable(address(msg.sender));

        // create new beneficiary 
        Beneficiary memory newBeneficiary = Beneficiary({
            name: _name,
            beneficiaryAddress: _beneficiaryAddress,
            targetAmount: (_targetAmount * 1 ether),
            collectedAmount: 0,
            currentAmount: 0
        });

        uint _beneficiaryId = numberOfBeneficiaries++;
        // add new beneficiary
        beneficiaries[_beneficiaryId] = newBeneficiary;
        isBeneficiary[_beneficiaryId] = true;
        return;
    }

    function registerDonator(string memory _name)
        public {

        address _donatorAddress = msg.sender;
        uint _donatorId = numberOfDonators++;

        // Create the new Donator directly in storage
        donators[_donatorId] = Donator({
            name: _name,
            donatorAddress: _donatorAddress,
            donatedTo: new uint[](0)
        });
        

        isDonator[_donatorAddress] = Pair({
            exists: true,
            donatorId: _donatorId
        });
        return;
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    /*
        Start a withdrawal transaction for the beneficiary, i.e. transfer the money from the contract
        to the beneficiary.
    */
    function withdraw(uint _beneficiaryId, uint amount) internal {
        // get the address of the beneficiary
        address payable _beneficiaryAddress = beneficiaries[_beneficiaryId].beneficiaryAddress;

        // transfer the amount
        _beneficiaryAddress.transfer(amount);

        return;
    }
}