const TweEth = artifacts.require('TweEth');
const TweEth = artifacts.require('TweEth');

contract('TweEth', async (accounts) => {
  it("should allow the creation of a propsal", async () => {
    let instance = await TweEth.deployed();

    let instance = await TweEth.deployed();
    let balance = await instance.getBalance.call(accounts[0]);
    assert.equal(balance.valueOf(), 10000);
  });
});
