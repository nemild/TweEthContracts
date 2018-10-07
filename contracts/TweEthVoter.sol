pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ERC20MintableAndApprove.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/// @title TweEthVoter
/// @author nemild mtlapinski

contract TweEthVoter is Ownable { // CapWords
  using SafeMath for uint256;

  ERC20MintableAndApprove private tokenAddress;
  uint256 private votingLength = 10 minutes;
  uint256 private quorumTokensPercentage;

  uint256 private percentageToTweeter = 25;
  uint256 bonusMultipler = 10000000000;

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
    address tweeterPayoutAddress;
  }

  mapping(bytes32 => Proposal) public uuidToProposals;

  // Events
  event ProposalCreated(bytes32 id, address proposer);
  event ProposalFailed(bytes32 id, address proposer);
  event VoteLogged(bytes32 id, address voter, uint256 amount, bool yes);
  event CloseStart(bytes32 id, address payoutAddr);
  event ProposalClosed(bytes32 id, bool quorumPassed, bool yesWon, uint256 bonus);
  event Claim(address withdrawerAddress, uint256 tokenSum);

  /// @param _tokenAddress Address of ERC20 token contract
  /// @param _quorumTokensPercentage Percentage of tokens needed to reach quorum
  constructor(
    address _tokenAddress,
    uint256 _quorumTokensPercentage) public {
    tokenAddress = ERC20MintableAndApprove(_tokenAddress);
    quorumTokensPercentage = _quorumTokensPercentage;
  }

//TODO - propose puts tokens into a yes vote -

  function propose(bytes32 id, uint256 proposerAmount) external returns (bool success) {
    if(uuidToProposals[id].startTime == 0) { // test if ID does not exist
      uuidToProposals[id] = Proposal({
        proposer: msg.sender, // Added for transparency, not internal usage
        startTime: now,
        open: true,
        noTotal: 0,
        yesTotal: 0,
        bonus: 0,
        yesWon: false,
        quorumPassed: false,
        tweeterPayoutAddress: 0x0
      });
      emit ProposalCreated(id, msg.sender);

      if (proposerAmount > 0) {
        bool result = vote(id, proposerAmount, true);
        require(result);
      }

      return true;
    }
    emit ProposalFailed(id, msg.sender);
    return false;
  }

  function vote(bytes32 id, uint256 amount, bool voteYes) public returns (bool success) {
    require(amount > 0);

    if(
      uuidToProposals[id].startTime != 0 &&
      uuidToProposals[id].open &&
      now < uuidToProposals[id].startTime + votingLength
    ){
      tokenAddress.transferFrom(msg.sender, this, amount);

      if (voteYes) {
        uuidToProposals[id].yesVotes[msg.sender] = uuidToProposals[id].yesVotes[msg.sender] + amount;
        uuidToProposals[id].yesTotal = uuidToProposals[id].yesTotal + amount;
      } else {
        uuidToProposals[id].noVotes[msg.sender] = uuidToProposals[id].noVotes[msg.sender] + amount;
        uuidToProposals[id].noTotal = uuidToProposals[id].noTotal + amount;
      }
      emit VoteLogged(id, msg.sender, amount, voteYes);
      return true;
    }

    return false;
  }

  function getYesVoteCnt(bytes32 id) external view returns (uint256 count){
    return uuidToProposals[id].yesVotes[msg.sender];
  }

  function getNoVoteCnt(bytes32 id) external view returns (uint256 count) {
    return uuidToProposals[id].noVotes[msg.sender];
  }

  function getyesWon(bytes32 id) external view returns (bool yesWon){
    return  uuidToProposals[id].yesWon;
  }

  function close(bytes32 id, address tweeterPayoutAddress) external onlyOwner returns (bool success) {
    emit CloseStart(id, tweeterPayoutAddress);
    if(
        uuidToProposals[id].startTime != 0 &&
        uuidToProposals[id].open &&
        uuidToProposals[id].startTime + votingLength < now
      ){
        // 1. Close
        uuidToProposals[id].open = false;

        // 2. Determine winner
        uint256 minTokensRequired = quorumTokensPercentage.mul(tokenAddress.totalSupply()).div(uint256(100));

       if((uuidToProposals[id].noTotal + uuidToProposals[id].yesTotal) > minTokensRequired) { // quorum passed
          uuidToProposals[id].quorumPassed = true;
          uuidToProposals[id].tweeterPayoutAddress = tweeterPayoutAddress;

            uint256 percentageToTweeterFinal = percentageToTweeter;
            if(tweeterPayoutAddress == address(0)) {
              percentageToTweeterFinal = 0;
            }
            uint256 percentageToWinner = uint256(100).sub(percentageToTweeterFinal);

          if(uuidToProposals[id].yesTotal > uuidToProposals[id].noTotal) { // yes votes won
            tokenAddress.transfer(tweeterPayoutAddress, uuidToProposals[id].noTotal.mul(percentageToTweeterFinal).div(uint256(100)));
            uuidToProposals[id].bonus = uuidToProposals[id].noTotal.mul(percentageToWinner).div(uint256(100)).mul(bonusMultipler).div(uuidToProposals[id].yesTotal);
            uuidToProposals[id].yesWon = true;
          } else { //no votes won
            tokenAddress.transfer(tweeterPayoutAddress, uuidToProposals[id].yesTotal.mul(percentageToTweeterFinal).div(uint256(100)));
            uuidToProposals[id].bonus = uuidToProposals[id].yesTotal.mul(percentageToWinner).div(uint256(100)).mul(bonusMultipler).div(uuidToProposals[id].noTotal);
            uuidToProposals[id].yesWon = false;
          }
        }

        emit ProposalClosed(id, uuidToProposals[id].quorumPassed, uuidToProposals[id].yesWon, uuidToProposals[id].bonus);
        return true;
      }
    return false;
  }


  function isQuorumPassed(bytes32 id) external view returns (bool isQuorom) {
    return uuidToProposals[id].quorumPassed;
  }

  function isProposalOpen(bytes32 id) external view returns (bool isOpen) {
    return uuidToProposals[id].open;
  }

  function getBonusAmount(bytes32 id) external view returns (uint256 bonusAmount) {
    return uuidToProposals[id].bonus;
  }

  function getNoTotal(bytes32 id) external view returns (uint256 noTotal) {
    return uuidToProposals[id].noTotal;
  }

  function getYesTotal(bytes32 id) external view returns (uint256 yesTotal) {
    return uuidToProposals[id].yesTotal;
  }

  function tweetThisID(bytes32 id) external view returns (bool yesWon) {
    uint256 minTokensRequired = quorumTokensPercentage.mul(tokenAddress.totalSupply()).div(uint256(100));
    if((uuidToProposals[id].noTotal + uuidToProposals[id].yesTotal) > minTokensRequired &&
      uuidToProposals[id].yesTotal > uuidToProposals[id].noTotal) {
      return true; //yes votes won
    }
    return false;
  }

  function claimableAmount(bytes32 id, address addr) constant public returns (uint256 amount){
    uint256 tokenSum;

      if(uuidToProposals[id].startTime != 0) {

        if(!uuidToProposals[id].quorumPassed) {
          tokenSum = tokenSum +
            uuidToProposals[id].yesVotes[addr] +
            uuidToProposals[id].noVotes[addr];

            /* uuidToProposals[id].yesVotes[addr] = 0;
            uuidToProposals[id].noVotes[addr] = 0; */
        } else if(uuidToProposals[id].yesWon) {
          tokenSum = tokenSum + // TODO: Move calculation of how much I can claim into a getter, by ID
                    uuidToProposals[id].yesVotes[addr] +
                    uuidToProposals[id].bonus.mul(uuidToProposals[id].yesVotes[addr]).div(bonusMultipler);

          /* uuidToProposals[ids[i]].yesVotes[addr] = 0; */
        } else {
          tokenSum = tokenSum +
                    uuidToProposals[id].noVotes[addr] +
                    uuidToProposals[id].bonus.mul(uuidToProposals[id].noVotes[addr]).div(bonusMultipler);
          /* uuidToProposals[id].noVotes[addr] = 0; */
        }
        return tokenSum;
      }
      return 0;
  }


  function claim(bytes32[] ids) external returns (bool sent) {
    uint256 tokenSum; //TODO memory??

    require(ids.length < 256);

    for (uint8 i = 0; i < ids.length; i++){
      if(uuidToProposals[ids[i]].startTime != 0) {

        tokenSum = tokenSum + claimableAmount(ids[i], msg.sender);

        if(!uuidToProposals[ids[i]].quorumPassed) {
          /* tokenSum = tokenSum +
            uuidToProposals[ids[i]].yesVotes[msg.sender] +
            uuidToProposals[ids[i]].noVotes[msg.sender]; */

            uuidToProposals[ids[i]].yesVotes[msg.sender] = 0;
            uuidToProposals[ids[i]].noVotes[msg.sender] = 0;
        } else if(uuidToProposals[ids[i]].yesWon) {
          /* tokenSum = tokenSum + // TODO: Move calculation of how much I can claim into a getter, by ID
                    uuidToProposals[ids[i]].yesVotes[msg.sender] +
                    uuidToProposals[ids[i]].bonus.mul(uuidToProposals[ids[i]].yesVotes[msg.sender]).div(bonusMultipler); */

          uuidToProposals[ids[i]].yesVotes[msg.sender] = 0;
        } else {
          /* tokenSum = tokenSum +
                    uuidToProposals[ids[i]].noVotes[msg.sender] +
                    uuidToProposals[ids[i]].bonus.mul(uuidToProposals[ids[i]].noVotes[msg.sender]).div(bonusMultipler); */
          uuidToProposals[ids[i]].noVotes[msg.sender] = 0;
        }
      }
    }
    emit Claim(msg.sender, tokenSum);

    if (tokenSum > 0) {
      tokenAddress.transfer(msg.sender, tokenSum);
      emit Claim(msg.sender, tokenSum);

      return true;
    }

    return false;
  }
}
