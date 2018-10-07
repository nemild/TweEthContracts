const ERC20MintableAndApprove = artifacts.require('ERC20MintableAndApprove');
const TweEthVoter = artifacts.require('TweEthVoter');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(ERC20MintableAndApprove).then(function() {
    return ERC20MintableAndApprove.deployed();
  }).then(function(token) {
    deployer.deploy(TweEthVoter, token.address, 1, {from: accounts[0]});
  });
}