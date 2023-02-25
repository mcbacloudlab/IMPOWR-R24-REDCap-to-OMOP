import { useState, useEffect, useMemo } from "react";
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import FormSelectTable from "./FormSelectTable";
import { ExportToCsv } from "export-to-csv";
import Paper from "@mui/material/Paper";

var XLSX = require("xlsx");
export default function FormSelect(props) {
  const [selectedForm, setSelectedForm] = useState("");
  const [data, setData] = useState();
  const [colDefs, setColDefs] = useState([]);
  const [approvedData, setApprovedData] = useState([]);
  const [csvFilename, setCSVFilename] = useState("");
  const [value, setValue] = useState(0);
  // const [fileList, setFileList] = useState([]);
  // const [fileLastMod, setFileLastMod] = useState([]);
  // const [getListError, setGetListError] = useState();
  const [addSSError, setaddSSError] = useState();
  const [open, setOpen] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingErr, setIsSavingErr] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // const [selectedFile, setSelectedFile] = useState(1);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const columns = useMemo(() => colDefs, [colDefs]);

  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    filename: csvFilename.replace(/\.[^/.]+$/, ""),
    showLabels: true,
    useBom: false,
    useKeysAsHeaders: false,
    headers: colDefs.map((c) => {
      return c.header;
    }),
  };
  const csvExporter = new ExportToCsv(csvOptions);

  console.log("formsel", props);
  //   const forms = ["bioinformatics_core_participants", "bioinformatics_core_activity_survey"];
  function getDataDictionary(event) {
    console.log("getdatadictionary", selectedForm);
    if (!selectedForm) setSelectedForm(props.forms[0]);
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + props.props.token);

    var FormData = require("form-data");
    var formdata = new FormData();
    formdata.append("form", selectedForm);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/redcap/exportMetadata`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        console.log(JSON.parse(result));
        importExcel(JSON.parse(result));
        // setIsFormLoaded(true)
      })
      .catch((error) => console.log("error", error));
  }

  useEffect(() => {
    console.log("the prop select", props.forms[0]);
    console.log("typeof", typeof props.forms[0]);
    setSelectedForm(props.forms[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.forms]);
  const handleChange = (event) => {
    console.log("handle change");
    setSelectedForm(event.target.value);
  };

  const handleSaveRow = async ({ exitEditingMode, row, values }) => {
    //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here.
    data[row.index] = values;
    //send/receive api updates here
    setData([...data]);
    saveFile();
    exitEditingMode(); //required to exit editing mode
  };

  function saveFile() {
    setIsSaving(true);
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + props.token);
    var raw = JSON.stringify({
      data: { fileName: csvFilename, fileData: data },
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      `${process.env.REACT_APP_BACKEND_API_URL}/api/file/save_data_dictionary`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        setSaveSuccess(true);
        setTimeout(function () {
          setSaveSuccess(false);
        }, 5000);

        setIsSaving(false);
        setIsSavingErr(false);
      })
      .catch((error) => {
        setIsSaving(false);
        setIsSavingErr(true);
        console.info("error", error);
      });
  }

  const handleExportData = () => {
    let _data = data;
    if (selectedTabIdx) {
      _data = approvedData; //change export data if on approved tab
    }
    let keys = _data.reduce(function (acc, obj) {
      Object.keys(obj).forEach(function (key) {
        if (!acc.includes(key)) acc.push(key);
      });
      return acc;
    }, []);

    _data.forEach(function (obj) {
      keys.forEach(function (key) {
        if (!obj[key]) obj[key] = "";
      });
    });

    csvExporter.generateCsv(_data);
  };

  function resetScreen() {
    setData("");
    setApprovedData("");
    setIsLoading(false);
    setCSVFilename("");
    // setSelectedFile("");
  }

  function importExcel(e) {
    // console.log('e',)
    const file = e;
    // setCSVFilename(file.name);

    const workSheet = XLSX.utils.json_to_sheet(file);
    //convert to array
    const fileData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
    const headers = fileData[0];

    const heads = headers.map((head) => ({
      accessorKey: head.replaceAll(".", ""),
      header: head.replaceAll(".", ""),
    }));
    setColDefs(heads);
    console.log("heads", heads);
    //removing header
    fileData.splice(0, 1);
    setData(convertToJson(headers, fileData));
    // setApprovedData(convertToJson(headers, fileData, true));
    setIsLoading(false);
    setIsFormLoaded(true);
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

  if (props.forms.length > 0) {
    return (
      <>
        <FormControl>
          <Grid item xs={12}>
            <InputLabel id="select-form-label">REDCap Forms</InputLabel>
            <Select
              labelId="select-form-label"
              label="REDCap Forms"
              id="select-form"
              value={selectedForm || (props.forms && props.forms[0])} // add a null check before accessing the array
              onChange={handleChange}
            >
              {props.forms.map((form) => (
                <MenuItem key={form} value={form}>
                  {form}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              component="label"
              startIcon={<AddIcon />}
              onClick={(e) => getDataDictionary(e)}
            >
              Import Data Dictionary
            </Button>
          </Grid>
        </FormControl>

        <Grid item xs={12} style={{ maxWidth: "90vw" }}>
          {isFormLoaded && (
            <>
              <FormSelectTable
                props={props}
                columns={columns}
                data={data}
                setSorting={setSorting}
                handleSaveRow={handleSaveRow}
                saveSuccess={saveSuccess}
                isSaving={isSaving}
                saveFile={saveFile}
                value={value}
                handleExportData={handleExportData}
                resetScreen={resetScreen}
              />
            </>
          )}
        </Grid>
      </>
    );
  }
}
