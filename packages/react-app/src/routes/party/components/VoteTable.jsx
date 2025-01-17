import {
  Box,
  Button,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Center,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
} from "@chakra-ui/react";
import React, { useState, useMemo, useEffect } from "react";
import AddressChakra from "../../../components/AddressChakra";

export const VoteTable = ({
  dbInstance,
  partyData,
  address,
  userSigner,
  targetNetwork,
  readContracts,
  mainnetProvider,
}) => {
  // Init votes data to 0 votes for each candidate
  console.log(partyData)
  const [votesData, setVotesData] = useState(null);
  // Init votes left to nvotes
  const [votesLeft, setVotesLeft] = useState(null);
  const [invalidVotesLeft, setInvalidVotesLeft] = useState(false);

  useEffect(() => {
    try {
      setVotesData(partyData.candidates.reduce((o, key) => ({ ...o, [key]: 0 }), {}));
      setVotesLeft(partyData.config.nvotes);
    } catch {
      // Do something? 
    }

  }, [partyData])

  const handleVotesChange = (event, adr) => {
    votesData[adr] = Number(event);
    const spent = Object.values(votesData).reduce((a, b) => a + b);
    setVotesLeft(partyData.config.nvotes - spent);
    setInvalidVotesLeft(spent > partyData.config.nvotes);
  };

  const vote = async () => {
    // EIP-712 Typed Data
    // See: https://eips.ethereum.org/EIPS/eip-712
    const domain = {
      name: "pay-party",
      version: "1",
      chainId: targetNetwork.chainId,
      verifyingContract: readContracts.Distributor.address,
    };
    const types = {
      Party: [
        { name: "party", type: "string" },
        { name: "ballot", type: "Ballot" },
      ],
      Ballot: [
        { name: "address", type: "address" },
        { name: "votes", type: "string" },
      ],
    };

    const ballot = {
      party: partyData.name,
      ballot: {
        address: address,
        votes: JSON.stringify(votesData, null, 2),
      },
    };

    // NOTE: sign typed data for eip712 is underscored because it's in public beta
    if (partyData.participants.includes(address) && !invalidVotesLeft) {
      userSigner
        ?._signTypedData(domain, types, ballot)
        .then(sig => {
          const ballots = partyData.ballots;
          const cast = ballots.valueOf(address).filter(d => d.data.ballot.address === address);
          // TODO: Check if account has already submitted a ballot
          if (cast.length === 0) {
            // Push a ballot to the parties sumbitted ballots array
            return { signature: sig, data: ballot };
          } else {
            throw "Error: Account already voted!";
          }
        })
        .then(b => {
          dbInstance.addPartyBallot(partyData.id, b);
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      console.log("Error: Inavlid Ballot!");
    }
  };

  const candidates = useMemo(() => {
    let c; 
    try {
     c = partyData.candidates.map(d => {
      return (
        <Tbody key={`vote-row-${d}`}>
          <Tr>
            <Td>
              <AddressChakra
                address={d}
                ensProvider={mainnetProvider}
                // blockExplorer={blockExplorer}
              />
            </Td>
            <Td>
              <NumberInput
                defaultValue={0}
                min={0}
                max={partyData.config.nvotes}
                onChange={e => {
                  handleVotesChange(e, d);
                }}
                width="6em"
                size="lg"
                isInvalid={invalidVotesLeft}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Td>
          </Tr>
        </Tbody>
      );
    });
  } catch {
    c = [];
  }
    return c
  }, [partyData, votesLeft]);

  return (
    <Box>
      <Center pt={4}>
        <Text fontSize="lg">Cast Votes</Text>
      </Center>
      <Center pb="3">
        <Text fontWeight="semibold" fontSize="lg">
          {votesLeft}
        </Text>
      </Center>
      <Table borderWidth="1px">
        <Thead>
          <Tr>
            <Th>Address</Th>
            <Th>Score</Th>
          </Tr>
        </Thead>
        <TableCaption>
          <Button onClick={vote} disabled={invalidVotesLeft}>
            Vote
          </Button>
        </TableCaption>
        {candidates}
      </Table>
    </Box>
  );
};
