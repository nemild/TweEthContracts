const ERC20Mintable = artifacts.require('ERC20Mintable');
const TweEthVoter = artifacts.require('TweEthVoter');

async function increaseTime (addSeconds) {
  web3.currentProvider.sendAsync({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [addSeconds],
    id: new Date().getSeconds()
  }, (err) => {
    if (!err) {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
      });
    }
  });
}

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

    const proposeResult = await tweEthVoter.propose.call(123);
    await tweEthVoter.propose(123);
    assert.equal(proposeResult, true, 'Proposal was not successful');

    // const result = await erc20Mintable.totalSupply.call();
    // console.log(result.toNumber());

    // let instance = await TweEthVoter.deployed(erc20Mintable.address, 5, 0);

    // assert.equal(balance.valueOf(), 10000);
  });

  it('should NOT allow the creation of an existing proposal', async () => {
    await erc20Mintable.mint(accounts[0], 10, {from: accounts[0]});

    const proposeResult = await tweEthVoter.propose.call(123);
    await tweEthVoter.propose(123);
    assert.equal(proposeResult, false, 'Proposal was successful, and shouldnt be');

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
    await erc20Mintable.mint(accounts[2], 5);
    await erc20Mintable.approve(tweEthVoter.address, 5, {from: accounts[2]})

    try {
      const voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[2]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[2]});
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

  it('vote of 4 and 5 of yes adds up to 9', async () => {

    const supply = await erc20Mintable.totalSupply.call();
    console.log('pre mint v4, 5 - supply:' + supply);
    await erc20Mintable.mint(accounts[3], 99);
    const postSupply = await erc20Mintable.totalSupply.call();
    console.log('post mint v4, 5 - supply:' + postSupply.toNumber());

    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[3]});

    try {
      //vote 4 yes
      const voteResult4 = await tweEthVoter.vote.call(123, 4, true, {from: accounts[3]});
      await tweEthVoter.vote(123, 4, true, {from: accounts[3]});
      assert.equal(voteResult4, true, 'should be able to vote yes w4 tokens')
      console.log('voted 4 yes');

      //vote 5 yes
      const voteResult5 = await tweEthVoter.vote.call(123, 5, true, {from: accounts[3]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[3]});
      assert.equal(voteResult5, true, 'should be able to vote yes w/5 tokens')
      console.log('voted 5 yes');

      const voteSum = await tweEthVoter.getYesVoteCnt.call(123,{from: accounts[3]});
      await tweEthVoter.getYesVoteCnt.call(123,{from: accounts[3]});
      assert.equal(voteSum.toNumber(), 9, 'sum of two yes votes should be 9')
      console.log('got SUM');


    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting yes twice (4 & 5)')
    }
  });

  it('vote of 2 and 6 of yes adds up to 8', async () => {
    await erc20Mintable.mint(accounts[3], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[3]});

    try {

      const voteSumPre = await tweEthVoter.getYesVoteCnt.call(123,{from: accounts[3]});
      await tweEthVoter.getNoVoteCnt.call(123,{from: accounts[3]});
      console.log('voteSumPre:' + voteSumPre)

      //vote 4 yes
      const voteResult2 = await tweEthVoter.vote.call(123, 2, false, {from: accounts[3]});
      await tweEthVoter.vote(123, 2, false, {from: accounts[3]});

      //vote 5 yes
      const voteResult6 = await tweEthVoter.vote.call(123, 6, false, {from: accounts[3]});
      await tweEthVoter.vote(123, 6, false, {from: accounts[3]});

      const voteSum = await tweEthVoter.getNoVoteCnt.call(123,{from: accounts[3]});
      await tweEthVoter.getNoVoteCnt.call(123,{from: accounts[3]});
      console.log('voteSum:' + voteSum)
      assert.equal(voteSum.toNumber(), 8, 'sum of two no votes should be 8')


    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting no twice (2 & 6)')
    }
  });


  it('should not be able to vote after time elapsed', async () => {
    await erc20Mintable.mint(accounts[2], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[2]});

    try {
      // console.log(web3.eth.getBlock(web3.eth.blockNumber).timestamp);
      await increaseTime( 24 * 60 * 60);

      const voteResult = await tweEthVoter.vote.call(123, 10, true, {from: accounts[2]});
      await tweEthVoter.vote(123, 1, false, {from: accounts[2]});
      // console.log(web3.eth.getBlock(web3.eth.blockNumber).timestamp);

      assert.equal(voteResult, false, 'should not be able to vote')
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting')
    }
  });


//propose - existing id
//propose  - prposer zero tokens
//prposer

//check quorum token percenrtage

//vote bookkeeping
  // double votes add up to the right sum
     //for both yes and no noVote

     //make sure closed and ppl cant keep voting
     //cant close prematurely
     //bonus calculated prpoerly


     //claim ()
     //if quorom not passed - cant doaythign

     //you can claim what you have and shoudl get

     //bonus granting math makes sense


     //sum of tokens for a set of id's adds up


});
