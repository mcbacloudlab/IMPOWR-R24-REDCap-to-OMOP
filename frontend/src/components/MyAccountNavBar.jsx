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
import MyAccountAdminSection from "./MyAccountAdminSection";
import { useState } from "react";
import KeyIcon from "@mui/icons-material/Key";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const drawerWidth = "240px";

export default function MyAccountNavBar(props) {
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
          </List>
          <Divider />
          {props.role === "admin" && (
            <List>
              <ListItem key={"API Keys"} disablePadding>
                <ListItemButton onClick={(event) => handleClick(event)}>
                  <ListItemIcon>
                    <KeyIcon />
                  </ListItemIcon>
                  <ListItemText primary={"API Keys"} />
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
            <h1>My Account</h1>
            <Typography sx={{ textAlign: "left" }}>
              <b>Name:</b> {props.name}
            </Typography>
            <Typography sx={{ textAlign: "left" }}>
              <b>Email:</b> {props.username}
            </Typography>
            <Typography sx={{ textAlign: "left" }}>
              {props.role && (
                <div>
                  <b>Role:</b> {props.role}
                </div>
              )}
            </Typography>
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
