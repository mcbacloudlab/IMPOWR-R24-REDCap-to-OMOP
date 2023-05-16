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
// import PlaylistAddCheckSharpIcon from "@mui/icons-material/PlaylistAddCheckSharp";
// import ErrorIcon from "@mui/icons-material/Error";
// import AddTaskIcon from "@mui/icons-material/AddTask";
// import { MenuItem } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { useTheme } from '@mui/material/styles';

// import CheckIcon from "@mui/icons-material/Check";
// import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

export default function MyAccountUserManagement(props) {
  let propsUserObj = JSON.parse(props.props.props.user);
  let propsToken = props.props.props.token;
  const theme = useTheme();
  const [tableData, setTableData] = useState([]);
  // const [allUsers, setAllUsers] = useState();
  const [approvedUsers, setApprovedUsers] = useState();
  const [pendingUsers, setPendingUsers] = useState();
  const [colDefs, setColDefs] = useState();
  const [open, setOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [userSelected, setUserSelected] = useState("");
  const [userName, setUsername] = useState();
  const [loading, setLoading] = useState(true);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  // const [allUsersCount, setAllUsersCount] = useState();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [approvedUsersCount, setApprovedUsersCount] = useState(0);
  const [editingRow, setEditingRow] = useState(false);
  const [editingRowID, setEditingRowID] = useState();

  const handleChange = (event, newValue) => {
    setSelectedTabIdx(newValue);
  };

  useEffect(() => {
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
        header: "Email / ORCID",
        accessorKey: "email",
      },
      {
        header: "Role",
        accessorKey: "role",
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
        // setAllUsers(jsonData);
        setSelectedTabIdx(selectedTabIdx);
        // setAllUsersCount(jsonData.length);
        // console.log('selectedTabidx', selectedTabIdx)
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
    console.log("handle click remove open");
    setUserSelected(userId.email);
    setUsername(userId.firstName + " " + userId.lastName);
    setOpen(true);
  };

  const handleClickApproveOpen = (userId) => {
    setUserSelected(userId.email);
    setUsername(userId.firstName + " " + userId.lastName);
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

  const handleRemoveConfirm = (jobId) => {
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
    // setIsLoading(true);
    // setSelectedFile(value);
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

  const handleSaveRow = async (cell, row, table) => {
    console.log("save row", row);
    console.log(row._valuesCache);

    // If the row doesn't have an index, something is wrong
    if (row.index === undefined) {
      console.error("Row has no index:", row);
      return;
    }

    // setTableData((prevTableData) => {
    //   // Make a new copy of the array
    //   const newTableData = [...prevTableData];

    //   // Replace the original data at the correct index
    //   newTableData[row.index] = row._valuesCache;

    //   // Return the new array
    //   return newTableData;
    // });
    table.setEditingRow(null); // Clear the editingRow
    setEditingRow(false);
  };

  // const editRow = (row, table) => {
  //   // console.log("editing row", row);
  //   // console.log("table", table);
  //   setEditingRow(true);
  // };

  const cancelEditRow = (row, table) => {
    // console.log("editing row", row);
    // console.log("table", table);
    table.setEditingRow(null); // Clear the editingRow
    setEditingRow(false);
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
            Manage User Accounts
          </h1>
        </Grid>
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
                  backgroundColor: selectedTabIdx === 0 ? theme.palette.secondary.main : "inherit",
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
                      <Badge
                        badgeContent={approvedUsersCount}
                        max={9999}
                        color="secondary"
                      />
                    </Box>
                  </Box>
                }
                {...a11yProps(0)}
              />
              <br />
              <Tab
                onClick={(event) => showTab(event, true, 1)}
                style={{
                  backgroundColor: selectedTabIdx === 1 ? theme.palette.secondary.main : "inherit",
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
          </Grid>
          {!loading && (
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
                    // console.log("editingRow:", editingRowID);
                    // console.log("row:", row.id);
                    // console.log('editingrow', editingRow)
                    return editingRow && editingRowID === row.id ? (
                      <Box key={selectedTabIdx + row.id + "edit"} sx={{}}>
                        <Tooltip title="Cancel" placement="left">
                          <IconButton
                            color="error"
                            onClick={() => {
                              cancelEditRow(row, table);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                        <br />
                        <Tooltip title="Save" placement="left">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              // Access onEditingRowSave and pass necessary data
                              handleSaveRow(cell, row, table);
                            }}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box key={selectedTabIdx + row.id + "edit"} sx={{}}>
                        <Tooltip title="Edit" placement="left">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              table.setEditingRow(row);
                              setEditingRowID(row.id);
                              setEditingRow(true);
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
                  </Box>,
                ],
              })}
              enableDensityToggle={false} //density does not work with memoized cells
              memoMode="cells" // memoize table cells to improve render performance, but break some features
              enableBottomToolbar={true}
              enableGlobalFilterModes={true}
              enablePagination={true}
              enableColumnResizing={true}
              editingMode="row" //modal is default
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
          )}     
          
        </Grid>
      </>
    );
  } else {
    return;
  }
}
