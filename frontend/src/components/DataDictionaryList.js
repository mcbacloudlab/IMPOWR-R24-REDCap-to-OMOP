import { useState, useEffect, useRef } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
// import Cookies from "js-cookie";
// import { Typography } from "@mui/material";
// import Box from "@mui/material/Box";
// import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { Alert } from "@mui/material";
// import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
// import SaveIcon from "@mui/icons-material/Save";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
// import IconButton from "@mui/material/IconButton";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import FolderIcon from "@mui/icons-material/Folder";
// import DeleteIcon from "@mui/icons-material/Delete";
// import { Select, MenuItem } from "@mui/material";
var XLSX = require("xlsx");

export default function DataDictionaryList(props) {
  console.log("ddlistprops", props);
  const [colDefs, setColDefs] = useState([]);
  const [data, setData] = useState([]);
  const [approvedData, setApprovedData] = useState([]);
  const [csvFilename, setCSVFilename] = useState("");
  const [value, setValue] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [fileLastMod, setFileLastMod] = useState([]);
  const [getListError, setGetListError] = useState();
  const [addSSError, setaddSSError] = useState();
  const [open, setOpen] = useState(false);
  // const [sorting, setSorting] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);
  // const [isSavingErr, setIsSavingErr] = useState(false);
  // const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(1);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const uploadInputRef = useRef(null);

  function getFileList() {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.token);
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/get_data_dictionary_list`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        let resultFiles = [];
        let resultFilesLastMod = [];
        if (result.length) {
          result.map((value) => {
            resultFiles.push(value.fileName);
            resultFilesLastMod.push(value.lastModified);
            return result;
          });
        }
        setFileList(resultFiles);
        setFileLastMod(resultFilesLastMod);
        setGetListError("");
      })
      .catch((error) => {
        console.error("error", error);
        setGetListError("Error occurred.");
      });
  }

  function getFile(e, value, switching, panelIndex) {
    setIsLoading(true);
    setSelectedFile(value);
    if (!panelIndex) panelIndex = 0;
    setSelectedTabIdx(panelIndex);
    if (!switching) handleChange(e, 0); //reset tab to default tab
    var formdata = new FormData();
    formdata.append("file", value);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.token);
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/get_data_dictionary`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setIsLoading(false);
        setData("");
        setApprovedData("");
        importExcel(JSON.parse(result));
      })
      .catch((error) => {
        setIsLoading(false);
        setaddSSError("Upload Error");
        setOpen(true);
        console.error("error", error);
      });
  }

  function ListItemTextC(fileListMod, index) {
    return (
      <ListItemText
        primary={fileListMod}
        primaryTypographyProps={{
          style: { whiteSpace: "normal", wordWrap: "break-word" },
        }}
        secondary={"Last Save:" + fileLastMod[index]}
      />
    );
  }

  const uploadDD = (e) => {
    var formdata = new FormData();
    let fileInput = e.target;
    formdata.append("dataFile", fileInput.files[0]);

    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.token);
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/add_data_dictionary`,
      requestOptions
    )
      .then((response) => {
        if (response.ok) response.text();
        else throw new Error("Upload error");
      })
      .then((result) => {
        getFileList();
        setaddSSError("");
        e.target.value = null;
      })
      .catch((error) => {
        setaddSSError(error);
        setOpen(true);
        console.info("error", error);
        e.target.value = null;
      });
  };

  useEffect(() => {
    getFileList();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  function importExcel(e) {
    const file = e.data;
    setCSVFilename(file.name);

    const workSheet = XLSX.utils.json_to_sheet(file.data);
    //convert to array
    const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
    const headers = fileData[0];

    const heads = headers.map((head) => ({
      accessorKey: head.replaceAll(".", ""),
      header: head.replaceAll(".", ""),
    }));
    setColDefs(heads);
    //removing header
    fileData.splice(0, 1);
    setData(convertToJson(headers, fileData));
    setApprovedData(convertToJson(headers, fileData, true));
    setIsLoading(false);
  }
  const convertToJson = (headers, data, approved) => {
    const rows = [];
    let approvedIdx = headers.indexOf("Approved");
    data.forEach((row) => {
      let rowData = {};
      row.forEach((element, index) => {
        if (approved) {
          if (row[approvedIdx] === "Y") {
            rowData[headers[index]] = element;
          }
        } else {
          rowData[headers[index]] = element;
        }
      });
      if (Object.keys(rowData).length !== 0) {
        rows.push(rowData);
      }
    });
    return rows;
  };

  return (
    <>
      <Button
        variant="contained"
        component="label"
        startIcon={<AddIcon />}
        onClick={() => uploadInputRef.current && uploadInputRef.current.click()}
      >
        Add Data Dictionary
        <input
          id="fileUpload"
          // onChange={(e)=>{importExcel(e)}}
          onChange={uploadDD}
          type="file"
          hidden
        />
      </Button>
      {getListError
        ? ""
        : fileList
        ? fileList.map((value, index) => {
            return (
              <ListItem key={value}>
                <ListItemButton
                  selected={selectedFile === value}
                  onClick={(event) => getFile(event, value)}
                >
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  {ListItemTextC(value, index)}
                </ListItemButton>
                <ListItemSecondaryAction>
                  {/* <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={(event) => deleteFile(event, value)}
                              >
                                <DeleteIcon />
                              </IconButton> */}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })
        : ""}
    </>
  );
}
