import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CompletedJobTable from "../components/CompletedJobTable";
import { ExportToCsv } from "export-to-csv";
import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

var XLSX = require("xlsx");
export default function CompletedJobsViewPage(props) {
  // console.log("complete view page", props);
  const [data, setData] = useState("");
  const [colDefs, setColDefs] = useState([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [jobId, setJobId] = useState();
  const [csvFilename, setCSVFilename] = useState("");

  const location = useLocation();
  let _jobId, _data, _jobName, _submittedBy;
  // console.log("location", location.state);
  if (location.state.jobId) {
    _jobId = location.state.jobId;
    _data = location.state.result;
    _jobName = location.state.jobName;
    _submittedBy = location.state.submittedBy;
  }
  let _dataObj;
  const columns = useMemo(() => colDefs, [colDefs]);

  useEffect(() => {
    if (_data) {
      if (_jobId) setJobId(_jobId);
      if (_data) buildTable(JSON.parse(_data));
    }
  }, [_data, _jobId]);

  function verifyRow(row) {
    // console.log("rowId", row.snomedID);
    const updatedData = _dataObj.map((item) => {
      if (item.redcapFieldLabel === row.redcapFieldLabel) {
        const updatedSubRows = item.subRows.map((subRow) => ({
          ...subRow,
          selected: subRow.snomedID === row.snomedID ? "true" : "false",
        }));
        return {
          ...item,
          selected: item.snomedID === row.snomedID ? "true" : "false",
          subRows: updatedSubRows,
        };
      }
      return item;
    });

    // console.log("updatedData", updatedData);
    _dataObj = updatedData;
    setData(updatedData);
    // setData(data)
  }

  function buildTable(data) {
    const result = [];
    let currentRedcapFieldLabel = null;
    let currentItem = null;

    data.forEach((item, index) => {
      if (item.redcapFieldLabel !== currentRedcapFieldLabel) {
        if (currentItem) {
          result.push(currentItem);
        }
        item.selected = "true";
        currentItem = { ...item, subRows: [] };
        currentRedcapFieldLabel = item.redcapFieldLabel;
      } else {
        currentItem.subRows.push({ ...item, selected: "false" });
      }

      if (index === data.length - 1) {
        result.push(currentItem);
      }
    });
    // console.log("result", result);
    // const headers = Object.keys(result[0])
    // .map((key, value) => {
    //   if (key === "similarity") {
    //     return {
    //       accessorKey: key.replace(/\./g, ""),
    //       header: key.replace(/\./g, ""),
    //       Cell: ({ cell }) =>
    //         cell.getValue().toLocaleString("en-US", {
    //           style: "percent",
    //           minimumFractionDigits: 2,
    //         }),
    //     };
    //   } else if (key === "selected") {
    //     return {
    //       accessorKey: key.replace(/\./g, ""),
    //       header: key.replace(/\./g, ""),
    //       Cell: ({ cell }) =>
    //         cell.getValue() === "false" ? (
    //           <Box sx={{
    //             // backgroundColor: "red"
    //             }}>
    //             <Button
    //               variant={"contained"}
    //               onClick={() => {
    //                 verifyRow(cell.row.original);
    //               }}
    //             >
    //               Prefer this one
    //             </Button>
    //           </Box>
    //         ) : (
    //           <Box sx={{
    //             // color: 'white',
    //             // backgroundColor: "darkGrey"
    //             }}>
    //             <Typography>
    //               <CheckIcon/>
    //               {/* <b>Preferred</b> */}
    //             </Typography>
    //           </Box>
    //         ),
    //     };
    //   } else if (key !== "subRows") {
    //     return {
    //       accessorKey: key.replace(/\./g, ""),
    //       header: key.replace(/\./g, ""),
    //     };
    //   } else return null;
    // })
    // .filter((header) => header !== null);
    const MyCell = ({ cell, row }) => {
      // console.log('row', row)
      // console.log('row depth', row.depth)

      return cell.getValue() === "false" ? (
        <Button
          variant={"contained"}
          onClick={() => {
            verifyRow(cell.row.original);
          }}
        >
          Prefer this one
        </Button>
      ) : (
        <Typography>
          <b>Preferred</b>
        </Typography>
      );
    };

    const cols = [
      {
        header: "Redcap Field Label",
        accessorKey: "redcapFieldLabel",
      },
      {
        header: "Snomed Text",
        accessorKey: "snomedText",
      },
      {
        header: "Snomed ID",
        accessorKey: "snomedID",
      },
      {
        header: "Similarity",
        accessorKey: "similarity",
        Cell: ({ cell }) =>
          cell.getValue().toLocaleString("en-US", {
            style: "percent",
            minimumFractionDigits: 2,
          }),
      },
      {
        header: "Selected",
        accessorKey: "selected",
        //you can access a row instance in column definition option callbacks like this

        Cell: MyCell,
        sx: {
          "& .MuiButton-root": {
            backgroundColor: "blue",
            color: "white",
          },
          "& .MuiTypography-root": {
            color: "green",
          },
          "& .subrow": {
            backgroundColor: "yellow",
          },
        },
      },
    ];

    // console.log("headers", cols);
    setColDefs(cols);
    // console.log("set data", result);
    _dataObj = result;
    setData(result);
    setCSVFilename(`Completed_Job_${_jobId}.csv`);
    setIsFormLoaded(true);
  }

  const handleExportData = () => {
    let _data = data;
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

    csvExporter.generateCsv(_data);
  };

  function resetScreen() {
    setData("");
    setIsFormLoaded(false);
    setJobId();
  }

  return (
    <>
      <Container component="main" maxWidth="90%">
        {/* <CssBaseline /> */}
        <div style={{ textAlign: "left" }}>
          <span
            style={{ display: "flex", alignItems: "center", padding: "10px" }}
          >
            <span style={{ marginRight: "10px" }}>
              <b>Job Name:</b> {_jobName}
            </span>
            <span style={{ marginRight: "10px" }}>
              <b>Completed Job ID:</b> {jobId}
            </span>
            <span style={{ marginRight: "10px" }}>
              <b>Submitted By:</b> {_submittedBy}
            </span>
          </span>
        </div>
        {isFormLoaded && (
          <CompletedJobTable
            props={props}
            columns={columns}
            data={data}
            handleExportData={handleExportData}
            resetScreen={resetScreen}
          />
        )}
      </Container>
    </>
  );
}
