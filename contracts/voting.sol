pragma solidity ^0.4.19;
/// @title TwitterVoter
/// @author nemild mtlapinski

contract TwitterVoter { // CapWords
    using SafeMath for uint256;


  address private tokenAddress; 
  uint256 private votingLength = 10 minutes;
  uint256 private quorumTokensPercentage;
  uint8 private winPercent = 50;
  uint256 private proposerAmount; // the amount the proposer has staked to submit the tweet 

  struct Proposal {
    address proposer;
    uint256 startTime;
    bool open;
    mapping(address => uint256) noVotes;
    mapping(address => uint256) yesVotes;

    uint256 noTotal;
    uint256 yesTotal;
    uint256 bonus;
    bool yesWon;
  };

  mapping(uint256 => Proposal) private uuidToProposals;
  mapping (address => uint256) private balances;


  /// @param _tokenAddress Address of ERC20 token contract
  /// @param _quorumTokensPercentage Percentage of tokens needed to reach quorum
  constructor(
    address _tokenAddress,
    uint256 _quorumTokensPercentage,
    uint256 _proposerAmount) public {
    tokenAddress = _tokenAddress;
    quorumTokensPercentage = _quorumTokensPercentage;
    proposerAmount = _proposerAmount;
  }

  function propose(uint256 id) external returns (bool success) {
    // Store
    if(!uuidToProposals[id]) {
      tokenAddress.transferFrom(msg.sender, this, proposerAmount);

      uuidToProposals[id] = Proposal({
        proposer: msg.sender,
        startTime: now,
        open: true
      });
      return true;
    }

    return false;
  }

  function vote(uint256 id, uint256 amount, bool vote) {
    if(uuidToProposals[id] && uuidToProposal[id].open){
      tokenAddress.transferFrom(msg.sender, this, amount);

      if(vote){
        uuidToProposals[id].yesVotes [msg.sender] = uuidToProposals[id].yesVotes [msg.sender] + amount;
        uuidToProposals[id].yesTotal = uuidToProposals[id].yesTotal + amount; 
      } else {
        uuuidToProposals[id].noVotes [msg.sender] = uuuidToProposals[id].noVotes [msg.sender] + amount;
        uuidToProposals[id].noTotal = uuidToProposals[id].noTotal + amount; 
      } 
    }
  }

  function close(uint256 id) {
    if(
        uuidToProposals[id] && 
        uuidToProposal[id].open && 
        uuidToProposal[id].startTime + 10 minutes > now
      ){
        // 1. Close
        uuidToProposal[id].open = false;

        // 2. Determine winner
        uint256 minTokensRequired = quorumTokensPercentage.mul(tokenAddress.totalSupply).div(100);
        if((uuidToProposals[id].noTotal + uuidToProposals[id].yesTotal) > minTokensRequired) { //quorum passed
          if(uuidToProposals[id].yesTotal > uuidToProposals[id].noTotal) { //yes votes won
            uuidToProposals[id].bonus = uuidToProposals[id].noTotal.mul(1000).div(uuidToProposals[id].yesTotal); //TODO fix 1000 
            uuidToProposals[id].yesWon = true;
          } else { //no votes won
            uuidToProposals[id].bonus = uuidToProposals[id].yesTotal.div(uuidToProposals[id].noTotal);
            uuidToProposals[id].yesWon = false;
          }
        }
      }
  }


  function claim(uint256[] ids) {
    uint256 tokenSum; //TODO memory?? 

    for (i = 0; i < ids.length; i++){
      if(uuidToProposals[ids[i].yesWon) {
        tokenSum = tokenSum + 
                   uuidToProposals[ids[i]].yesVotes[msg.sender] + 
                   uuidToProposals[ids[i]].bonus.mul(uuidToProposals[ids[i]].yesVotes[msg.sender]).div(1000);
      } else {
      tokenSum = tokenSum + 
                   uuidToProposals[ids[i]].noVotes[msg.sender] + 
                   uuidToProposals[ids[i]].bonus.mul(uuidToProposals[ids[i]].noVotes[msg.sender]).div(1000);
      }
    }
    tokenAddress.transferFrom(this, msg.sender, tokenSum);

}