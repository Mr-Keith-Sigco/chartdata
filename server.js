const express = require("express");
const app = express();
const port = 3000;
const XLSX = require("xlsx");
var cors = require("cors");
const _ = require("lodash");

app.use(cors());

function formatDate(dateStr) {
  const dateParts = dateStr.split("/");

  const year = parseInt(dateParts[2]);
  const month = parseInt(dateParts[1]) - 1; // Months are zero-based
  const day = parseInt(dateParts[0]);

  const formattedDate = new Date(year, month, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return formattedDate;
}

// Read the data from the Excel file
const workbook = XLSX.readFile("raw_data.xlsx");

// Define the data object
const data = {
  dataProviders: {
    generalDataProviders: [],
  },
};
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet);

const handledData1 = _.groupBy(rawData, "Mã hàng (*)");
Object.keys(handledData1).forEach((key) => {
  handledData1[key] = _.groupBy(handledData1[key], "Ngày đơn hàng (*)");
});
Object.keys(handledData1).forEach((key) => {
  Object.keys(handledData1[key]).forEach((date) => {
    handledData1[key][date] = {
      sku: key,
      Date: formatDate(date),
      Name: handledData1[key][date][0]["Tên hàng"],
      Open: handledData1[key][date][0]["Đơn giá"],
      Close:
        handledData1[key][date][handledData1[key][date].length - 1]["Đơn giá"],
      High: _.maxBy(handledData1[key][date], "Đơn giá")["Đơn giá"],
      Low: _.minBy(handledData1[key][date], "Đơn giá")["Đơn giá"],
      Volume: _.sumBy(handledData1[key][date], "Số lượng"),
    };
  });
});

Object.keys(handledData1).forEach((key) => {
  handledData1[key] = Object.values(handledData1[key]);
});
const handledData2 = Object.values(handledData1).map((item, index) => {
  return {
    Name: item[0].Name,
    id: item[0].sku,
    data: item.map((data) => {
      return {
        Date: data.Date,
        Close: data.Close,
        Open: data.Open,
        High: data.High,
        Low: data.Low,
        Volume: data.Volume,
      };
    }),
  };
});

// Log to console
console.log(handledData2);

// Loop through each sheet in the workbook
workbook.SheetNames.forEach((sheetName) => {
  // Get the worksheet
  // const worksheet = workbook.Sheets[sheetName];

  // Convert the worksheet to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Extract the column headers
  const headers = jsonData.shift();

  // Create the dataset object
  const dataset = {
    dataSet: sheetName,
    id: `dp${data.dataProviders.generalDataProviders.length + 1}`,
    data: [],
  };

  // Loop through the rows to populate the data
  jsonData.forEach((row) => {
    const rowData = {
      Date: row[0],
      Price: row[1],
      Open: row[2],
      High: row[3],
      Low: row[4],
      Volume: row[5],
    };

    dataset.data.push(rowData);
  });

  // Add the dataset to the data object
  data.dataProviders.generalDataProviders.push(dataset);
});

app.get("/get-all-sku", (req, res) => {
  if (!_.isEmpty(handledData2)) {
    const result = handledData2.map((item) => {
      return {
        name: item.Name,
        id: item.id,
      };
    });
    res.json(result);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Define a route to handle filtered data
app.get("/filter", (req, res) => {
  // Get the requested SKU from the client request
  const requestedSKU = req.query.sku;

  if (requestedSKU) {
    // Find the matching dataset in the data object
    const matchingDataset = handledData2.find(
      (dataset) => dataset.id === requestedSKU
    );

    if (matchingDataset) {
      // Extract the data from the matching dataset
      const datasetData = matchingDataset.data;

      // Format the data in the desired format
      const formattedData = datasetData.map((item) => [
        item.Date,
        item.Open,
        item.High,
        item.Low,
        item.Close,
        item.Volume,
      ]);

      // Return the formatted data
      res.json(formattedData);
    } else {
      // Dataset not found, return an error message
      res.status(404).json({ error: "DataSet not found" });
    }
  } else {
    // Invalid or missing SKU, return an error message
    res.status(400).json({ error: "Invalid SKU" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
