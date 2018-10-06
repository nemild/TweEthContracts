const ERC20Mintable = artifacts.require('ERC20Mintable');
const TweEthVoter = artifacts.require('TweEthVoter');

contract('TweEthVoter', async (accounts) => {
  it('should allow the creation of a proposal', async () => {
    let erc20Mintable = await ERC20Mintable.new({from: accounts[0]});
    const tweEthVoter = await TweEthVoter.new(erc20Mintable.address, 5, 0, {from: accounts[0]});

    console.log(erc20Mintable.address);

    await erc20Mintable.mint.call(accounts[0], 10, {from: accounts[0]});
    const result = await erc20Mintable.totalSupply.call();
    console.log(result.toString());

    // let instance = await TweEthVoter.deployed(erc20Mintable.address, 5, 0);

    // assert.equal(balance.valueOf(), 10000);
  });
});
