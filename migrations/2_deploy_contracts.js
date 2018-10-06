const ERC20Mintable = artifacts.require('ERC20Mintable');
const TweEthVoter = artifacts.require('TweEthVoter');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(ERC20Mintable);
  console.log(ERC20Mintable.address);
  await deployer.deploy(TweEthVoter, ERC20Mintable.address, 5, 0, {from: accounts[0]});
}