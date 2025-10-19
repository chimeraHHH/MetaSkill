import { expect } from "chai";
import { ethers } from "hardhat";

describe("SkillNFT", function () {
  it("mints, lists and purchases", async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    const SkillNFT = await ethers.getContractFactory("SkillNFT", deployer);
    const skill = await SkillNFT.deploy();
    await skill.waitForDeployment();

    // Mint to Alice
    const tx = await skill.connect(alice).mintSkill(alice.address, "ipfs://QmMeta", 0);
    const rc = await tx.wait();
    const ev = rc!.logs.find(l => (l as any).eventName === "SkillMinted") as any;
    const tokenId = ev?.args?.tokenId ?? 1n;

    // List
    await expect(skill.connect(alice).listSkill(tokenId, ethers.parseEther("0.1"))).to.emit(skill, "SkillListed");

    // Purchase from Bob
    await expect(
      skill.connect(bob).purchaseSkill(tokenId, { value: ethers.parseEther("0.1") }),
    ).to.emit(skill, "SkillPurchased");

    // New owner is Bob
    const owner = await skill.ownerOf(tokenId);
    expect(owner).to.eq(bob.address);

    // Not listed anymore
    const [_, listed] = await (async () => {
      const res = await skill.getSkill(tokenId);
      return [res[0], res[1]] as const;
    })();
    expect(listed).to.eq(false);
  });
});

