pragma solidity ^0.4.24;

import "./ERC20Mintable.sol";

contract ERC20MintableAndApprove is ERC20Mintable {
  function mintAndApprove(address to, address tweEthContractAddress, uint256 value) public onlyMinter returns(bool) {
    mint(to, value);
    _allowed[to][tweEthContractAddress] = _allowed[to][tweEthContractAddress] + value;
  }
}
