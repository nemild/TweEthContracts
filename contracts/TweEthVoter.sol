pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

/// @title TweEthVoter
/// @author nemild mtlapinski

contract TweEthVoter { // CapWords
  using SafeMath for uint256;

  ERC20Mintable private tokenAddress; 
  uint256 private votingLength = 10 minutes;
  uint256 private quorumTokensPercentage;
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
    bool quorumPassed;
  }

  mapping(bytes32 => Proposal) private uuidToProposals;

  /// @param _tokenAddress Address of ERC20 token contract
  /// @param _quorumTokensPercentage Percentage of tokens needed to reach quorum
  /// @param _proposerAmount Number of tokens required to submit a proposed tweet
  constructor(
    address _tokenAddress,
    uint256 _quorumTokensPercentage,
    uint256 _proposerAmount) public {
    tokenAddress = ERC20Mintable(_tokenAddress);
    quorumTokensPercentage = _quorumTokensPercentage;
    proposerAmount = _proposerAmount;
  }

  function propose(bytes32 id) external returns (bool success) {
    // Store
    if(uuidToProposals[id].startTime == 0) { // test if ID does not exist
      tokenAddress.transferFrom(msg.sender, this, proposerAmount);

      uuidToProposals[id] = Proposal({
        proposer: msg.sender, // Added for transparency, not internal usage
        startTime: now,
        open: true,
        noTotal: 0,
        yesTotal: 0,
        bonus: 0,
        yesWon: false,
        quorumPassed: false
      });
      return true;
    }

    return false;
  }

  function vote(bytes32 id, uint256 amount, bool voteYes) external returns (bool success) {
    if(uuidToProposals[id].startTime != 0 && uuidToProposals[id].open){
      tokenAddress.transferFrom(msg.sender, this, amount);

      if(voteYes){
        uuidToProposals[id].yesVotes[msg.sender] = uuidToProposals[id].yesVotes[msg.sender] + amount;
        uuidToProposals[id].yesTotal = uuidToProposals[id].yesTotal + amount; 
      } else {
        uuidToProposals[id].noVotes[msg.sender] = uuidToProposals[id].noVotes[msg.sender] + amount;
        uuidToProposals[id].noTotal = uuidToProposals[id].noTotal + amount; 
      }

      return true;
    }

    return false;
  }

  function close(bytes32 id) external returns (bool success) {
    if(
        uuidToProposals[id].startTime != 0 && 
        uuidToProposals[id].open && 
        uuidToProposals[id].startTime + votingLength > now
      ){
        // 1. Close
        uuidToProposals[id].open = false;

        // 2. Determine winner
        uint256 minTokensRequired = quorumTokensPercentage.mul(tokenAddress.totalSupply()).div(100);

        if((uuidToProposals[id].noTotal + uuidToProposals[id].yesTotal) > minTokensRequired) { // quorum passed
          uuidToProposals[id].quorumPassed = true;
          if(uuidToProposals[id].yesTotal > uuidToProposals[id].noTotal) { // yes votes won
            uuidToProposals[id].bonus = uuidToProposals[id].noTotal.mul(1000).div(uuidToProposals[id].yesTotal); // TODO fix 1000 
            uuidToProposals[id].yesWon = true;
          } else { //no votes won
            uuidToProposals[id].bonus = uuidToProposals[id].yesTotal.div(uuidToProposals[id].noTotal);
            uuidToProposals[id].yesWon = false;
          }
        }
        
        return true;
      }
    return false;
  }

  function claim(bytes32[] ids) external returns (bool sent) {
    uint256 tokenSum; //TODO memory??

    require(ids.length < 256);

    for (uint8 i = 0; i < ids.length; i++){
      if(uuidToProposals[ids[i]].startTime != 0) {

        if(!uuidToProposals[ids[i]].quorumPassed) {
          tokenSum = tokenSum + 
            uuidToProposals[ids[i]].yesVotes[msg.sender] + 
            uuidToProposals[ids[i]].noVotes[msg.sender];

            uuidToProposals[ids[i]].yesVotes[msg.sender] = 0;
            uuidToProposals[ids[i]].noVotes[msg.sender] = 0;
        } else if(uuidToProposals[ids[i]].yesWon) {
          tokenSum = tokenSum + 
                    uuidToProposals[ids[i]].yesVotes[msg.sender] + 
                    uuidToProposals[ids[i]].bonus.mul(uuidToProposals[ids[i]].yesVotes[msg.sender]).div(1000);

          uuidToProposals[ids[i]].yesVotes[msg.sender] = 0;
        } else {
          tokenSum = tokenSum + 
                    uuidToProposals[ids[i]].noVotes[msg.sender] + 
                    uuidToProposals[ids[i]].bonus.mul(uuidToProposals[ids[i]].noVotes[msg.sender]).div(1000);
          uuidToProposals[ids[i]].noVotes[msg.sender] = 0;
        }
      }
    }

    if (tokenSum > 0) {
      tokenAddress.transferFrom(this, msg.sender, tokenSum);
      return true;
    }

    return false;
  }
}