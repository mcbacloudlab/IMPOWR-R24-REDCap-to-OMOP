import * as React from "react";
import { useState, useEffect } from "react";
import {
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

export default function MyAccountCollectionsView(props) {
  // console.log('completedjobs props', props)
  const [collectionStats, setCollectionStats] = useState([]);
  const { token } = props.props.props ?? props.props;
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
   getCollectionNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function getCollectionNames(){
     // Replace this function with the actual function to fetch collection stats from your server
     var myHeaders = new Headers();
     myHeaders.append("Authorization", "Bearer " + token);
 
     var requestOptions = {
       method: "GET",
       headers: myHeaders,
       redirect: "follow",
       credentials: "include", // Include cookies with the request
     };
 
     fetch(
       `${process.env.REACT_APP_BACKEND_API_URL}/api/collections/getCollectionNames`,
       requestOptions
     )
       .then((response) => response.text())
       .then((result) => {
         // console.log(JSON.parse(result))
         result = JSON.parse(result);
         result.sort((a, b) => a.name.localeCompare(b.name));
         setCollectionStats(result);
       })
       .catch((error) => console.log("error", error));
  }
  const handleSaveClick = (collectionName) => {
    // Call the API here

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/collections/updateCollectionAltName`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          collection_name: collectionName,
          collection_alt_name: editValue,
        }),
      }
    ).then(() => {
      setEditingRow(null);
      // Handle success, such as refreshing the data or showing a success message
      getCollectionNames()
    });
  };
  return (
    <div>
      <h1 style={{ padding: "10px", textAlign: "center" }}>Collections</h1>
      <Grid
        container
        spacing={1}
        justifyContent="center"
        style={{ backgroundColor: "rgb(251 251 251)" }}
      >
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>Alt Name</b>
                  </TableCell>
                  {/* New column */}
                  <TableCell>
                    <b>Collection Name</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Document Count</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Storage Size</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collectionStats.map((row, index) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      {editingRow === index ? (
                        <TextField
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <>
                                <IconButton
                                  onClick={() => handleSaveClick(row.name)}
                                >
                                  <SaveIcon />
                                </IconButton>
                                <IconButton onClick={() => setEditingRow(null)}>
                                  <CancelIcon />
                                </IconButton>
                              </>
                            ),
                          }}
                        />
                      ) : (
                        <>
                          {row.collection_alt_name || "N/A"}{" "}
                          {/* Display the existing alt name or 'N/A' */}
                          <IconButton
                            onClick={() => {
                              setEditingRow(index);
                              setEditValue(row.collection_alt_name || "");
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">
                      {row.documentCount
                        ? row.documentCount.toLocaleString()
                        : "N/A"}
                    </TableCell>
                    <TableCell align="right">
                      {row.storageSize
                        ? Number(
                            (row.storageSize / 1024 / 1024).toFixed(2)
                          ).toLocaleString() + " MB"
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </div>
  );
}
