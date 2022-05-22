//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AvatarAccessory.sol";

contract Avatar is ERC721, Ownable {
    uint public NFTCnt;
    uint public MintPrice;
    mapping(uint => uint) TokenMeta;

    AvatarAccessory public Accessory;

    event SetMintPrice(uint oldPrice, uint newPrice);

    constructor() 
    ERC721("Avatar", "AVATAR") {}

    function setAddress(address _accessory) external onlyOwner {
        Accessory = AvatarAccessory(payable(_accessory));
    }

    function setMintPrice(uint _price) external onlyOwner {
        emit SetMintPrice(MintPrice, _price);
        MintPrice = _price;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        super.transferFrom(from, to, tokenId);

        Accessory.transferAccessory(from, to, tokenId);
    }

    function mintNFT() external payable {
        require(msg.value >= MintPrice, "Insufficient balance");

        NFTCnt++;

        _mint(msg.sender, NFTCnt);
    }

    receive() external payable {}
}
