import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import ErrorIcon from "@mui/icons-material/Error";
import MyAccountAdminSection from "./MyAccountAdminSection";
import { useState } from "react";
import KeyIcon from "@mui/icons-material/Key";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CompletedJobs from "./CompletedJobs";
import PendingJobs from "./PendingJobs";
import FailedJobs from "./FailedJobs";

const drawerWidth = "240px";

export default function MyAccountNavBar(props) {
  console.log("navbar props", props);
  const [view, setView] = useState("My Account");

  const handleClick = (event) => {
    // do something with the icon name
    console.log("handle click");
    console.log("event", event.target.textContent);
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
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            <ListItem key={"My Account"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary={"My Account"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Completed Jobs"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <PlaylistAddCheckSharpIcon />
                </ListItemIcon>
                <ListItemText primary={"Completed Jobs"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Pending Jobs"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <AutorenewIcon />
                </ListItemIcon>
                <ListItemText primary={"Pending Jobs"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Failed Jobs"} disablePadding>
              <ListItemButton onClick={(event) => handleClick(event)}>
                <ListItemIcon>
                  <ErrorIcon />
                </ListItemIcon>
                <ListItemText primary={"Failed Jobs"} />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
          {props.role === "admin" && (
            <List>
              <Typography variant="h6" gutterBottom>
                Admin Section
              </Typography>
              <ListItem key={"API Keys"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <KeyIcon />
                  </ListItemIcon>
                  <ListItemText primary={"API Keys"} />
                </ListItemButton>
              </ListItem>
              <ListItem key={"All Completed Jobs"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <PlaylistAddCheckSharpIcon />
                  </ListItemIcon>
                  <ListItemText primary={"All Completed Jobs"} />
                </ListItemButton>
              </ListItem>
              <ListItem key={"All Pending Jobs"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <AutorenewIcon />
                  </ListItemIcon>
                  <ListItemText primary={"All Pending Jobs"} />
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
            <CompletedJobs props={props} />
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
      </Box>
    </Box>
  );
}
