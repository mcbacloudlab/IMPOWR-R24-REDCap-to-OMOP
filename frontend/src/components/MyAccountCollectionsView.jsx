import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Input,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CheckIcon from "@mui/icons-material/Check";

export default function MyAccountCollectionsView(props) {
  // console.log('completedjobs props', props)
  const [collectionStats, setCollectionStats] = useState([]);
  const { token } = props.props.props ?? props.props;
  // console.log("completeld list", completedList);

  // console.log('token?', token)
  // const [open, setOpen] = useState(false);

  const [columns, setColumns] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Replace this function with the actual function to fetch collection stats from your server
      var myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        "Bearer " + token
      );


      var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/collections/getCollectionNames`,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => {
          console.log(JSON.parse(result))
          result = JSON.parse(result)
          result.sort((a, b) => a.name.localeCompare(b.name));
          setCollectionStats((result));
        })
        .catch((error) => console.log("error", error));
      // const data = await response.json();
  }, []);

  return (
    <div style={{ maxHeight: "400px" }}>
      <h1 style={{ padding: "10px", textAlign: "left" }}>Your Collections</h1>
      <Grid
        container
        spacing={1}
        justifyContent="center"
        style={{ backgroundColor: "rgb(251 251 251)" }}
      >
        <Grid item xs={12} md={4}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Collection Name</b></TableCell>
                  <TableCell align="right"><b>Document Count</b></TableCell>
                  <TableCell align="right"><b>Storage Size (bytes)</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collectionStats.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">{row.documentCount}</TableCell>
                    <TableCell align="right">{row.storageSize}</TableCell>
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
