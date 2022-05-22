//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AvatarAccessory.sol";

contract Avatar is ERC721, Ownable {
    mapping(uint => uint) TokenMeta;

    AvatarAccessory public Accessory;

    constructor() 
    ERC721("Avatar", "AVATAR") {}

    function setAddress(address _accessory) external onlyOwner {
        Accessory = AvatarAccessory(payable(_accessory));
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        super.transferFrom(from, to, tokenId);

        Accessory.transferAccessory(from, to, tokenId);
    }
}
