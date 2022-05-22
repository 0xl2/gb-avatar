//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./Avatar.sol";

contract AvatarAccessory is ERC1155, Ownable {
    uint public _tokenIds;
    Avatar public avatarContract;

    mapping(uint => uint) public AccessoryPrice;
    mapping(uint => uint[]) public UserAccessory;

    event SetPrice(uint accessoryId, uint price);
    event BuyAccessory(address indexed user, uint accessoryId);
    event SetAccessory(address indexed user, uint tokenId, uint accessoryId);
    event RemoveAccessory(address indexed user, uint tokenId, uint accessoryId);

    constructor() ERC1155("") {}

    modifier checkNFT(uint tokenId, uint accessoryId) {
        require(msg.sender == avatarContract.ownerOf(tokenId), "Not avatar owner");
        require(accessoryId <= _tokenIds, "Invalid accessory");
        require(balanceOf(msg.sender, accessoryId) > 0, "Insufficient accessory");

        _;
    }

    modifier validAccessory(uint accessoryId) {
        require(accessoryId <= _tokenIds, "Invalid accessory");

        _;
    }

    function setAddress(address _avatar) external onlyOwner {
        avatarContract = Avatar(payable(_avatar));
    }

    function setPrice(uint accessoryId, uint price) external validAccessory(accessoryId) onlyOwner {
        AccessoryPrice[accessoryId] = price;

        emit SetPrice(accessoryId, price);
    }

    function hasAccessory(
        uint tokenId, 
        uint accessoryId
    ) public view returns(bool _has) {
        uint[] memory accessoryList = UserAccessory[tokenId];
        for(uint ii = 0; ii < accessoryList.length; ii++) {
            if(accessoryId == accessoryList[ii]) {
                _has = true;
                break;
            }
        }
    }

    function createNewType() external onlyOwner {
        _tokenIds++;
    }

    function transferAccessory(
        address from, 
        address to, 
        uint tokenId
    ) external {
        require(msg.sender == address(avatarContract), "Not authorized");

        uint[] memory accessoryList = UserAccessory[tokenId];
        uint accessoryCnt = accessoryList.length;
        if(accessoryCnt > 0) {
            uint[] memory cntArr = new uint[](accessoryCnt);
            for(uint ii = 0; ii < accessoryCnt; ii++) cntArr[ii] = 1;

            _safeBatchTransferFrom(from, to, accessoryList, cntArr, "");
        }
    }

    function setAccessory(
        uint tokenId,
        uint accessoryId
    ) external checkNFT(tokenId, accessoryId) {
        if(!hasAccessory(tokenId, accessoryId)) {
            uint[] storage accessoryList = UserAccessory[tokenId];
            accessoryList.push(accessoryId);
        }

        emit SetAccessory(msg.sender, tokenId, accessoryId);
    }

    function removeAccessory(
        uint tokenId,
        uint accessoryId
    ) external checkNFT(tokenId, accessoryId) {
        require(hasAccessory(tokenId, accessoryId), "Accessory not set to avatar");

        uint[] storage accessoryList = UserAccessory[tokenId];
        uint accessoryCnt = accessoryList.length;
        for(uint ii = 0; ii < accessoryCnt; ii++) {
            if(accessoryList[ii] == accessoryId) {
                accessoryList[ii] = accessoryList[accessoryCnt - 1];
                break;
            }
        }

        accessoryList.pop();
        UserAccessory[tokenId] = accessoryList;

        emit RemoveAccessory(msg.sender, tokenId, accessoryId);
    }

    function buyAccessory(
        uint accessoryId,
        uint amount
    ) external payable validAccessory(accessoryId) {
        require(amount > 0, "Invalid amount");
        uint mintPrice = AccessoryPrice[accessoryId];
        require(mintPrice > 0, "Price not set");
        require(msg.value >= mintPrice * amount, "Insufficient balance");

        _mint(msg.sender, accessoryId, amount, "");

        emit BuyAccessory(msg.sender, accessoryId);
    }

    function withdrawToken(address wallet) external onlyOwner {
        payable(wallet).transfer(address(this).balance);
    }

    receive() external payable {}
}