pragma solidity ^0.4.24;

import "./ERC20Mintable.sol";

contract ERC20MintableAndApprove is ERC20Mintable {
  function mintAndApprove(address to, uint256 value) public onlyMinter returns(bool) {
    mint(to, value);
    _allowed[to][msg.sender] = _allowed[to][msg.sender] + value;
  }
}
