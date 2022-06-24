import { Contract, ethers } from "ethers";
import "dotenv/config";
import * as ballotJson from "../../artifacts/contracts/Ballot.sol/Ballot.json";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

async function main() {
  // create a wallet with private keys 
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  // create provider
  // const provider = ethers.providers.getDefaultProvider("goerli");
  const provider = new ethers.providers.JsonRpcProvider(process.env.ROPSTEN_URL);
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const ballotAddress = process.argv[2];
  if (process.argv.length < 4) throw new Error("Proposal to vote for index missing");
  const proposalVotingForIndex = process.argv[3];

  // create contract instance
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    ballotJson.abi,
    signer
  ) as Ballot;

  const votingForProposalObj = await ballotContract.proposals(proposalVotingForIndex);
  const votingForNameString = await ethers.utils.parseBytes32String(votingForProposalObj.name);
  console.log(
    `Voting for proposal ${proposalVotingForIndex} - ${votingForNameString}`
  );

  // cast vote
  const tx = await ballotContract.vote(proposalVotingForIndex);
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
  // print updated Proposal votes
  const updatedProposal = await ballotContract.proposals(proposalVotingForIndex);
  const updatedVotes = await updatedProposal.voteCount.toString();
  console.log(`Proposal updated to: ${votingForNameString} - ${updatedVotes}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
