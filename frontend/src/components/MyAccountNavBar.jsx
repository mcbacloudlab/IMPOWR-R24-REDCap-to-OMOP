import * as React from "react";
import { useEffect } from "react";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import {
  Box,
  Link,
  Divider,
  Drawer,
  Typography,
  Avatar,
  ListItem,
  ListItemButton,
  // Paper
} from "@mui/material";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ErrorIcon from "@mui/icons-material/Error";
import MyAccountAdminSection from "./MyAccountAPIKeys";
import { useState } from "react";
import KeyIcon from "@mui/icons-material/Key";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CompletedJobs from "./CompletedJobs";
import PendingJobs from "./PendingJobs";
import FailedJobs from "./FailedJobs";
import { styled, alpha } from "@mui/material/styles";
import blank_avatar from "../assets/blank_avatar.jpg";
import StorageIcon from "@mui/icons-material/Storage";
import MyAccountAllCompletedJobs from "./MyAccountAllCompletedJobs";
import MyAccountCollectionsView from "./MyAccountCollectionsView";
import MyAccountAllPendingJobs from "./MyAccountAllPendingJobs";
import MyAccountAllFailedJobs from "./MyAccountAllFailedJobs";

const drawerWidth = "240px";

const StyledAccount = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2, 2.5),
  marginTop: "10px",
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: alpha(theme.palette.grey[500], 0.12),
  color: "white",
}));

export default function MyAccountNavBar(props) {
  // console.log("navbar props", props);
  const [view, setView] = useState("My Account");
  const [jobs, setJobs] = useState();

  useEffect(() => {
    if (props.props.completedList) {
      setJobs(
        props.props.completedList.map((job) => ({
          ...job,
          editMode: false,
          newJobName: job.jobName,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.completedList]);

  const handleClick = (event) => {
    setView(event.target.textContent);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#343541",
            color: "white",
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{ overflow: "auto", backgroundColor: "#343541", color: "white" }}
        >
          <Box sx={{ mb: 1, mx: 2.5 }}>
            <Link underline="none">
              <StyledAccount>
                <Avatar src={blank_avatar} alt="photoURL" />

                <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "white" }}>
                    <b>{props.name}</b>
                  </Typography>

                  <Typography variant="body2" sx={{ color: "white" }}>
                    {props.role}
                  </Typography>
                </Box>
              </StyledAccount>
            </Link>
          </Box>
          <List>
            <Divider sx={{ bgcolor: "white" }} />
            <ListItem key={"My Account"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <AccountCircleIcon style={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText primary={"My Account"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Completed Jobs"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <PlaylistAddCheckSharpIcon style={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText primary={"Completed Jobs"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Pending Jobs"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <AutorenewIcon style={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText primary={"Pending Jobs"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Failed Jobs"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <ErrorIcon style={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText primary={"Failed Jobs"} />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider sx={{ bgcolor: "white" }} />
          {props.role === "admin" && (
            <List>
              {/* <Typography variant="h6" gutterBottom>
                Admin Section
              </Typography> */}
              <ListItem key={"API Keys"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <KeyIcon style={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText primary={"API Keys"} />
                </ListItemButton>
              </ListItem>
              <ListItem key={"All Completed Jobs"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <PlaylistAddCheckSharpIcon style={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText primary={"All Completed Jobs"} />
                </ListItemButton>
              </ListItem>
              <ListItem key={"All Pending Jobs"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <AutorenewIcon style={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText primary={"All Pending Jobs"} />
                </ListItemButton>
              </ListItem>
              <ListItem key={"All Failed Jobs"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <ErrorIcon style={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText primary={"All Failed Jobs"} />
                </ListItemButton>
              </ListItem>
              <ListItem key={"Collections"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <StorageIcon style={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText primary={"Collections"} />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 1 }}>
        {/* <Toolbar /> */}
        {view === "My Account" && (
          <>
            <h1 style={{ textAlign: "left" }}>My Account</h1>
            <Typography sx={{ textAlign: "left" }}>
              <b>Name:</b> {props.name}
            </Typography>
            <Typography sx={{ textAlign: "left" }}>
              <b>Email:</b> {props.username}
            </Typography>
            <Typography sx={{ textAlign: "left" }}>
              {props.role && (
                <>
                  <b>Role:</b> {props.role}
                </>
              )}
            </Typography>
          </>
        )}
        {view === "Completed Jobs" && (
          <>
            <CompletedJobs props={props} jobs={jobs} setJobs={setJobs} />
          </>
        )}

        {view === "Pending Jobs" && (
          <>
            <PendingJobs props={props} />
          </>
        )}

        {view === "Failed Jobs" && (
          <>
            <FailedJobs props={props} />
          </>
        )}

        {view === "API Keys" && props.role === "admin" ? (
          <MyAccountAdminSection props={props} />
        ) : (
          ""
        )}

        {view === "All Completed Jobs" && props.role === "admin" ? (
          <MyAccountAllCompletedJobs props={props} />
        ) : (
          ""
        )}

        {view === "All Pending Jobs" && props.role === "admin" ? (
          <MyAccountAllPendingJobs props={props} />
        ) : (
          ""
        )}

        {view === "All Failed Jobs" && props.role === "admin" ? (
          <MyAccountAllFailedJobs props={props} />
        ) : (
          ""
        )}

        {view === "Collections" && props.role === "admin" ? (
          <MyAccountCollectionsView props={props} />
        ) : (
          ""
        )}
      </Box>
    </Box>
  );
}
