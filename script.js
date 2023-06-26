// Get the menu button and the navbar
const menuButton = document.getElementById("menu-btn");
const navbar = document.querySelector(".header .navbar");

// Add click event listener to the menu button
menuButton.addEventListener("click", function () {
  // Toggle the 'active' class on the navbar
  navbar.classList.toggle("active");
});

// Get all the menu items
const menuItems = navbar.querySelectorAll("ul li a");

// Add click event listener to each menu item
menuItems.forEach(function (menuItem) {
  menuItem.addEventListener("click", function () {
    // Check if the navbar has the 'active' class
    if (navbar.classList.contains("active")) {
      // Remove the 'active' class to close the navbar
      navbar.classList.remove("active");
    }
  });
});

anychart.onDocumentReady(function () {
  var skuSelect = document.getElementById("skuSelect");
  var chart = null; // Reference to the chart
  var fallingFill = "rgb(242, 54, 69)";
  var fallingStroke = "black";
  var risingFill = "rgb(8, 153, 129)";
  var risingStroke = "black";

  // Function to fetch data from the server and update the chart
  function fetchDataAndUpdateChart(sku, selectedOptionText) {
    // fetch data from your server based on the selected SKU
    fetch("http://localhost:3000/filter?sku=" + sku)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log(data);

        var dataTable = anychart.data.table();
        dataTable.addData(data);

        console.log(dataTable);

        var mapping = dataTable.mapAs({
          open: 1,
          high: 2,
          low: 3,
          close: 4,
          volume: 5,
        });

        if (chart === null) {
          // Create the chart if it doesn't exist
          chart = anychart.stock();
          // chart.padding().right(60);
          // create plot on the chart
          // var plot = chart.plot(0);
          // enabled x-grid/y-grid
          // plot.xGrid(true).yGrid(true);
          // set orientation y-axis to the right side
          // plot.yAxis().orientation("right");
          var series = chart.plot(0).candlestick(mapping);
          // series.name("MILO RTD 12(4x180ml)");
          // chart.title("MILO RTD 12(4x180ml) ActivGo Ultra NR VN");
          chart.title(selectedOptionText); // Set the chart title using the selected option text
          series.name(selectedOptionText); // Set the series name using the selected option text

          // Set initial colors for rising and falling candles
          series.fallingFill(fallingFill);
          series.fallingStroke(fallingStroke);
          series.risingFill(risingFill);
          series.risingStroke(risingStroke);

          var indicatorPlot = chart.plot(1);
          indicatorPlot.height("20%");
          // volumeSeries.stroke("rgba(10, 70, 182, 0.8)");

          var volumeData = dataTable.mapAs({ value: 5 });

          var volumeSeries = indicatorPlot.column(volumeData);
          volumeSeries.name("Volume").zIndex(100).maxHeight("120%").bottom(0);
          volumeSeries.legendItem({
            iconEnabled: false,
            textOverflow: "",
          });
          var customScale = anychart.scales.linear(); // Use linear scale for volume
          volumeSeries.yScale(customScale);
          volumeSeries.risingStroke("black");
          volumeSeries.fallingStroke("black");
          volumeSeries.risingFill("rgba(10, 70, 182, 0.8)");
          volumeSeries.fallingFill("rgba(10, 70, 182, 0.8)");

          chart.container("container");
        } else {
          // Clear existing data and update the mapping
          chart.plot(0).removeAllSeries();
          var newSeries = chart.plot(0).candlestick(mapping);
          // newSeries.name("MILO");
          chart.title(selectedOptionText); // Set the chart title using the selected option text
          newSeries.name(selectedOptionText); // Set the new series name using the selected option text
          newSeries.fallingFill(fallingFill);
          newSeries.fallingFill(fallingFill);
          newSeries.fallingStroke(fallingStroke);
          newSeries.risingFill(risingFill);
          newSeries.risingStroke(risingStroke);
          // volumeSeries.stroke("rgba(10, 70, 182, 0.8)");

          // Remove the existing volume series
          // Remove the existing volume series
          chart.plot(1).removeAllSeries();
          var indicatorPlot = chart.plot(1);

          var volumeData = dataTable.mapAs({ value: 5 });
          var newVolumeSeries = indicatorPlot.column(volumeData);
          newVolumeSeries
            .name("Volume")
            .zIndex(100)
            .maxHeight("120%")
            .bottom(0);
          newVolumeSeries.legendItem({
            iconEnabled: false,
            textOverflow: "",
          });
          newVolumeSeries.risingStroke("black");
          newVolumeSeries.fallingStroke("black");
          newVolumeSeries.risingFill("rgba(10, 70, 182, 0.8)");
          newVolumeSeries.fallingFill("rgba(10, 70, 182, 0.8)");
        }

        // Set the scroller
        // chart.scroller().xAxis(false);
        // var openValue = dataTable.mapAs();
        // openValue.addField("value", 2);
        // chart.scroller().column(openValue);

        // Draw the chart
        chart.draw();
      });
  }

  // Initial fetch and chart setup
  var defaultSKU = "12517339";
  var defaultName = "MILO RTD 12(4x180ml) ActivGo Ultra NR VN";
  fetchDataAndUpdateChart(defaultSKU, defaultName);

  // Event listener for the SKU selection change
  skuSelect.addEventListener("change", function () {
    var selectedSKU = skuSelect.value;
    var selectedOptionText =
      skuSelect.options[skuSelect.selectedIndex].textContent; // Get the selected option text
    fetchDataAndUpdateChart(selectedSKU, selectedOptionText); // Pass the selected option text as an argument
  });
});

fetch("http://127.0.0.1:3000/get-all-sku")
  .then((response) => response.json())
  .then((data) => {
    // Process the data and create the select dropdown
    createSelectDropdown(data);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });

function createSelectDropdown(data) {
  // Sort the data array by name alphabetically
  data.sort((a, b) => a.name.localeCompare(b.name));
  // Get the select element by its ID
  const selectElement = document.getElementById("skuSelect");

  // Loop through the data and create options for the select dropdown
  data.forEach((option) => {
    // Create an option element
    const optionElement = document.createElement("option");
    optionElement.value = option.id;
    optionElement.textContent = option.name;

    // Append the option element to the select element
    selectElement.appendChild(optionElement);
  });
  // Set the default selection
  // selectElement.value = "12517339";
}
