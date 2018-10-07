const ERC20MintableAndApprove = artifacts.require('ERC20MintableAndApprove');
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

contract('ERC20MintableAndApprove', async (accounts) => {
  it('should mint and approve', async () => {
    erc20Mintable = await ERC20MintableAndApprove.new({from: accounts[0]});

    await erc20Mintable.mintAndApprove(accounts[1], 10, {from: accounts[0]});
    const balance = await erc20Mintable.balanceOf.call(accounts[1]);
    const allowance = await erc20Mintable.allowance.call(accounts[1], accounts[0]);

    assert.equal(balance.toNumber(), 10, 'balance is not correct');
    assert.equal(allowance.toNumber(), 10, 'allowance is not correct');
  });
});

contract('TweEthVoter', async (accounts) => {
  let erc20Mintable;
  let tweEthVoter;

  before(async function() {
    erc20Mintable = await ERC20MintableAndApprove.new({from: accounts[0]});
    tweEthVoter = await TweEthVoter.new(
        erc20Mintable.address,
        5,
        {from: accounts[0]}
      );
  });


  it('should allow the creation of a proposal with no tokens', async () => {
    //await erc20Mintable.mint(accounts[0], 10, {from: accounts[0]});

    const proposeResult = await tweEthVoter.propose.call(123, 0, {from: accounts[1]});
    await tweEthVoter.propose(123, 0, {from: accounts[1]});
    assert.equal(proposeResult, true, 'Proposal was not successful');

    // const result = await erc20Mintable.totalSupply.call();
    // console.log(result.toNumber());

    // let instance = await TweEthVoter.deployed(erc20Mintable.address, 5, 0);

    // assert.equal(balance.valueOf(), 10000);
  });


  // it('should NOT allow the creation of a proposal with no tokens', async () => {
  //   console.log('pre approve')
  //   await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[1]})
  //   //note this must be run before any other code mints for acccount [1]
  //   console.log('pre-propose.call');
  //   const proposeResult = await tweEthVoter.propose.call(123, {from: accounts[1]});
  //   console.log('pre-propose');
  //   await tweEthVoter.propose(123, {from: accounts[1]});
  //   console.log('pre-assert');
  //   assert.equal(proposeResult, false, 'Proposal was successful, and shouldnt be');
  //   console.log('post-assert');
  //
  // });

  it('should allow the creation of a proposal with tokens', async () => {
    await erc20Mintable.mintAndApprove(accounts[1], 10, {from: accounts[0]});
    const balance = await erc20Mintable.balanceOf.call(accounts[1]);
    console.log(balance.toNumber());
    // await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[1]})
  
    const proposeResult = await tweEthVoter.propose.call(1234, 10, {from: accounts[1]});
    await tweEthVoter.propose(1234, 10, {from: accounts[1]});
    assert.equal(proposeResult, true, 'Proposal was not successful');
  
    // const result = await erc20Mintable.totalSupply.call();
    // console.log(result.toNumber());
  
    // let instance = await TweEthVoter.deployed(erc20Mintable.address, 5, 0);
  
    // assert.equal(balance.valueOf(), 10000);
  });

  it('should NOT allow the creation of an existing proposal', async () => {
    await erc20Mintable.mint(accounts[1], 10, {from: accounts[0]});
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[1]})

    const proposeResult = await tweEthVoter.propose.call(123, {from: accounts[1]});
    await tweEthVoter.propose(123, {from: accounts[1]});
    assert.equal(proposeResult, false, 'Proposal was successful, and shouldnt be');
  });

  it('attempt to vote with no tokens', async () => {
    // const tweEthVoter = await TweEthVoter.deployed();
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[5]})

    try {
      const proposeResult = await tweEthVoter.vote.call(123, 1, true, {from: accounts[5]});
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
    await erc20Mintable.mint(accounts[3], 99);
    const postSupply = await erc20Mintable.totalSupply.call();

    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[3]});

    try {
      //vote 4 yes
      const voteResult4 = await tweEthVoter.vote.call(123, 4, true, {from: accounts[3]});
      await tweEthVoter.vote(123, 4, true, {from: accounts[3]});
      assert.equal(voteResult4, true, 'should be able to vote yes w4 tokens')

      //vote 5 yes
      const voteResult5 = await tweEthVoter.vote.call(123, 5, true, {from: accounts[3]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[3]});
      assert.equal(voteResult5, true, 'should be able to vote yes w/5 tokens')

      const voteSum = await tweEthVoter.getYesVoteCnt.call(123,{from: accounts[3]});
      await tweEthVoter.getYesVoteCnt.call(123,{from: accounts[3]});
      assert.equal(voteSum.toNumber(), 9, 'sum of two yes votes should be 9')



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


  //make sure closed and ppl cant keep voting
  it('should not allow closing prematurely (before votingLength (=10) min elapsed)', async () => {

    try {
      const closeResult = await tweEthVoter.close.call(123, {from: accounts[2]});
      await tweEthVoter.close(123, {from: accounts[2]});
      assert.equal(closeResult, false, 'shouldnt be able to close prematurely');
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when trying to close');
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







//propose - existing id - DONE
//propose  - prposer has zero tokens

//check quorum token percenrtage

//vote bookkeeping
  // double votes add up to the right sum
     //for both yes and no noVote


     //cant close prematurely - DONE
     //bonus calculated prpoerly


     //claim ()
     //if quorom not passed - cant doaythign

     //you can claim what you have and shoudl get

     //bonus granting math makes sense


     //sum of tokens for a set of id's adds up


});

contract('TweEthVoterTwo', async (accounts) => {
  let erc20Mintable;
  let tweEthVoter;

  before(async function() {
    erc20Mintable = await ERC20MintableAndApprove.new({from: accounts[0]});
    tweEthVoter = await TweEthVoter.new(
        erc20Mintable.address,
        5,
        {from: accounts[0]}
      );
  });


  it('should calculate bonus properly ', async () => {

    const proposeResult = await tweEthVoter.propose.call(123, {from: accounts[1]});
    await tweEthVoter.propose(123, {from: accounts[1]});
    assert.equal(proposeResult, true, 'Proposal was not successful');


    await erc20Mintable.mint(accounts[1], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[1]});
    await erc20Mintable.mint(accounts[2], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[2]});
    await erc20Mintable.mint(accounts[3], 10);
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[3]});

    try {
      //15 yes votes
      let voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[1]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[1]});
      assert.equal(voteResult, true, 'should be able to vote');

      voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[2]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote');

      voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[3]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[3]});
      assert.equal(voteResult, true, 'should be able to vote');

      //10 no votes
      voteResult = await tweEthVoter.vote.call(123, 5, false, {from: accounts[1]});
      await tweEthVoter.vote(123, 5, false, {from: accounts[1]});
      assert.equal(voteResult, true, 'should be able to vote');

      voteResult = await tweEthVoter.vote.call(123, 5, false, {from: accounts[2]});
      await tweEthVoter.vote(123, 5, false, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote');

      //ffwd so we can close
      await increaseTime( 24 * 60 * 60);


      const closeResult = await tweEthVoter.close.call(123, {from: accounts[1]});
      await tweEthVoter.close(123, {from: accounts[1]});
      assert.equal(closeResult, true, 'should have been able to close');

      const voteTotalNo = await tweEthVoter.getNoTotal.call(123,{from: accounts[3]});
      await tweEthVoter.getNoTotal.call(123,{from: accounts[3]});
      console.log('voteTotalNo:' + voteTotalNo)

      const voteTotalYes = await tweEthVoter.getYesTotal.call(123,{from: accounts[3]});
      await tweEthVoter.getYesTotal.call(123,{from: accounts[3]});
      console.log('voteTotalYes:' + voteTotalYes)

      const bonus = await tweEthVoter.getBonusAmount.call(123, {from: accounts[1]});
      await tweEthVoter.getBonusAmount(123, {from: accounts[1]});
      console.log('Bonus:' + bonus.toNumber());

      assert.equal(bonus.toNumber(), 6666666666, 'should have been able to close');

    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting');
    }
  });


  it('should pay out claim() properly ', async () => {
    try {
      //15 yes votes - account 1, 2, 3 voted yes 5 tokens
      //10 no votes - accoutn 1, 2 voted no 5 tokens
      //0.66666666666 tokens per yes vote
      //3.333333 tokens bonus goes to account 1 and 2

      const balancePre1 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePre2 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePre3 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('balancePre1:' + balancePre1 + ' balancePre2:' + balancePre2 +
                  ' balancePre3:' + balancePre3);

      let sent = await tweEthVoter.claim.call([123], {from: accounts[1]});
      await tweEthVoter.claim([123], {from: accounts[1]});
      assert.equal(sent, true, 'should not get error when claiming');

      // sent = await tweEthVoter.claim.call([123], {from: accounts[2]});
      // await tweEthVoter.claim([123], {from: accounts[2]});
      // assert.equal(sent, true, 'should not get error when claiming');
      // sent = await tweEthVoter.claim.call([123], {from: accounts[3]});
      // await tweEthVoter.claim([123], {from: accounts[3]});
      // assert.equal(sent, true, 'should not get error when claiming');

      // const balancePost1 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      // await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});
      //
      // const balancePost2 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      // await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});
      //
      // const balancePost3 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      // await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('balancePost1:' + balancePost1 + ' balancePost2:' + balancePost2 +
                  ' balancePost3:' + balancePost3);



    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error paying out claim');
    }
  });





});
