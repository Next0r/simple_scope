const SerialPort = require("serialport");
const gui = require("./gui");
const multiThreading = require("./multi-threading");
const SerialDataProcessorMessage = require("./serial-data-processor-message");

const simpleScope = {
  /**
   * @type {SerialPort}
   */
  _port: undefined,
  _dataBuffer: [],
  _chunkSize: 256,
  _serialDataProcessor: undefined,
  _lastSampleTime: 0,

  _setConnectEvent() {
    gui.events.onConnectClick = () => {
      return new Promise((resolve) => {
        const baudRate = gui.getBaudRate();
        const path = gui.getSelectedPort();

        this._port = new SerialPort(path, { baudRate: baudRate }, (err) => {
          if (err) {
            console.warn(err.message);
            resolve(false);
          }
        });

        this._port.on("close", (err) => {
          if (err) {
            console.warn(err.message);
          }
          gui.fakeDisconnectClick();
        });

        this._port.on("data", (data) => {
          this._dataBuffer.push(...data);

          // send chunk of serial port data for processing to child process
          if (this._dataBuffer.length >= this._chunkSize) {
            this._serialDataProcessor.send(
              new SerialDataProcessorMessage({
                serialData: this._dataBuffer,
                referenceVoltage: gui.getReferenceVoltage(),
              })
            );
            this._dataBuffer = [];
          }
        });

        this._port.on("open", (err) => {
          if (err) {
            console.warn(err.message);
            resolve(false);
          }

          console.log(`Connected to port ${path}`);
          resolve(true);
        });
      });
    };
  },

  _setDisconnectEvent() {
    gui.events.onDisconnectClick = async () => {
      return new Promise((resolve) => {
        if (!this._port) {
          console.warn("Connection not established");
          resolve(true);
        }

        this._port.close((err) => {
          if (err) {
            console.warn(err.message);
            resolve(false);
          }

          console.log(`Disconnected from port ${this._port.path}`);
          resolve(true);
        });
      });
    };
  },

  _setScanPortsEvent() {
    gui.events.onScanPortsClick = async () => {
      const ports = await SerialPort.list();

      const paths = [];

      for (let port of ports) {
        paths.push(port.path);
      }

      return paths;
    };
  },

  /**
   * @param {SerialDataProcessorMessage} message
   */
  _processSerialDataProcessorMessage(message) {
    if (!message.voltages) {
      return;
    }

    const voltageASample = message.voltages[0];
    const voltageBSample = message.voltages[1];

    this._lastSampleTime = new Date().getTime();

    gui.setVoltage(voltageASample[0]);
    gui.setVoltageMax(voltageBSample[0]);
  },

  _startSerialDataProcessor() {
    this._serialDataProcessor = multiThreading.createSerialDataProcessor();
    this._serialDataProcessor.on("message", (message) => {
      this._processSerialDataProcessorMessage(message);
    });
  },

  main() {
    gui.init();
    this._startSerialDataProcessor();
    this._setScanPortsEvent();
    this._setDisconnectEvent();
    this._setConnectEvent();
  },
};

simpleScope.main();
