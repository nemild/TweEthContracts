const TweEth = artifacts.require('TweEth');

contract('TweEth', async (accounts) => {
  it("should allow the creation of a propsal", async () => {
    let instance = await TweEth.deployed();
     let balance = await instance.getBalance.call(accounts[0]);

  });
});
