const TweEthVoter = artifacts.require('TweEthVoter');

module.exports = function(deployer) {
  deployer.deploy(TweEthVoter);
}