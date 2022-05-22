const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Avatar with accessory testing", function () {
    let deployer, acc1, acc2;
    let avatarContract, avatarAccessory;

    before("Deploy contracs", async() => {
        [deployer, acc1, acc2] = await ethers.getSigners();

        // deploy Avatar contract
        const AvatarContract = await ethers.getContractFactory("Avatar");
        avatarContract = await AvatarContract.deploy();
        await avatarContract.deployed();
        console.log(`Avatar nft deployed to: ${avatarContract.address}`);

        // deploy AvatarAccessory contract
        const AvatarAccessory = await ethers.getContractFactory("AvatarAccessory");
        avatarAccessory = await AvatarAccessory.deploy();
        await avatarAccessory.deployed();
        console.log(`AvatarAccessory contract deployed to: ${avatarAccessory.address}`);

        // set accessory address to Avatar contract
        await avatarContract.setAddress(avatarAccessory.address);

        // set mint price 0.3ETH
        await avatarContract.setMintPrice(ethers.utils.parseUnits("0.3"));

        // set Avatar address to accessory contract
        await avatarAccessory.setAddress(avatarContract.address);
    });

    it("mint nft requires 0.3 ETH", async() => {
        await expect(
            avatarContract.mintNFT()
        ).to.be.revertedWith("Insufficient balance");

        await expect(
            avatarContract.mintNFT({value: ethers.utils.parseUnits("0.1")})
        ).to.be.revertedWith("Insufficient balance");
    });

    it("mint nfts for each user", async() => {
        const mintPrice = ethers.utils.parseUnits("0.3");

        // mint 2 tokens to acc1
        await avatarContract.connect(acc1).mintNFT({value: mintPrice});
        await avatarContract.connect(acc1).mintNFT({value: mintPrice});

        // mint 1 token to acc2
        await avatarContract.connect(acc2).mintNFT({value: mintPrice});

        const acc1Cnt = await avatarContract.balanceOf(acc1.address);
        expect(acc1Cnt).to.eq(2);

        const acc2Cnt = await avatarContract.balanceOf(acc2.address);
        expect(acc2Cnt).to.eq(1);
    });

    it("create accessory type", async() => {
        await avatarAccessory.connect(deployer).createNewType(); // accessoryId = 1 is cap
        await avatarAccessory.connect(deployer).createNewType(); // accessoryId = 1 is boot
        await avatarAccessory.connect(deployer).createNewType(); // accessoryId = 1 is t-shirt

        // set mint price 0.01ETH
        await avatarAccessory.setPrice(1, ethers.utils.parseUnits("0.01"));
        await avatarAccessory.setPrice(2, ethers.utils.parseUnits("0.01"));
        await avatarAccessory.setPrice(3, ethers.utils.parseUnits("0.01"));
    });

    it("mint accessory requires 0.01ETH * amount", async() => {
        await expect(
            avatarAccessory.buyAccessory(1, 1)
        ).to.be.revertedWith("Insufficient balance");
        
        // to mint 2 nfts, users need to pay 0.02ETH
        await expect(
            avatarAccessory.buyAccessory(1, 2, {value: ethers.utils.parseUnits("0.01")})
        ).to.be.revertedWith("Insufficient balance");
    });

    it("mint accessories to users", async() => {
        const mintPrice1 = ethers.utils.parseUnits("0.02");
        await avatarAccessory.connect(acc1).buyAccessory(1, 2, {value: mintPrice1});
        await avatarAccessory.connect(acc1).buyAccessory(2, 2, {value: mintPrice1});
        await avatarAccessory.connect(acc1).buyAccessory(3, 2, {value: mintPrice1});

        const mintPrice = ethers.utils.parseUnits("0.01");
        await avatarAccessory.connect(acc2).buyAccessory(1, 1, {value: mintPrice});
        await avatarAccessory.connect(acc2).buyAccessory(2, 1, {value: mintPrice});
        await avatarAccessory.connect(acc2).buyAccessory(3, 1, {value: mintPrice});

        const user1nft2Cnt = await avatarAccessory.balanceOf(acc1.address, 2);
        expect(user1nft2Cnt).to.eq(2);

        const user2nft3Cnt = await avatarAccessory.balanceOf(acc2.address, 3);
        expect(user2nft3Cnt).to.eq(1);
    });

    it("set accessory to nfts", async() => {
        await expect(
            avatarAccessory.connect(acc2).setAccessory(2, 1)
        ).to.be.revertedWith("Not avatar owner");

        await avatarAccessory.connect(acc1).setAccessory(1, 1);
        await avatarAccessory.connect(acc1).setAccessory(1, 2);
        await avatarAccessory.connect(acc1).setAccessory(1, 3);

        await avatarAccessory.connect(acc1).setAccessory(2, 1);
        await avatarAccessory.connect(acc1).setAccessory(2, 2);
        await avatarAccessory.connect(acc1).setAccessory(2, 3);

        await avatarAccessory.connect(acc2).setAccessory(3, 1);
        await avatarAccessory.connect(acc2).setAccessory(3, 2);
        await avatarAccessory.connect(acc2).setAccessory(3, 3);

        await avatarAccessory.connect(acc2).removeAccessory(3, 3);
    });

    it("test avatar transfer", async() => {
        await expect(
            avatarAccessory.transferAccessory(acc1.address, acc2.address, 1)
        ).to.be.revertedWith("Not authorized");

        await expect(
            avatarContract.connect(acc2).transferFrom(acc2.address, acc1.address, 1)
        ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

        await avatarContract.connect(acc1).transferFrom(acc1.address, acc2.address, 1);
        const nft1Owner = await avatarContract.ownerOf(1);
        expect(nft1Owner).to.eq(acc2.address);

        const acc2nft1Cnt = await avatarAccessory.balanceOf(acc2.address, 1);
        expect(acc2nft1Cnt).to.eq(2);
    });

    it("test avatar transfer: acc2 -> acc1", async() => {
        await avatarContract.connect(acc2).transferFrom(acc2.address, acc1.address, 1);
        const nft1Owner = await avatarContract.ownerOf(1);
        expect(nft1Owner).to.eq(acc1.address);

        await avatarContract.connect(acc2).transferFrom(acc2.address, acc1.address, 3);
        const nft3Owner = await avatarContract.ownerOf(1);
        expect(nft3Owner).to.eq(acc1.address);

        const acc1nft1Cnt = await avatarAccessory.balanceOf(acc1.address, 1);
        expect(acc1nft1Cnt).to.eq(3);

        const acc1nft2Cnt = await avatarAccessory.balanceOf(acc1.address, 2);
        expect(acc1nft2Cnt).to.eq(3);

        const acc1nft3Cnt = await avatarAccessory.balanceOf(acc1.address, 3);
        expect(acc1nft3Cnt).to.eq(2);
    });
});
