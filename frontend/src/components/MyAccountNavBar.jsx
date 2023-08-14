import * as React from "react";
import { useEffect, useContext } from "react";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import {
  Box,
  Link,
  Divider,
  Drawer,
  Typography,
  ListItem,
  ListItemButton,
  IconButton,
  Tooltip,
} from "@mui/material";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MyAccountAPIKeys from "./MyAccountAPIKeys";
import { useState } from "react";
import KeyIcon from "@mui/icons-material/Key";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import CompletedJobs from "./JobsOverview";
import { useTheme } from "@mui/material/styles";
import StorageIcon from "@mui/icons-material/Storage";
import MyAccountAllCompletedJobs from "./MyAccountAllJobsOverview";
import MyAccountCollectionsView from "./MyAccountCollectionsView";
import ProjectManagementPage from "../pages/ProjectManagementPage";
import AddHomeWorkIcon from "@mui/icons-material/AddHomeWork";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import { ViewContext } from "./ViewContext";
import EmailIcon from "@mui/icons-material/Email";
import OrcidIcon from "../assets/orcid_16x16.gif";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MyAccountUserManagement from "./MyAccountUserManagement";
import ChangePasswordButton from "./ChangePassword";

const drawerWidth = "280px";
const miniDrawerWidth = 56;

export default function MyAccountNavBar(props) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { view, setView } = useContext(ViewContext);
  const [jobs, setJobs] = useState();
  const [drawerOpen, setDrawerOpen] = useState(null);

  const handleDrawerToggle = () => {
    const updatedDrawerOpen = !drawerOpen;
    setDrawerOpen(updatedDrawerOpen);
    localStorage.setItem("drawerOpen", updatedDrawerOpen);
  };

  useEffect(() => {
    //remember last view so refreshing page takes you to last state of the page
    let lastView = localStorage.getItem('view')
    if(lastView) setView(lastView)

    const storedDrawerOpen = localStorage.getItem("drawerOpen");
    if (storedDrawerOpen !== null) {
      setDrawerOpen(JSON.parse(storedDrawerOpen));
    } else {
      setDrawerOpen(false);
    }
  }, [setView, view]);

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
    localStorage.setItem('view', viewName)
    navigate("/myaccount");
  };
  const menuItems = [
    {
      title: "My Account",
      icon: <AccountCircleIcon style={{ color: "white" }} />,
      tooltip: "My Account",
    },
    {
      title: "Import REDCap Data Dictionary",
      icon: <AddHomeWorkIcon style={{ color: "white" }} />,
      tooltip: "Import REDCap Data Dictionary",
    },
    {
      title: "Jobs Overview",
      icon: <PlaylistAddCheckSharpIcon style={{ color: "white" }} />,
      tooltip: "Jobs Overview",
    },
    {
      title: "API Keys",
      icon: <KeyIcon style={{ color: "white" }} />,
      tooltip: "API Keys",
    },
    // Add more menu items here...
  ];

  const adminMenuItems = [
    {
      title: "All Jobs Overview",
      icon: <PlaylistAddCheckSharpIcon style={{ color: "white" }} />,
      tooltip: "All Jobs Overview",
    },
 
    {
      title: "Collections",
      icon: <StorageIcon style={{ color: "white" }} />,
      tooltip: "Collections",
    },
  
    {
      title: "Manage Accounts",
      icon: <ManageAccountsIcon style={{ color: "white" }} />,
      tooltip: "Manage Accounts",
    },
    // Add more menu items here...
  ];

  return (
    <>
      {drawerOpen !== null && (
        <Box sx={{ display: "flex", overflow: "hidden" }}>
          <Drawer
            variant="permanent"
            sx={{
              width: drawerOpen ? drawerWidth : miniDrawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: drawerOpen ? drawerWidth : miniDrawerWidth,
                boxSizing: "border-box",
                backgroundColor: theme.palette.primary.main,
                color: "white",
                transition: "width 225ms cubic-bezier(0, 0, 0.2, 1)",
                boxShadow: "4px 0px 10px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            <Toolbar></Toolbar>
            <Box
              sx={{
                overflowX: "hidden",
                overflowY: "auto",
                backgroundColor: theme.palette.primary.main,
                color: "white",
                textAlign: 'left' 
              }}
            >
              <Box sx={{ mb: 0, mx: 2.5, mt: 1}}>
                <Link underline="none">
                  <IconButton
                    color="inherit"
                    aria-label="open/close drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2}}
                  >
                    {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                  </IconButton>
                </Link>
              </Box>
              <Box
                sx={{
                  overflowY: "auto",
                  backgroundColor: theme.palette.primary.main,
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
                  {/* show the regular nav menu items here */}
                  {menuItems.map((item) => (
                    <Tooltip
                      key={item.title}
                      title={item.tooltip}
                      placement="right"
                    >
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handleClick(item.title)}
                          sx={{
                            backgroundColor:
                              view === item.title
                                ? "rgba(255, 255, 255, 0.1)"
                                : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.2)",
                            },
                          }}
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                fontSize={'12px'}
                                fontWeight={
                                  view === item.title ? "bold" : "normal"
                                }
                              >
                                {item.title}
                              </Typography>
                            }
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              transition: theme.transitions.create("opacity", {
                                easing: theme.transitions.easing.sharp,
                                duration:
                                  theme.transitions.duration.leavingScreen,
                              }),
                              opacity: drawerOpen ? 1 : 0,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                  ))}
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
                  {/* show the admin nav menu items here */}
                  {adminMenuItems.map((item) => (
                    <Tooltip
                      key={item.title}
                      title={item.tooltip}
                      placement="right"
                    >
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handleClick(item.title)}
                          sx={{
                            backgroundColor:
                              view === item.title
                                ? "rgba(255, 255, 255, 0.1)"
                                : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.2)",
                            },
                          }}
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                fontSize={'12px'}
                                fontWeight={
                                  view === item.title ? "bold" : "normal"
                                }
                              >
                                {item.title}
                              </Typography>
                            }
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              transition: theme.transitions.create("opacity", {
                                easing: theme.transitions.easing.sharp,
                                duration:
                                  theme.transitions.duration.leavingScreen,
                              }),
                              opacity: drawerOpen ? 1 : 0,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                  ))}
                </List>
              )}
            </Box>
          </Drawer>
          <Box component="main" sx={{ flexGrow: 1, p: 1, maxWidth: "90%" }}>
            {/* <Toolbar /> */}
            {view === "My Account" && (
              <>
                <h1 style={{ textAlign: "left" }}>My Account</h1>
                <Typography sx={{ textAlign: "left" }}>
                  <b>Name:</b> {props.name}
                </Typography>
                {props.orcidBool ? (
                  <Typography sx={{ textAlign: "left" }}>
                    <img
                      src={OrcidIcon}
                      alt="ORCID"
                      style={{ width: 24, height: 24, marginRight: 8 }}
                    />
                    <a
                      href={`${process.env.REACT_APP_ORCID_URL}/${props.username}`}
                    >
                      {process.env.REACT_APP_ORCID_URL}/{props.username}{" "}
                    </a>
                  </Typography>
                ) : (
                  <Typography sx={{ textAlign: "left" }}>
                    <EmailIcon sx={{ marginRight: 1 }} />
                    <b>Email:</b> {props.username}
                  </Typography>
                )}
                <Typography sx={{ textAlign: "left" }}>
                  {props.role && (
                    <>
                      <b>Role:</b> {props.role}
                    </>
                  )}
                </Typography>
                <br />
                {!props.orcidBool && (
                  <Box>
                  <ChangePasswordButton token={props.props.token}/>
                </Box>
                )}
                
              </>
            )}
            {view === "Import REDCap Data Dictionary" && (
              <>
                <ProjectManagementPage
                  props={props}
                  jobs={jobs}
                  setJobs={setJobs}
                  handleClick={handleClick}
                />
              </>
            )}
            {view === "Jobs Overview" && (
              <>
                <CompletedJobs props={props} jobs={jobs} setJobs={setJobs} />
              </>
            )}

            {/* {view === "Pending Jobs" && (
              <>
                <PendingJobs props={props} />
              </>
            )}

            {view === "Failed Jobs" && (
              <>
                <FailedJobs props={props} />
              </>
            )} */}

            {view === "API Keys"? (
              <MyAccountAPIKeys props={props} />
            ) : (
              ""
            )}

            {view === "All Jobs Overview" && props.role === "admin" ? (
              <MyAccountAllCompletedJobs props={props} />
            ) : (
              ""
            )}

            {/* {view === "All Pending Jobs" && props.role === "admin" ? (
              <MyAccountAllPendingJobs props={props} />
            ) : (
              ""
            )}

            {view === "All Failed Jobs" && props.role === "admin" ? (
              <MyAccountAllFailedJobs props={props} />
            ) : (
              ""
            )} */}

            {view === "Collections" && props.role === "admin" ? (
              <MyAccountCollectionsView props={props} />
            ) : (
              ""
            )}

            {view === "Manage Accounts" && props.role === "admin" ? (
              <MyAccountUserManagement props={props} />
            ) : (
              ""
            )}
          </Box>
        </Box>
      )}
    </>
  );
}
