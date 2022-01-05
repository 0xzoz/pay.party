import {
  Box,
  HStack,
  Text,
  Spacer,
  Center,
  Divider,
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

export const View = ({ partyData, mainnetProvider, votesData, distribution }) => {
  const [castVotes, setCastVotes] = useState(null);
  const [currentDist, setCurrentDist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const scores = votesData && votesData[0] && JSON.parse(votesData[0].data.ballot.votes);
    setCastVotes(scores);
    const dist =
      distribution && distribution.reduce((obj, item) => Object.assign(obj, { [item.address]: item.score }), {});
    setCurrentDist(dist);
  }, [votesData]);

  const candidateRows = useMemo(() => {
    const row =
      partyData &&
      partyData.candidates &&
      partyData.candidates.map(d => {
        return (
          <Tbody key={`view-row-${d}`}>
            <Tr>
              <Td>
                <AddressChakra
                  address={d}
                  ensProvider={mainnetProvider}
                  // blockExplorer={blockExplorer}
                />
              </Td>
              <Td>{castVotes && castVotes[d]}</Td>
              <Td>{currentDist && (currentDist[d] * 100).toFixed(0)}%</Td>
            </Tr>
          </Tbody>
        );
      });
    return row;
  }, [partyData, castVotes]);
  console.log(partyData)

  return (
    <Box borderWidth={"1px"}>
      <Center pt={4}>
        <Text fontSize="lg">Party</Text>
      </Center>
      <Center pt={4}>
        <Text>{`${partyData?.name}`}</Text>
      </Center>
      <Center pt={4} pl="5%" pr="5%">
        <Text fontSize="sm">{`${partyData?.description}`}</Text>
      </Center>
        <Center>
        <Text pt={4}fontSize="md">{`Voted: ${partyData?.ballots?.length}/${partyData?.participants?.length}`}</Text>
      </Center>

      <Table pr={2} pl={2}>
        <Thead>
          <Tr>
            <Th>Address</Th>
            <Th>Your Vote</Th>
            <Th>Current Distribution</Th>
          </Tr>
        </Thead>
        {candidateRows}
        <Tfoot>
        </Tfoot>
      </Table>
    </Box>
  );
};