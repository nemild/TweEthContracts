const TweEthVoter = artifacts.require('TweEthVoter');
const ERC20Mintable = artifacts.require('ERC20Mintable');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(ERC20Mintable, {from: accounts[0]});
  await deployer.deploy(TweEthVoter, ERC20Mintable.address, 5, 0, {from: accounts[0]});
}