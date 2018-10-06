const ERC20Mintable = artifacts.require('ERC20Mintable');
const TweEthVoter = artifacts.require('TweEthVoter');

contract('TweEthVoter', async (accounts) => {
  let erc20Mintable;
  let tweEthVoter;

  before(async function() {
    erc20Mintable = await ERC20Mintable.new({from: accounts[0]});
    tweEthVoter = await TweEthVoter.new(
        erc20Mintable.address, 
        5,
        0, 
        {from: accounts[0]}
      );
  });

  it('should allow the creation of a proposal', async () => {
    await erc20Mintable.mint(accounts[0], 10, {from: accounts[0]});
    await erc20Mintable.mint(accounts[0], 10, {from: accounts[0]});

    const proposeResult = await tweEthVoter.propose.call(123);
    await tweEthVoter.propose(123);
    assert.equal(proposeResult, true, 'Proposal was not successful');

    // const result = await erc20Mintable.totalSupply.call();
    // console.log(result.toNumber());

    // let instance = await TweEthVoter.deployed(erc20Mintable.address, 5, 0);

    // assert.equal(balance.valueOf(), 10000);
  });

  it('attempt to vote with no tokens', async () => {
    // const tweEthVoter = await TweEthVoter.deployed();
    try {
      const proposeResult = await tweEthVoter.vote.call(123, 1, true, {from: accounts[1]});
      assert.equal(true, false, 'should not be able to vote')
    } catch(err) {
    }
  });

  it('should vote yes succesfully', async () => {
    await erc20Mintable.mint(accounts[1], 5);
    await erc20Mintable.approve(tweEthVoter.address, 5, {from: accounts[1]})

    try {
      const voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[1]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[1]});
      assert.equal(voteResult, true, 'should be able to vote');
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting');
    }
  });

  it('should vote no succesfully', async () => {
    await erc20Mintable.mint(accounts[2], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[2]});

    try {
      const voteResult = await tweEthVoter.vote.call(123, 10, true, {from: accounts[2]});
      await tweEthVoter.vote(123, 10, false, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote')
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting')
    }
  });

  it.skip('should not be able to vote after time elapsed', async () => {
    await erc20Mintable.mint(accounts[2], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[2]});

    try {
      const voteResult = await tweEthVoter.vote.call(123, 10, true, {from: accounts[2]});
      await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [700000], id: 0})
      
      await tweEthVoter.vote(123, 1, false, {from: accounts[2]});
      assert.equal(voteResult, false, 'should not be able to vote')
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting')
    }
  });

  


});
