import React from "react";
import Grid from "@mui/material/Grid";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
// import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
// import Paper from "@mui/material/Paper";
import MaterialReactTable from "material-react-table";
// import CloseIcon from "@mui/icons-material/Close";
import Badge from "@mui/material/Badge";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
import ErrorIcon from "@mui/icons-material/Error";
// import AddTaskIcon from "@mui/icons-material/AddTask";
// import { MenuItem } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
// import CheckIcon from "@mui/icons-material/Check";
// import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

export default function MyAccountUserManagement(props) {
  let propsUserObj = JSON.parse(props.props.props.user);
  let propsToken = props.props.props.token;

  const [tableData, setTableData] = useState();
  const [allUsers, setAllUsers] = useState();
  const [pendingUsers, setPendingUsers] = useState();
  const [colDefs, setColDefs] = useState();
  const [open, setOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [userSelected, setUserSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [allUsersCount, setAllUsersCount] = useState();
  const [pendingUsersCount, setPendingUsersCount] = useState();

  const handleChange = (event, newValue) => {
    setSelectedTabIdx(newValue);
  };

  useEffect(() => {
    console.log("selectedTabIdx", selectedTabIdx);
    getUsers();
    const cols = [
      {
        header: "Approved",
        accessorKey: "approved",
      },
      {
        header: "First Name",
        accessorKey: "firstName",
      },
      {
        header: "Last Name",
        accessorKey: "lastName",
      },
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Role",
        accessorKey: "role",
      },
    ];
    console.log("columns", cols);
    setColDefs(cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUsers() {
    setLoading(true);
    console.log("getUsers");
    //check for existing keys
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/admin/queryAllUsers`,
      requestOptions
    )
      .then((response) => {
        return response.text();
      })
      .then((result) => {
        // console.log("result", result);
        let jsonData = JSON.parse(result);
        setAllUsers(jsonData);
        setTableData(jsonData);
        setAllUsersCount(jsonData.length);
        // Count variable for objects where approved is not 'Y'
        setPendingUsersCount(
          jsonData.filter((obj) => obj.approved !== "Y").length
        );
        setPendingUsers(jsonData.filter((obj) => obj.approved !== "Y"));
        setLoading(false);
      })
      .catch((error) => console.log("error", error));
  }

  const handleClickOpen = (userId) => {
    console.log("userId", userId);
    setUserSelected(userId.email);
    setOpen(true);
  };

  const handleClickApproveOpen = (userId) => {
    console.log("userId", userId);
    setUserSelected(userId.email);
    setApproveOpen(true);
  };

  const handleClose = (jobId) => {
    // console.log("jobid", jobIdSelected);
    setOpen(false);
  };

  const handleApproveClose = (jobId) => {
    // console.log("jobid", jobIdSelected);
    setApproveOpen(false);
  };

  const handleConfirm = (jobId) => {
    // Do something when the user confirms
    // console.log("jb", jobIdSelected);
    setOpen(false);
    // console.log("confirm delete", jobIdSelected);
    removeUser(userSelected);
  };

  const handleApproveConfirm = (jobId) => {
    // Do something when the user confirms
    // console.log("jb", jobIdSelected);
    setApproveOpen(false);
    // console.log("confirm delete", jobIdSelected);
    approveUser(userSelected);
  };

  const removeUser = (userSelected) => {
    console.log("removeUser", userSelected);
  };

  const approveUser = (userSelected) => {
    console.log("approveUser", userSelected);
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  async function showTab(e, switching, panelIndex) {
    // setIsLoading(true);
    // setSelectedFile(value);
    if (!panelIndex) panelIndex = 0;
    setSelectedTabIdx(panelIndex);
    if (!switching) handleChange(e, 0); //reset tab to default tab
    //set table data based on panelIndex
    switch (panelIndex) {
      case 0: {
        setTableData(allUsers);
        break;
      }
      case 1: {
        // setUnverifiedElements(unverifiedElements.length)
        setTableData(pendingUsers);
        break;
      }

      default: {
        break;
      }
    }
  }

  const handleSaveRow = async ({ exitEditingMode, row, values }) => {
    //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here.
    tableData[row.index] = values;
    //send/receive api updates here
    setTableData([...tableData]);
    exitEditingMode(); //required to exit editing mode
  };

  if (propsUserObj.role === "admin") {
    return (
      <>
        <Grid>
          <h1
            style={{
              paddingLeft: "20px",
              textAlign: "center",
              backgroundColor: "rgb(251 251 251)",
            }}
          >
            Manage Accounts
          </h1>
        </Grid>

        <Grid container spacing={1} sx={{ margin: "30px" }}>
          <Grid
            item
            xs={12}
            lg={12}
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              margin: "20px",
            }}
          >
            {!loading && (
              // <Paper elevation={3} sx={{ padding: "10px" }}>
              <>
                <Tabs
                  centered
                  value={selectedTabIdx}
                  aria-label="basic tabs example"
                >
                  <Tab
                    onClick={(event) => showTab(event, true, 0)}
                    label={
                      <Box sx={{ position: "relative", margin: "20px" }}>
                        All Users
                        <PlaylistAddCheckSharpIcon />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: "-20px", // Adjust the right position of the badge
                          }}
                        >
                          <Badge
                            badgeContent={allUsersCount}
                            max={9999}
                            color="secondary"
                          />
                        </Box>
                      </Box>
                    }
                    {...a11yProps(0)}
                  />

                  <Tab
                    onClick={(event) => showTab(event, true, 1)}
                    label={
                      <Box sx={{ position: "relative", margin: "20px" }}>
                        Pending Users
                        <ErrorIcon />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: "-20px", // Adjust the right position of the badge
                          }}
                        >
                          <Badge
                            badgeContent={pendingUsersCount}
                            max={9999}
                            color="secondary"
                          />
                        </Box>
                      </Box>
                    }
                    {...a11yProps(1)}
                  />
                </Tabs>

                <Grid item xs={12}>
                  <MaterialReactTable
                    key={selectedTabIdx}
                    //passing the callback function variant. (You should get type hints for all the callback parameters available)
                    columns={colDefs}
                    data={tableData}
                    enableRowActions
                    {...(selectedTabIdx === 1 && {
                      renderRowActions: ({ row, table }) => [
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: "8px",
                          }}
                        >
                          <Tooltip title="Approve">
                            <IconButton
                              color="success"
                              onClick={() => {
                                handleClickApproveOpen(row.original);
                              }}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton
                              color="error"
                              onClick={() => {
                                // tableData.splice(row.index, 1); //assuming simple data table
                                // setTableData([...tableData]);
                                handleClickOpen(row.original);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>,
                      ],
                    })}
                    {...(selectedTabIdx === 0 && {
                      renderRowActions: ({ row, table }) => [
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: "8px",
                          }}
                        >
                          <Tooltip title="Edit">
                            <IconButton
                              color="secondary"
                              onClick={() => {
                                table.setEditingRow(row);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton
                              color="error"
                              onClick={() => {
                                handleClickOpen(row.original);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>,
                      ],
                    })}
                    enableDensityToggle={false} //density does not work with memoized cells
                    memoMode="cells" // memoize table cells to improve render performance, but break some features
                    enableBottomToolbar={true}
                    enableGlobalFilterModes={true}
                    enablePagination={true}
                    enableColumnResizing={true}
                    editingMode="modal" //default
                    enableEditing
                    onEditingRowSave={handleSaveRow}
                    // {...(selectedTabIdx === 2 ? {} : { enableExpanding: true })}
                    RowProps={{ sx: { marginBottom: "10px" } }}
                    // enableRowNumbers
                    // enableRowVirtualization
                    muiTableContainerProps={{
                      sx: {
                        maxWidth: "100vw",
                        maxHeight: "50vh",
                      },
                    }}
                    initialState={{
                      density: "compact",
                      // pagination: { pageSize: 50, pageIndex: 0 },
                    }}
                    enableSorting={true}
                    enableStickyHeader
                    muiTableProps={{
                      sx: {
                        borderCollapse: "separate",
                        borderSpacing: "0 10px", // set the desired space between rows
                        tableLayout: "fixed",
                      },
                    }}
                    muiTablePaperProps={{
                      elevation: 2, //change the mui box shadow
                      //customize paper styles
                      sx: {
                        borderRadius: "0",
                        border: "1px solid #e0e0e0",
                      },
                    }}
                    muiTableBodyProps={{
                      sx: {
                        "& .subrow": {
                          backgroundColor: "pink",
                        },
                      },
                    }}
                    muiTableHeadProps={{
                      sx: (theme) => ({
                        "& tr": {
                          backgroundColor: "#4a4a4a",
                          color: "#ffffff",
                        },
                      }),
                    }}
                    muiTableHeadCellProps={{
                      sx: (theme) => ({
                        div: {
                          backgroundColor: "#4a4a4a",
                          color: "#ffffff",
                        },
                      }),
                    }}
                    // autoWidth={true}
                    positionToolbarAlertBanner="bottom"
                    renderTopToolbarCustomActions={({ table }) => (
                      <Box
                        width="100%"
                        sx={{
                          display: "flex",
                          gap: "1rem",
                          p: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <Box style={{ marginLeft: "auto" }}></Box>
                      </Box>
                    )}
                  />
                </Grid>
                <Dialog open={open} onClose={handleClose}>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      <Typography
                        color="error"
                        component="span"
                        variant="inherit"
                      >
                        Remove
                      </Typography>{" "}
                      <b>{userSelected}</b>?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClose} color="primary">
                      No
                    </Button>
                    <Button
                      onClick={() => handleConfirm(userSelected)}
                      color="primary"
                      autoFocus
                    >
                      Yes
                    </Button>
                  </DialogActions>
                </Dialog>
                <Dialog open={approveOpen} onClose={handleApproveClose}>
                  <DialogTitle>Confirm Approval</DialogTitle>
                  <DialogContent>
                    <DialogContentText color="success">
                      <Typography
                        component="span"
                        variant="inherit"
                        sx={{ color: "green" }}
                      >
                        Approve
                      </Typography>{" "}
                      <b>{userSelected}</b>?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleApproveClose} color="primary">
                      No
                    </Button>
                    <Button
                      onClick={() => handleApproveConfirm(userSelected)}
                      color="primary"
                      autoFocus
                    >
                      Yes
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
              // </Paper>
            )}
          </Grid>
        </Grid>
      </>
    );
  } else {
    return;
  }
}
