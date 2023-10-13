import React from "react";
import Grid from "@mui/material/Grid";
import { useState, useEffect } from "react";
import {
  // Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  lighten,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MaterialReactTable from "material-react-table";
import Badge from "@mui/material/Badge";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
// import CloseIcon from "@mui/icons-material/Close";
// import SaveIcon from "@mui/icons-material/Save";
import { useTheme } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export default function MyAccountUserManagement(props) {
  let propsUserObj = JSON.parse(props.props.props.user);
  let propsToken = props.props.props.token;

  const [tableData, setTableData] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState();
  const [pendingUsers, setPendingUsers] = useState();
  const [colDefs, setColDefs] = useState();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [userSelected, setUserSelected] = useState("");
  const [userName, setUsername] = useState();
  const [loading, setLoading] = useState(true);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [approvedUsersCount, setApprovedUsersCount] = useState(0);
  const [editRoleData, setEditRoleData] = useState({}); // Initialize the state
 

  const handleChange = (event, newValue) => {
    setSelectedTabIdx(newValue);
  };

  const theme = useTheme();

  const badgeTheme = createTheme({
    components: {
      MuiBadge: {
        styleOverrides: {
          badge: {
            color: "#ffffff",
            backgroundColor: theme.palette.primary.main,
          },
        },
      },
    },
  });

  const EditRoleCell = ({ row }) => {
    const [currentRole, setCurrentRole] = useState(
      editRoleData[row.id] || row.original.role || "default"
    );
  
    const handleChange = (event) => {
      const newRole = event.target.value;
      setCurrentRole(newRole);
      setEditRoleData((prevData) => ({
        ...prevData,
        [row.id]: newRole,
      }));
    };
  
    // console.log("row", row.original.role);
    // console.log("editRoleData", editRoleData[row.id]);
    // console.log("using currentRole", currentRole);
  
    return (
      <Select
        key={row.id}
        value={currentRole}
        onChange={handleChange}
      >
        <MenuItem value={"admin"}>Admin</MenuItem>
        <MenuItem value={"default"}>Default</MenuItem>
      </Select>
    );
  };
  
  const RoleCell = ({ row }) => {
    // console.log('row', row.original.role)
    return row.original.role?row.original.role:'default'
  }
  

  useEffect(() => {
    getUsers();
    const cols = [
      // {
      //   header: "Approved",
      //   accessorKey: "approved",
      //   Cell: ApprovedCell,
      // },
      {
        header: "First Name",
        accessorKey: "firstName",
        enableEditing: false, //disable editing on this column
      },
      {
        header: "Last Name",
        accessorKey: "lastName",
        enableEditing: false, //disable editing on this column
      },
      {
        header: "Email / ORCID",
        accessorKey: "email",
        enableEditing: false, //disable editing on this column
      },
      {
        header: "Role",
        accessorKey: "role",
        Edit: EditRoleCell,
        Cell: RoleCell
      },
    ];
    setColDefs(cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUsers() {
    setLoading(true);
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
        let jsonData = JSON.parse(result);
        setSelectedTabIdx(selectedTabIdx);
        // Count variable for objects where approved is not 'Y'
        setPendingUsersCount(
          jsonData.filter((obj) => obj.approved !== "Y").length
        );
        let _pendingUsers = jsonData.filter((obj) => obj.approved !== "Y");
        setPendingUsers(_pendingUsers);

        setApprovedUsersCount(
          jsonData.filter((obj) => obj.approved === "Y").length
        );
        setApprovedUsers(jsonData.filter((obj) => obj.approved === "Y"));
        if (selectedTabIdx === 0) {
          setTableData(jsonData.filter((obj) => obj.approved === "Y"));
          setLoading(false);
        } else if (selectedTabIdx === 1) {
          setTableData(_pendingUsers);
          setLoading(false);
        }
      })
      .catch((error) => console.log("error", error));
  }

  const handleClickRemoveOpen = (userId) => {
    setUserSelected(userId.email);
    setUsername(userId.firstName + " " + userId.lastName);
    setRemoveOpen(true);
  };

  const handleClickApproveOpen = (userId) => {
    setUserSelected(userId.email);
    setUsername(userId.firstName + " " + userId.lastName);
    setApproveOpen(true);
  };

  const handleRemoveClose = (jobId) => {
    setRemoveOpen(false);
  };

  const handleApproveClose = (jobId) => {
    setApproveOpen(false);
  };

  const handleRemoveConfirm = (jobId) => {
    setRemoveOpen(false);
    removeUser(userSelected);
  };

  const handleApproveConfirm = (jobId) => {
    setApproveOpen(false);
    approveUser(userSelected);
  };

  const removeUser = (userSelected) => {
    // console.log("removeUser", userSelected);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();
    formdata.append("email", userSelected);
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/admin/removeUser`,
      requestOptions
    )
      .then((response) => {
        return response.text();
      })
      .then((result) => {
        // console.log('result', result)
        getUsers();
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  const approveUser = (userSelected) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();
    formdata.append("email", userSelected);
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/admin/approveUser`,
      requestOptions
    )
      .then((response) => {
        return response.text();
      })
      .then((result) => {
        // console.log('result', result)
        getUsers();
      })
      .catch((error) => console.log("error", error));
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  async function showTab(e, switching, panelIndex) {
    if (!panelIndex) panelIndex = 0;
    setSelectedTabIdx(panelIndex);
    if (!switching) handleChange(e, 0); //reset tab to default tab
    //set table data based on panelIndex
    switch (panelIndex) {
      case 0: {
        setTableData(approvedUsers);
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


  const handleSaveRow = async ({ exitEditingMode, cell, row, values }) => {
    // console.log("values", values);

    // If the role was edited, use the new value. Otherwise, use the original value.
    values.role = editRoleData[row.id] || values.role;
    // console.log("role update", values.role);
    let updatedRole = values.role
    if(!updatedRole){
      // console.log('no role provided defaulting...',)
      updatedRole = 'default'
    }

    // console.log(`updating ${values.email} role with ${updatedRole} `)

    // Send/receive API updates here
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + propsToken);

    var formdata = new FormData();
    formdata.append("email", values.email);
    formdata.append("role", updatedRole);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
      credentials: "include", // Include cookies with the request
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/admin/updateUser`,
      requestOptions
    )
      .then((response) => {
        return response.text();
      })
      .then((result) => {
        // console.log('result', result)
        getUsers();
      })
      .catch((error) => console.log("error", error));

    setTableData([...tableData]);
    exitEditingMode(); // Required to exit editing mode
  };


  if (propsUserObj.role === "admin") {
    return (
      <>
        {/* <Grid>
          <h1
            style={{
              paddingLeft: "20px",
              textAlign: "center",
              backgroundColor: "rgb(251 251 251)",
            }}
          >
            Manage User Accounts
          </h1>
        </Grid> */}
        <Grid container spacing={1} sx={{ margin: "30px" }}>
          <Grid item xs={12} md={2}>
            <Tabs
              value={selectedTabIdx}
              aria-label="basic tabs example"
              orientation="vertical"
              TabIndicatorProps={{
                style: {
                  display: "none",
                },
              }}
            >
              <Tab
                onClick={(event) => showTab(event, true, 0)}
                style={{
                  backgroundColor:
                    selectedTabIdx === 0
                      ? lighten(theme.palette.secondary.main, 0.5)
                      : "inherit",
                }}
                label={
                  <Box sx={{ position: "relative", margin: "20px" }}>
                    Approved Users
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: "-20px",
                      }}
                    >
                      <ThemeProvider theme={badgeTheme}>
                        <Badge
                          badgeContent={approvedUsersCount}
                          max={9999}
                          color="secondary"
                        />
                      </ThemeProvider>
                    </Box>
                  </Box>
                }
                {...a11yProps(0)}
              />

              <Tab
                onClick={(event) => showTab(event, true, 1)}
                style={{
                  backgroundColor:
                    selectedTabIdx === 1
                      ? lighten(theme.palette.secondary.main, 0.5)
                      : "inherit",
                }}
                label={
                  <Box sx={{ position: "relative", margin: "20px" }}>
                    Pending Users
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: "-20px",
                      }}
                    >
                      <ThemeProvider theme={badgeTheme}>
                        <Badge
                          badgeContent={
                            <span
                              sx={{
                                color: "#ffffff",
                                "& > *": { color: "#ffffff" },
                              }}
                            >
                              {pendingUsersCount}
                            </span>
                          }
                          max={9999}
                          color="secondary"
                        />
                      </ThemeProvider>
                    </Box>
                  </Box>
                }
                {...a11yProps(1)}
              />
            </Tabs>
          </Grid>
          {!loading && (
            <>
              <Grid item xs={12} md={9}>
                <MaterialReactTable
                  key={selectedTabIdx}
                  //passing the callback function variant. (You should get type hints for all the callback parameters available)
                  columns={colDefs}
                  data={tableData}
                  enableRowActions
                  //default approved users tab
                  {...(selectedTabIdx === 0 && {
                    renderRowActions: ({ cell, row, table }) => [
                      (() => {
                        // return editingRow && editingRowID === row.id ? (
                        // <Box key={selectedTabIdx + row.id + "edit"} sx={{}}>
                        //   <Tooltip title="Cancel" placement="left">
                        //     <IconButton
                        //       color="error"
                        //       onClick={() => {
                        //         cancelEditRow(row, table);
                        //       }}
                        //     >
                        //       <CloseIcon />
                        //     </IconButton>
                        //   </Tooltip>
                        //   <br />
                        //   <Tooltip title="Save" placement="left">
                        //     <IconButton
                        //       color="primary"
                        //       // onClick={handleSaveRow}
                        //       onClick={(e) => {
                        //         // Access onEditingRowSave and pass necessary data
                        //         handleSaveRow(cell, row, table, e);
                        //       }}
                        //     >
                        //       <SaveIcon />
                        //     </IconButton>
                        //   </Tooltip>
                        // </Box>
                        // ) : (

                        return (
                          <Box key={selectedTabIdx + row.id + "edit"} sx={{}}>
                            <Tooltip title="Edit" placement="left">
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  table.setEditingRow(row);
                                  // setEditingRowID(row.id);
                                  // setEditingRow(true);
                                  // editRow(row, table); If you have additional operations during editing
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <br />
                            <Tooltip title="Remove" placement="left">
                              <IconButton
                                color="error"
                                onClick={() => {
                                  handleClickRemoveOpen(row.original);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                            <Dialog
                              open={removeOpen}
                              onClose={handleRemoveClose}
                            >
                              <DialogTitle>Confirm Removal</DialogTitle>
                              <DialogContent>
                                <DialogContentText color="error">
                                  <Typography
                                    component="span"
                                    variant="inherit"
                                    sx={{ color: "red" }}
                                    onClick={() => {
                                      // tableData.splice(row.index, 1); //assuming simple data table
                                      // setTableData([...tableData]);
                                      handleClickRemoveOpen(row.original);
                                    }}
                                  >
                                    Remove
                                  </Typography>{" "}
                                  <b>
                                    {userName} - {userSelected}
                                  </b>
                                  ?
                                </DialogContentText>
                              </DialogContent>
                              <DialogActions>
                                <Button
                                  onClick={handleRemoveClose}
                                  color="primary"
                                >
                                  No
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleRemoveConfirm(userSelected)
                                  }
                                  color="primary"
                                  autoFocus
                                >
                                  Yes
                                </Button>
                              </DialogActions>
                            </Dialog>
                          </Box>
                        );
                      })(),
                    ],
                  })}
                  //pending users tab
                  {...(selectedTabIdx === 1 && {
                    renderRowActions: ({ cell, row, table }) => [
                      <Box key={selectedTabIdx + row.id + "approve"} sx={{}}>
                        <Tooltip title="Approve" placement="left">
                          <IconButton
                            color="success"
                            onClick={() => {
                              handleClickApproveOpen(row.original);
                            }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <br />
                        <Tooltip title="Remove" placement="left">
                          <IconButton
                            color="error"
                            onClick={() => {
                              // tableData.splice(row.index, 1); //assuming simple data table
                              // setTableData([...tableData]);
                              handleClickRemoveOpen(row.original);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>

                        <Dialog open={removeOpen} onClose={handleRemoveClose}>
                          <DialogTitle>Confirm Removal</DialogTitle>
                          <DialogContent>
                            <DialogContentText color="error">
                              <Typography
                                component="span"
                                variant="inherit"
                                sx={{ color: "red" }}
                                onClick={() => {
                                  // tableData.splice(row.index, 1); //assuming simple data table
                                  // setTableData([...tableData]);
                                  handleClickRemoveOpen(row.original);
                                }}
                              >
                                Remove
                              </Typography>{" "}
                              <b>
                                {userName} - {userSelected}
                              </b>
                              ?
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={handleRemoveClose} color="primary">
                              No
                            </Button>
                            <Button
                              onClick={() => handleRemoveConfirm(userSelected)}
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
                                onClick={() => {
                                  // tableData.splice(row.index, 1); //assuming simple data table
                                  // setTableData([...tableData]);
                                  handleClickApproveOpen(row.original);
                                }}
                              >
                                Approve
                              </Typography>{" "}
                              <b>
                                {userName} - {userSelected}
                              </b>
                              ?
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <Button
                              onClick={handleApproveClose}
                              color="primary"
                            >
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
                      </Box>,
                    ],
                  })}
                  enableDensityToggle={false} //density does not work with memoized cells
                  memoMode="cells" // memoize table cells to improve render performance, but break some features
                  enableBottomToolbar={true}
                  enableGlobalFilterModes={true}
                  enablePagination={true}
                  enableColumnResizing={true}
                  editingMode="modal" //modal is default
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
            </>
          )}
        </Grid>
      </>
    );
  } else {
    return;
  }
}
