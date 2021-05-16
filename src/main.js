const SerialPort = require("serialport");
const gui = require("./gui");
const multiThreading = require("./multi-threading");

const main = async () => {
  const serialDataProcessor = multiThreading.createSerialDataProcessor();

  let voltageSample = [];
  let voltSampleTimeStart = new Date().getTime();
  let voltSampleTimeEnd = new Date().getTime();

  serialDataProcessor.on("message", (message) => {
    if (message.data) {
      gui.setVoltage(message.data[0]);
      voltageSample = message.data;
      voltSampleTimeStart = voltSampleTimeEnd;
      voltSampleTimeEnd = new Date().getTime();
    }
  });

  setInterval(() => {
    const chartData = [];
    const sampleSize = voltageSample.length;
    const timeStep = (voltSampleTimeEnd - voltSampleTimeStart) / sampleSize;

    gui.setSamplesPerSec(
      (sampleSize / (voltSampleTimeEnd - voltSampleTimeStart)) * 1000
    );

    for (let i = 0; i < sampleSize - 1; i += 1) {
      chartData.push({
        value: [timeStep * i, voltageSample[i]],
      });
    }

    gui.updateChart(chartData);
  }, 1000);

  gui.init();

  gui.events.onScanPortsClick = async () => {
    const ports = await SerialPort.list();

    const paths = [];

    for (let port of ports) {
      paths.push(port.path);
    }

    return paths;
  };

  /**
   * @type {SerialPort}
   */
  let port = null;

  gui.events.onDisconnectClick = () => {
    return new Promise((resolve, reject) => {
      if (port === null) {
        reject(false);
      }

      port.close((err) => {
        if (err) {
          console.log(err.message);
          reject(false);
        }

        console.log(`Disconnected from port ${port.path}`);

        resolve(true);
      });
    });
  };

  let recBuffer = [];
  const chunkSize = 256;

  gui.events.onConnectClick = () => {
    return new Promise((resolve, reject) => {
      const baudRate = gui.getBaudRate();
      const path = gui.getSelectedPort();

      port = new SerialPort(path, { baudRate: baudRate });

      port.on("data", (data) => {
        recBuffer.push(...data);

        if (recBuffer.length >= chunkSize) {
          serialDataProcessor.send({ serialPortData: recBuffer });
          recBuffer = [];
        }
      });

      port.on("open", (err) => {
        if (err) {
          console.log(err.message);
          reject(false);
        }

        console.log(`Connected to port ${path}`);

        resolve(true);
      });
    });
  };
};

main();
