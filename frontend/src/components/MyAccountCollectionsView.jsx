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
  const { token } = props.props.props ?? props.props;
  // console.log("completeld list", completedList);

  // console.log('token?', token)
  // const [open, setOpen] = useState(false);
 
  const [columns, setColumns] = useState([]);

  const navigate = useNavigate();

  return (
    <div style={{ maxHeight: "400px" }}>
      <h1 style={{ padding: "10px", textAlign: "left" }}>Your Collections</h1>
      <Grid container spacing={1} justifyContent="center" style={{ backgroundColor: "rgb(251 251 251)"}}>
          <Grid item xs={12} md={4}>
           <Typography>Your Collections</Typography>
          </Grid>
      </Grid>
    </div>
  );
}
