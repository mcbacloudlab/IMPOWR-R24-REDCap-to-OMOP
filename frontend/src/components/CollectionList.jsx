import React, { useEffect, useState, useRef } from "react";
import {
  Checkbox,
  Chip,
  Grid,
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
  const [loaded, setLoaded] = useState(false);

  const initialCheckedItemsUpdated = useRef(false);
  //   const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (!loaded) {
      fetchCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
         // Create an object to collect changes to checkedItems
         let changesToCheckedItems = {};
        result = JSON.parse(result);
        setLoaded(true);
        result.forEach((item) => {
          if (item.collection_alt_name && item.collection_alt_name.includes("-checked")) {
            // Here you can extract the relevant information and add it to changesToCheckedItems
            // For example:
            changesToCheckedItems[item.name] = true;
          }
        });
        result.sort((a, b) => a.name.localeCompare(b.name));
       
        // Apply the changes to checkedItems, but only if we haven't already
        if (!initialCheckedItemsUpdated.current) {
          setCheckedItems({
            ...checkedItems,
            ...changesToCheckedItems,
          });
          initialCheckedItemsUpdated.current = true; // Mark that we've done this
        }

        const filteredData = result.filter((item) => {
          return item.collection_alt_name
            ? item.collection_alt_name.includes("-embeddings")
            : false;
        });
        setFilteredCollections(filteredData);
      })
      .catch((error) => console.log("error", error));
  };

  const handleCheckboxChange = (event) => {
    setCheckedItems({
      ...checkedItems,
      [event.target.name]: event.target.checked,
    });
  };

  function parseTextWithChip(text, name) {
    const result = [];
    // Create an object to collect changes
    let changesToCheckedItems = {};
    let position = 0;
    let start = text.indexOf("<", position);

    while (start !== -1) {
      const end = text.indexOf(">", start);

      if (end !== -1) {
        result.push(text.substring(position, start));
        const content = text.substring(start + 1, end);
        const parts = content.split(" ");

        let label = parts[0];
        let color;
        let variant;
        let hide = false; // Add this line to initialize the hide variable

        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];

          if (part === "-s") {
            color = "success";
          }
          if (part === "-i") {
            color = "info";
          }
          if (part === "-w") {
            color = "warning";
          }
          if (part === "-e") {
            color = "error";
          }
          if (part === "-o") {
            variant = "outlined";
          }
          if (part === "-hide") {
            // Check for the -hide option
            hide = true;
          }
          if (part === "-checked") {
            // Collect the change instead of calling setCheckedItems
            changesToCheckedItems[name] = true;
          }
        }

        if (!hide) {
          // Only push the Chip if hide is false
          result.push(
            <Chip key={name} label={label} color={color} variant={variant} />
          );
        }

        position = end + 1;
        start = text.indexOf("<", position);
      } else {
        break;
      }
    }

    result.push(text.substring(position));


    return result;
  }

  return (
    <Grid container spacing={0} justifyContent="center" alignItems="center">
      <TableContainer component={Paper} sx={{ margin: 0 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#343541", color: "white" }}>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell sx={{ color: "white" }}>Collection Name</TableCell>
              <TableCell sx={{ color: "white" }}>Embeddings</TableCell>
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
                <TableCell>
                  {item.collection_alt_name
                    ? parseTextWithChip(item.collection_alt_name, item.name)
                    : item.name}
                </TableCell>
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
    </Grid>
  );
};

export default CollectionList;
