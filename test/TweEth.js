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

    await erc20Mintable.mintAndApprove(accounts[1], accounts[0], 10, {from: accounts[0]});
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
  //
  it('should allow the creation of a proposal with tokens', async () => {
    await erc20Mintable.mintAndApprove(accounts[1], tweEthVoter.address, 10, {from: accounts[0]});

    const proposeResult = await tweEthVoter.propose.call(1234, 10, {from: accounts[1]});
    await tweEthVoter.propose(1234, 10, {from: accounts[1]});
    assert.equal(proposeResult, true, 'Proposal was not successful');

    // const result = await erc20Mintable.totalSupply.call();
    // console.log(result.toNumber());

    // let instance = await TweEthVoter.deployed(erc20Mintable.address, 5, 0);

    // assert.equal(balance.valueOf(), 10000);
  });

  it('should NOT allow the creation of an existing proposal', async () => {
    await erc20Mintable.mintAndApprove(accounts[1], tweEthVoter.address, 10, {from: accounts[0]});

    await erc20Mintable.mint(accounts[1], 10, {from: accounts[0]});
    await erc20Mintable.approve(tweEthVoter.address, 10, {from: accounts[1]})

    const proposeResult = await tweEthVoter.propose.call(123, 10, {from: accounts[1]});
    await tweEthVoter.propose(123, 10, {from: accounts[1]});
    assert.equal(proposeResult, false, 'Proposal was successful, and shouldnt be');
  });

  it('should not allow attempt to vote with no tokens', async () => {
    try {
      const proposeResult = await tweEthVoter.vote.call(123, 1, true, {from: accounts[5]});
      assert.equal(true, false, 'should not be able to vote')
    } catch(err) {
    }
  });

  it('should vote yes succesfully', async () => {
    await erc20Mintable.mintAndApprove(accounts[2], tweEthVoter.address, 10, {from: accounts[0]});

    try {
      const voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[2]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote');
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting');
    }
  });

  it('should vote no successfully', async () => {
    await erc20Mintable.mintAndApprove(accounts[2], tweEthVoter.address, 10, {from: accounts[0]});

    try {
      const voteResult = await tweEthVoter.vote.call(123, 10, false, {from: accounts[2]});
      await tweEthVoter.vote(123, 10, false, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote no')
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting no')
    }
  });

  it('vote of 4 and 5 of yes adds up to 9', async () => {
    await erc20Mintable.mintAndApprove(accounts[3], tweEthVoter.address, 10, {from: accounts[0]});

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
    await erc20Mintable.mintAndApprove(accounts[3], tweEthVoter.address, 10, {from: accounts[0]});

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
      await tweEthVoter.getNoVoteCnt(123, {from: accounts[3]});
      console.log('voteSum:' + voteSum)
      assert.equal(voteSum.toNumber(), 8, 'sum of two no votes should be 8')


    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting no twice (2 & 6)')
    }
  });


  // //make sure closed and ppl cant keep voting
  it('should not allow closing prematurely (before votingLength (=10) min elapsed)', async () => {

    try {
      console.log('acc[9]:' + accounts[9]);
      const closeResult = await tweEthVoter.close.call(123, accounts[9], {from: accounts[0]});
      await tweEthVoter.close(123, accounts[9], {from: accounts[0]});
      assert.equal(closeResult, false, 'shouldnt be able to close prematurely');
    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when trying to close');
    }
  });

  it('should not be able to vote after time elapsed', async () => {
    await erc20Mintable.mintAndApprove(accounts[2], tweEthVoter.address, 10, {from: accounts[0]});

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

contract('TweEthVoterYesWins', async (accounts) => {
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
    await erc20Mintable.mintAndApprove(accounts[1], tweEthVoter.address, 20, {from: accounts[0]});
    await erc20Mintable.mintAndApprove(accounts[2], tweEthVoter.address, 20, {from: accounts[0]});
    await erc20Mintable.mintAndApprove(accounts[3], tweEthVoter.address, 20, {from: accounts[0]});

    const proposeResult = await tweEthVoter.propose.call(123, 10, {from: accounts[1]});
    await tweEthVoter.propose(123, 10, {from: accounts[1]});
    assert.equal(proposeResult, true, 'Proposal was not successful');



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


      const closeResult = await tweEthVoter.close.call(123, accounts[9], {from: accounts[0]});
      await tweEthVoter.close(123, accounts[9], {from: accounts[0]});
      assert.equal(closeResult, true, 'should have been able to close');

      const voteTotalNo = await tweEthVoter.getNoTotal.call(123, {from: accounts[3]});
      await tweEthVoter.getNoTotal.call(123, {from: accounts[3]});
      console.log('voteTotalNo:' + voteTotalNo)

      const voteTotalYes = await tweEthVoter.getYesTotal.call(123, {from: accounts[3]});
      await tweEthVoter.getYesTotal.call(123, {from: accounts[3]});
      console.log('voteTotalYes:' + voteTotalYes)

      const bonus = await tweEthVoter.getBonusAmount.call(123, {from: accounts[1]});
      await tweEthVoter.getBonusAmount(123, {from: accounts[1]});
      console.log('Bonus:' + bonus.toNumber());

      assert.equal(bonus.toNumber(), 2000000000, 'should have been able to close');

    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting');
    }
  });


  it('should pay out claim() properly ', async () => {
    try {

      const balancePre1 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePre2 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePre3 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('balancePre1:' + balancePre1 + ' balancePre2:' + balancePre2 +
                  ' balancePre3:' + balancePre3);

      const voteYes1 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[1]});
      const voteYes2 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[2]});
      const voteYes3 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[3]});

      console.log('voteYes1:' + voteYes1 + ' voteYes2:' + voteYes2 +
                  ' voteYes3:' + voteYes3);

      const voteNo1 = await tweEthVoter.getNoVoteCnt.call(123, {from: accounts[1]});
      const voteNo2 = await tweEthVoter.getNoVoteCnt.call(123, {from: accounts[2]});
      const voteNo3 = await tweEthVoter.getNoVoteCnt.call(123, {from: accounts[3]});

      console.log('voteNo1:' + voteNo1 + ' voteNo2:' + voteNo2 +
                  ' voteNo3:' + voteNo3);

      const yesTotal = await tweEthVoter.getYesTotal.call(123, {from: accounts[1]});
      const noTotal = await tweEthVoter.getNoTotal.call(123, {from: accounts[1]});
      console.log('yesTotal:' + yesTotal + ' noTotal:' + noTotal);

      //balancePre1:0 balancePre2:10 balancePre3:15
      //voteYes1:15 voteYes2:5 voteYes3:5 - 25
      //voteNo1:5 voteNo2:5 voteNo3:0 - 10

      let sent = await tweEthVoter.claim.call([123], {from: accounts[1]});
      await tweEthVoter.claim([123], {from: accounts[1]});
      assert.equal(sent, true, 'should not get error when claiming');

      const voteYes11 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[1]});
      const voteYes22 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[2]});
      const voteYes33 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[3]});

      console.log('POST CLAIM() voteYes1:' + voteYes11 + ' voteYes2:' + voteYes22 +
                  ' voteYes3:' + voteYes33);

      const balancePre11 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePre22 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePre33 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('POST CLAIM balancePre1:' + balancePre11 + ' balancePre2:' + balancePre22 +
                  ' balancePre3:' + balancePre33);


      sent = await tweEthVoter.claim.call([123], {from: accounts[2]});
      await tweEthVoter.claim([123], {from: accounts[2]});
      assert.equal(sent, true, 'should not get error when claiming');

      sent = await tweEthVoter.claim.call([123], {from: accounts[3]});
      await tweEthVoter.claim([123], {from: accounts[3]});
      assert.equal(sent, true, 'should not get error when claiming');

      const balancePost1 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePost2 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePost3 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('balancePost1:' + balancePost1 + ' balancePost2:' + balancePost2 +
                  ' balancePost3:' + balancePost3);


    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error paying out claim');
    }
  });

});



contract('TweEthVoterNoWins', async (accounts) => {
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
    await erc20Mintable.mintAndApprove(accounts[1], tweEthVoter.address, 20, {from: accounts[0]});
    await erc20Mintable.mintAndApprove(accounts[2], tweEthVoter.address, 20, {from: accounts[0]});
    await erc20Mintable.mintAndApprove(accounts[3], tweEthVoter.address, 20, {from: accounts[0]});

    const proposeResult = await tweEthVoter.propose.call(123, 10, {from: accounts[1]});
    await tweEthVoter.propose(123, 10, {from: accounts[1]});
    assert.equal(proposeResult, true, 'Proposal was not successful');



    try {
      //15 no votes
      let voteResult = await tweEthVoter.vote.call(123, 5, false, {from: accounts[1]});
      await tweEthVoter.vote(123, 5, false, {from: accounts[1]});
      assert.equal(voteResult, true, 'should be able to vote');

      voteResult = await tweEthVoter.vote.call(123, 5, false, {from: accounts[2]});
      await tweEthVoter.vote(123, 5, false, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote');

      voteResult = await tweEthVoter.vote.call(123, 5, false, {from: accounts[3]});
      await tweEthVoter.vote(123, 5, false, {from: accounts[3]});
      assert.equal(voteResult, true, 'should be able to vote');

      //10 yes votes
      voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[1]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[1]});
      assert.equal(voteResult, true, 'should be able to vote');

      voteResult = await tweEthVoter.vote.call(123, 5, true, {from: accounts[2]});
      await tweEthVoter.vote(123, 5, true, {from: accounts[2]});
      assert.equal(voteResult, true, 'should be able to vote');

      //ffwd so we can close
      await increaseTime( 24 * 60 * 60);


      const closeResult = await tweEthVoter.close.call(123, accounts[9], {from: accounts[0]});
      await tweEthVoter.close(123, accounts[9], {from: accounts[0]});
      assert.equal(closeResult, true, 'should have been able to close');

      const voteTotalNo = await tweEthVoter.getNoTotal.call(123, {from: accounts[3]});
      await tweEthVoter.getNoTotal.call(123, {from: accounts[3]});
      console.log('voteTotalNo:' + voteTotalNo)

      const voteTotalYes = await tweEthVoter.getYesTotal.call(123, {from: accounts[3]});
      await tweEthVoter.getYesTotal.call(123, {from: accounts[3]});
      console.log('voteTotalYes:' + voteTotalYes)

      const bonus = await tweEthVoter.getBonusAmount.call(123, {from: accounts[1]});
      await tweEthVoter.getBonusAmount(123, {from: accounts[1]});
      console.log('Bonus:' + bonus.toNumber());

      assert.equal(bonus.toNumber(), 2000000000, 'should have been able to close');

    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error when voting');
    }
  });


  it('should pay out claim() properly ', async () => {
    try {

      const balancePre1 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePre2 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePre3 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('balancePre1:' + balancePre1 + ' balancePre2:' + balancePre2 +
                  ' balancePre3:' + balancePre3);

      const voteYes1 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[1]});
      const voteYes2 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[2]});
      const voteYes3 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[3]});

      console.log('voteYes1:' + voteYes1 + ' voteYes2:' + voteYes2 +
                  ' voteYes3:' + voteYes3);

      const voteNo1 = await tweEthVoter.getNoVoteCnt.call(123, {from: accounts[1]});
      const voteNo2 = await tweEthVoter.getNoVoteCnt.call(123, {from: accounts[2]});
      const voteNo3 = await tweEthVoter.getNoVoteCnt.call(123, {from: accounts[3]});

      console.log('voteNo1:' + voteNo1 + ' voteNo2:' + voteNo2 +
                  ' voteNo3:' + voteNo3);

      const yesTotal = await tweEthVoter.getYesTotal.call(123, {from: accounts[1]});
      const noTotal = await tweEthVoter.getNoTotal.call(123, {from: accounts[1]});
      console.log('yesTotal:' + yesTotal + ' noTotal:' + noTotal);

      //balancePre1:0 balancePre2:10 balancePre3:15
      //voteYes1:15 voteYes2:5 voteYes3:5 - 25
      //voteNo1:5 voteNo2:5 voteNo3:0 - 10

      let sent = await tweEthVoter.claim.call([123], {from: accounts[1]});
      await tweEthVoter.claim([123], {from: accounts[1]});
      assert.equal(sent, true, 'should not get error when claiming');

      const voteYes11 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[1]});
      const voteYes22 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[2]});
      const voteYes33 = await tweEthVoter.getYesVoteCnt.call(123, {from: accounts[3]});

      console.log('POST CLAIM() voteYes1:' + voteYes11 + ' voteYes2:' + voteYes22 +
                  ' voteYes3:' + voteYes33);

      const balancePre11 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePre22 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePre33 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('POST CLAIM balancePre1:' + balancePre11 + ' balancePre2:' + balancePre22 +
                  ' balancePre3:' + balancePre33);


      sent = await tweEthVoter.claim.call([123], {from: accounts[2]});
      await tweEthVoter.claim([123], {from: accounts[2]});
      assert.equal(sent, true, 'should not get error when claiming');

      sent = await tweEthVoter.claim.call([123], {from: accounts[3]});
      await tweEthVoter.claim([123], {from: accounts[3]});
      assert.equal(sent, true, 'should not get error when claiming');

      const balancePost1 = await erc20Mintable.balanceOf.call(accounts[1], {from: accounts[1]});
      await erc20Mintable.balanceOf(accounts[1], {from: accounts[1]});

      const balancePost2 = await erc20Mintable.balanceOf.call(accounts[2], {from: accounts[2]});
      await erc20Mintable.balanceOf(accounts[2], {from: accounts[2]});

      const balancePost3 = await erc20Mintable.balanceOf.call(accounts[3], {from: accounts[3]});
      await erc20Mintable.balanceOf(accounts[3], {from: accounts[3]});

      console.log('balancePost1:' + balancePost1 + ' balancePost2:' + balancePost2 +
                  ' balancePost3:' + balancePost3);


    } catch(err) {
      console.log(err);
      assert.equal(true, false, 'should not get error paying out claim');
    }
  });

});
