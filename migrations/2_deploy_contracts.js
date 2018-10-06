const ERC20Mintable = artifacts.require('ERC20Mintable');
const TweEthVoter = artifacts.require('TweEthVoter');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(ERC20Mintable).then(function() {
    return ERC20Mintable.deployed();
  }).then(function(token) {
    deployer.deploy(TweEthVoter, token.address, 5, 0, {from: accounts[0]});
  });
}