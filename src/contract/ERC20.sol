// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
    uint8 private _decimals;

    constructor (string memory name, string memory symbol, uint8 decimalsValue, uint256 supply,
        address owner) ERC20(name, symbol) {
        _decimals = decimalsValue;
        _mint(owner, supply * 10 ** uint(decimals()));
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}