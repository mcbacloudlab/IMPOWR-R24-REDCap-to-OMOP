import * as React from "react";
import { useState, useEffect } from "react";
import {
  Chip,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

export default function MyAccountCollectionsView(props) {
  const [collectionStats, setCollectionStats] = useState([]);
  // const { token } = props.props.props ?? props.props;
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState("");



  useEffect(() => {
    getCollectionNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCollectionNames() {
    // Replace this function with the actual function to fetch collection stats from your server
    var myHeaders = new Headers();
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
  const handleSaveClick = async (collectionName) => {
    // Call the API here
    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/collections/updateCollectionAltName`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', 
        body: JSON.stringify({
          collection_name: collectionName,
          collection_alt_name: editValue,
        }),
      }
    ).then(() => {
      setEditingRow(null);
      // Handle success, such as refreshing the data or showing a success message
      getCollectionNames();
    });
  };
  return (
    <Grid container spacing={1} justifyContent="center">
      <Grid item xs={12}>
        {/* <h1>Collections</h1> */}
        <Grid item xs={6} sx={{ margin: "auto" }}>
          <Typography sx={{ margin: "auto", textAlign: "center" }}>
            {`List of Mongo DB collections. Create alt-names to show more user-friendly text. Add Chips to provide more info by adding the text between brackets <>.`}
          </Typography>
          <br />
        </Grid>
        <Grid container spacing={20}>
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Alternate Display Name</b>
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
                                  <IconButton
                                    onClick={() => setEditingRow(null)}
                                  >
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

          <Grid item xs={12} md={6}>
            <Paper elevation={1}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        {`Collection Name <Recommended -s -o>`}{" "}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      Collection Name
                      <Chip
                        label="Recommended"
                        color="success"
                        variant="outlined"
                        sx={{ marginLeft: "10px" }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -o{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      <Chip label="Outlined Style" variant="outlined"></Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -s{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      <Chip label="Success Style" color="success"></Chip>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -i{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      <Chip label="Info Style" color="info"></Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -w{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      <Chip label="Warning Style" color="warning"></Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -e{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      <Chip label="Error Style" color="error"></Chip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -embeddings{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      Show as embeddings collection on Import REDCap Data
                      Dictionary page{" "}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          display: "block",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                        }}
                      >
                        -checked{" "}
                      </Typography>{" "}
                    </TableCell>
                    <TableCell>
                      Default is checked on Import REDCap Data Dictionary page
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <br />
              <Typography variant="caption">
                {" "}
                If you want to include an embeddings collection then add
                -embeddings.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
