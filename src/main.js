const SerialPort = require("serialport");
const path = require("path");
const { fork } = require("child_process");

const childProcess = fork(path.join(__dirname, "serial-data-processor.js"));


childProcess.on("exit", (code) => {
  console.log(`Child process exited with code ${code}`);
});

process.on("beforeExit", () => {
  childProcess.kill();
});

childProcess.on("error", (err) => {
  console.log(err.message);
});

const readingsBuffer = [];

childProcess.on("message", (message) => {
  if (message.info) {
    return console.log(message.info);
  }

  const readings = message.readings;

  console.log(`Received ${readings.length} processed values.`);

  document.querySelector("#voltage").textContent = readings[0];
});

const addPortSelectOption = (value = "COM1") => {
  const selectElement = document.querySelector("#select-port-list");

  const option = document.createElement("option");
  option.value = value;
  option.innerText = value;

  selectElement.appendChild(option);
};

const clearPortSelectElement = () => {
  document.querySelector("#select-port-list").innerHTML = "";
};

const enableConnectButton = () => {
  document.querySelector("#connect-button").removeAttribute("disabled");
};

const disableConnectButton = () => {
  document.querySelector("#connect-button").setAttribute("disabled", "true");
};

const enableBuadRateInput = () => {
  document.querySelector("#baud-rate").removeAttribute("disabled");
};

const disableBuadRateInput = () => {
  document.querySelector("#baud-rate").setAttribute("disabled", "true");
};

const enableDisconnectButton = () => {
  document.querySelector("#disconnect-button").removeAttribute("disabled");
};

const disableDisconnectButton = () => {
  document.querySelector("#disconnect-button").setAttribute("disabled", "true");
};

document
  .querySelector("#scan-ports-button")
  .addEventListener("click", async () => {
    const ports = await SerialPort.list();

    if (ports.length < 0) {
      return;
    }

    enableConnectButton();
    enableBuadRateInput();
    clearPortSelectElement();

    for (let port of ports) {
      addPortSelectOption(port.path);
    }
  });

/**
 * @type {SerialPort}
 */
let portConnected = null;

document.querySelector("#disconnect-button").addEventListener("click", () => {
  if (portConnected === null) {
    return;
  }

  portConnected.close((err) => {
    if (err) {
      return console.log(err.message);
    }
  });

  enableBuadRateInput();
  enableConnectButton();
  disableDisconnectButton();
});

document.querySelector("#connect-button").addEventListener("click", () => {
  const portName = document.querySelector("#select-port-list").value;
  const baudRate = document.querySelector("#baud-rate").value;

  const port = new SerialPort(portName, { baudRate: parseInt(baudRate) });

  port.on("open", (err) => {
    if (err) {
      return console.log(err.message);
    }

    disableConnectButton();
    disableBuadRateInput();

    enableDisconnectButton();

    portConnected = port;
  });

  let recBuffer = [];

  port.on("data", (data) => {
    recBuffer.push(...data);

    if (recBuffer.length >= 256) {
      childProcess.send({ serialPortData: recBuffer });
      console.log(`Sending chunk of size ${recBuffer.length}B`);

      recBuffer = [];
    }
  });
});

// const worker = new Worker(path.join(__dirname, "serial-data-processor.js"));

// worker.postMessage({ serialData: [1, 2, 3, 4, 5] });

// worker.on("message", (message) => {
//   console.log(message);
// });

// const Chart = require("chart.js").Chart;

// const canvas = document.querySelector("#my-chart");
// scope.setCanvas(canvas);

// scope.setYLabels(["0", "1", "2", "3", "4", "5"]);
// scope.setLabelsXOffset(-5);
// scope._drawLabels();
// scope._drawLine();

// const port = new SerialPort("COM3", { baudRate: 9615 }, (err) => {
//   if (err) {
//     return console.log(err.message);
//   }
// });

// port.open((err) => {
//   if (err) {
//     return console.log(err.message);
//   }
// });

// const sampleSpeed = 122; // 100 samples per sec
// const timeRange = 10; // 10 sec capture

// const chartData = [];

// // resize data buffer to sample speed * time range
// for (let i = 0; i < sampleSpeed * timeRange; i += 1) {
//   chartData.push(0);
// }

// let labels = [];
// for (let i = 0; i < chartData.length; i += 1) {
//   labels.push(i / sampleSpeed);
// }

// // create chart
// const ctx = document.getElementById("my-chart").getContext("2d");

// let chart = new Chart(ctx, {
//   type: "line",
//   data: {
//     labels: labels,
//     datasets: [
//       {
//         label: "Chart ",
//         data: chartData,
//       },
//     ],
//   },
//   options: {
//     scales: {
//       x: {
//         type: "linear",
//         position: "bottom",
//       },
//     },
//     // animation: false,
//     spanGaps: true,
//   },
// });

// let recBuffer = [];

// port.on("data", (data) => {
//   recBuffer.push(...data);

//   while (recBuffer.length > 3) {
//     if (recBuffer[0] === 0x0a) {
//       const result = ((recBuffer[1] | (recBuffer[2] << 8)) / 4096) * 5;

//       chartData.push(result);
//       chartData.shift();

//       //   chart.data.datasets[0].data = chartData;
//       //   chart.update();

//       recBuffer = recBuffer.slice(3);

//       //   console.log(result);
//     } else {
//       console.log("ERROR!");
//       recBuffer.shift();
//     }

//     // console.log(chartData[1000]);
//   }
// });

// setInterval(() => {
//   chart.data.datasets[0].data = new Array(...chartData);
//   chart.update();
// }, 100);
