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
  IconButton,
  Tooltip,
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
import { styled, alpha, useTheme } from "@mui/material/styles";
import blank_avatar from "../assets/blank_avatar.jpg";
import StorageIcon from "@mui/icons-material/Storage";
import MyAccountAllCompletedJobs from "./MyAccountAllCompletedJobs";
import MyAccountCollectionsView from "./MyAccountCollectionsView";
import MyAccountAllPendingJobs from "./MyAccountAllPendingJobs";
import MyAccountAllFailedJobs from "./MyAccountAllFailedJobs";
import ProjectManagementPage from "../pages/ProjectManagementPage";
import AddHomeWorkIcon from "@mui/icons-material/AddHomeWork";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const drawerWidth = "240px";
const miniDrawerWidth = 56;

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
  const theme = useTheme();
  // console.log("navbar props", props);
  const [view, setView] = useState("My Account");
  const [jobs, setJobs] = useState();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

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

  const handleClick = (viewName) => {
    setView(viewName);
  };

  return (
    <Box sx={{ display: "flex", overflow: "hidden" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? drawerWidth : miniDrawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerOpen ? drawerWidth : miniDrawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#343541",
            color: "white",
            transition: "width 225ms cubic-bezier(0, 0, 0.2, 1)",
          },
        }}
      >
        <Toolbar>
          {/* <IconButton
            color="inherit"
            aria-label="open/close drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, minWidth: 0 }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton> */}
        </Toolbar>
        <Box
          sx={{
            overflowX: "hidden",
            overflowY: "auto",
            backgroundColor: "#343541",
            color: "white",
          }}
        >
          <Box sx={{ mb: 1, mx: 2.5 }}>
            <Link underline="none">
              <IconButton
                color="inherit"
                aria-label="open/close drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
              {/* <StyledAccount>
                <Avatar src={blank_avatar} alt="photoURL" /> */}

              {/* <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "white" }}>
                    <b>{props.name}</b>
                  </Typography>

                  <Typography variant="body2" sx={{ color: "white" }}>
                    {props.role}
                  </Typography>
                </Box> */}
              {/* </StyledAccount> */}
            </Link>
          </Box>
          <Box
            sx={{
              overflowY: "auto",
              backgroundColor: "#343541",
              color: "white",
            }}
          >
            <List
              sx={{
                width: "100%",
                overflowX: "hidden",
              }}
            >
              <Divider sx={{ bgcolor: "white" }} />
              <Tooltip title="My Account" placement="right">
                <ListItem key={"My Account"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("My Account")}
                  >
                    <ListItemIcon>
                      <AccountCircleIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"My Account"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>
              <Tooltip title="Project Management" placement="right">
                <ListItem key={"Project Management"} disablePadding>
                  <ListItemButton
                    onClick={() => handleClick("Project Management")}
                  >
                    <ListItemIcon>
                      <AddHomeWorkIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"Project Management"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="Completed Jobs" placement="right">
                <ListItem key={"Completed Jobs"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("Completed Jobs")}
                  >
                    <ListItemIcon>
                      <PlaylistAddCheckSharpIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"Completed Jobs"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="Pending Jobs" placement="right">
                <ListItem key={"Pending Jobs"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("Pending Jobs")}
                  >
                    <ListItemIcon>
                      <AutorenewIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"Pending Jobs"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="Failed Jobs" placement="right">
                <ListItem key={"Failed Jobs"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("Failed Jobs")}
                  >
                    <ListItemIcon>
                      <ErrorIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"Failed Jobs"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            </List>
          </Box>
          <Divider sx={{ bgcolor: "white" }} />
          {props.role === "admin" && (
            <List
              sx={{
                width: "100%",
                overflowX: "hidden",
              }}
            >
              {/* <Typography variant="h6" gutterBottom>
                Admin Section
              </Typography> */}
              <Tooltip title="API Keys" placement="right">
                <ListItem
                  key={"API Keys"}
                  disablePadding
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <ListItemButton onClick={(event) => handleClick("API Keys")}>
                    <ListItemIcon>
                      <KeyIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"API Keys"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="All Completed Jobs" placement="right">
                <ListItem key={"All Completed Jobs"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("All Completed Jobs")}
                  >
                    <ListItemIcon>
                      <PlaylistAddCheckSharpIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"All Completed Jobs"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="All Pending Jobs" placement="right">
                <ListItem key={"All Pending Jobs"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("All Pending Jobs")}
                  >
                    <ListItemIcon>
                      <AutorenewIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"All Pending Jobs"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="All Failed Jobs" placement="right">
                <ListItem key={"All Failed Jobs"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("All Failed Jobs")}
                  >
                    <ListItemIcon>
                      <ErrorIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"All Failed Jobs"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip title="Collections" placement="right">
                <ListItem key={"Collections"} disablePadding>
                  <ListItemButton
                    onClick={(event) => handleClick("Collections")}
                  >
                    <ListItemIcon>
                      <StorageIcon style={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={"Collections"}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: theme.transitions.create("opacity", {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                        opacity: drawerOpen ? 1 : 0,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>
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
        {view === "Project Management" && (
          <>
            <ProjectManagementPage
              props={props}
              jobs={jobs}
              setJobs={setJobs}
            />
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
