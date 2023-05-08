import React, { useEffect, useState } from "react";
import {
  Checkbox,
  //   FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  //   Typography,
} from "@mui/material";

const CollectionList = ({ token, checkedItems, setCheckedItems }) => {
  const [filteredCollections, setFilteredCollections] = useState([]);
  //   const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    const fetchCollections = async () => {
      var myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);

      var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
        credentials: "include",
      };

      fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/collections/getCollectionNames`,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => {
          result = JSON.parse(result);
          result.sort((a, b) => a.name.localeCompare(b.name));
          const filteredData = result.filter(
            (item) =>
              item.name.includes("snomed") || item.name.includes("loinc")
          );
          setFilteredCollections(filteredData);
        })
        .catch((error) => console.log("error", error));
    };
    fetchCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckboxChange = (event) => {
    setCheckedItems({
      ...checkedItems,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <TableContainer component={Paper} sx={{margin: 1}}>
      <Table size="small">
        <TableHead sx={{backgroundColor: '#343541', color: 'white'}}>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell sx={{color: "white"}}>Name</TableCell>
            <TableCell sx={{color: 'white'}}>Documents</TableCell>
            {/* <TableCell>Storage Size</TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredCollections.map((item, index) => (
            <TableRow key={index}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={checkedItems[item.name] || false}
                  onChange={handleCheckboxChange}
                  name={item.name}
                />
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell align="right">
                {item.documentCount
                  ? item.documentCount.toLocaleString()
                  : "N/A"}
              </TableCell>
              {/* <TableCell>{item.storageSize}</TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CollectionList;
