const SerialPort = require("serialport");
const gui = require("./gui");
const multiThreading = require("./multi-threading");
const SerialDataProcessorMessage = require("./serial-data-processor-message");
const hampel = require("./hampel");
const calculatePower = require("./calculate-power");

const simpleScope = {
  /**
   * @type {SerialPort}
   */
  _port: undefined,
  _dataBuffer: [],
  _chunkSize: 256,
  _serialDataProcessor: undefined,
  _lastSampleTime: 0,
  _lastVoltageSamples: undefined,
  _chartsUpdateIntervalHandler: undefined,
  _chartsUpdateInterval: 1000,
  _acs723VoltPerAmpere: 0.4,

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

  _createVoltageData(voltageSamples = []) {
    const opAmpOffset = gui.getHalfOffset()
      ? gui.getReferenceVoltage() * 0.5
      : gui.getOffsetVoltage();
    const referenceACVoltage = gui.getACVoltageReference();
    const useGain = gui.getUseGain();
    const timeStep = 1 / gui.getMCUSamplingSpeed(); // ms per sample
    const gain = gui.getOpAmpGain();

    let samples = voltageSamples;
    if (gui.getUseFilter()) {
      samples = hampel(voltageSamples, { nSigmas: 3 });
    }

    const voltageData = [];
    const voltageDataRaw = [];
    let voltageMax = samples[0];
    let voltageMin = samples[0];

    if (useGain) {
      samples.forEach((sample, index) => {
        const realVoltageValue = (sample - opAmpOffset) / gain;

        voltageDataRaw.push(realVoltageValue);
        voltageData.push({ value: [index * timeStep, realVoltageValue] });

        if (sample < voltageMin) {
          voltageMin = sample;
        } else if (sample > voltageMax) {
          voltageMax = sample;
        }
      });

      voltageMin = (voltageMin - opAmpOffset) / gain;
      voltageMax = (voltageMax - opAmpOffset) / gain;
    } else {
      samples.forEach((sample) => {
        if (sample < voltageMin) {
          voltageMin = sample;
        } else if (sample > voltageMax) {
          voltageMax = sample;
        }
      });

      const neutral = (voltageMax + voltageMin) / 2;
      voltageMax -= neutral;
      const voltagePeak = referenceACVoltage * Math.sqrt(2);

      samples.forEach((sample, index) => {
        const realVoltageValue = ((sample - neutral) / voltageMax) * voltagePeak;

        voltageDataRaw.push(realVoltageValue);
        voltageData.push({ value: [index * timeStep, realVoltageValue] });
      });

      voltageMin = -voltagePeak;
      voltageMax = voltagePeak;
    }

    return { voltageData, voltageDataRaw, voltageMin, voltageMax };
  },

  _createCurrentData(voltageSamples = []) {
    const timeStep = 1 / gui.getMCUSamplingSpeed(); // ms per sample
    const voltPerAmpere = this._acs723VoltPerAmpere;

    let samples = voltageSamples;
    if (gui.getUseFilter()) {
      samples = hampel(voltageSamples, { nSigmas: 3 });
    }

    const currentData = [];
    const currentDataRaw = [];

    let min = samples[0];
    let max = samples[0];

    samples.forEach((sample, index) => {
      if (sample < min) {
        min = sample;
      } else if (sample > max) {
        max = sample;
      }
    });

    const center = (min + max) * 0.5;

    samples.forEach((sample, index) => {
      const realCurrentValue = (sample - center) / voltPerAmpere;

      currentDataRaw.push(realCurrentValue);
      currentData.push({
        value: [index * timeStep, realCurrentValue],
      });
    });

    const currentMin = (min - center) / voltPerAmpere;
    const currentMax = (max - center) / voltPerAmpere;

    return { currentData, currentDataRaw, currentMin, currentMax };
  },

  _setChartsUpdateInterval() {
    this._chartsUpdateIntervalHandler = setInterval(() => {
      if (this._lastVoltageSamples) {
        const voltageData = this._createVoltageData(this._lastVoltageSamples[0]);

        gui.updateVoltageChart(voltageData.voltageData);
        gui.setVoltageMin(voltageData.voltageMin.toFixed(2));
        gui.setVoltageMax(voltageData.voltageMax.toFixed(2));
        gui.setVoltage(
          (((voltageData.voltageMax - voltageData.voltageMin) * 0.5) / Math.sqrt(2)).toFixed(2)
        );

        const currentData = this._createCurrentData(this._lastVoltageSamples[1]);

        gui.updateCurrentChart(currentData.currentData);
        gui.setCurrentMin(currentData.currentMin.toFixed(3));
        gui.setCurrentMax(currentData.currentMax.toFixed(3));
        gui.setCurrent((currentData.currentMax / Math.sqrt(2)).toFixed(3));

        console.log(calculatePower(voltageData.voltageDataRaw, currentData.currentDataRaw));
      }
    }, this._chartsUpdateInterval);
  },

  /**
   * @param {SerialDataProcessorMessage} message
   */
  _processSerialDataProcessorMessage(message) {
    if (!message.voltages) {
      return;
    }

    this._lastVoltageSamples = message.voltages;

    // const voltageASample = message.voltages[0];
    // const voltageBSample = message.voltages[1];

    this._lastSampleTime = new Date().getTime();

    // gui.setVoltage(voltageASample[0]);
    // gui.setVoltageMax(voltageBSample[0]);
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
    this._setChartsUpdateInterval();
  },
};

simpleScope.main();
