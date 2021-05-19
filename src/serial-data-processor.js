const SerialDataProcessorMessage = require("./serial-data-processor-message");

const serialDataProcessor = {
  _dataBuffer: [],
  _frameHeaders: [0x0a, 0x0b, 0x0c, 0x0d],

  _parseVoltageBytes(byteL = 0, byteH = 0, referenceVoltage = 5, adcResolution = 4096) {
    return ((byteL | (byteH << 8)) / adcResolution) * referenceVoltage;
  },

  _checkFrameHeader(header = 0x00) {
    const index = this._frameHeaders.indexOf(header);
    if (index !== -1) {
      return index;
    } else {
      return null;
    }
  },

  _readVoltages(serialPortData = [], referenceVoltage = 5, adcResolution = 4096) {
    this._dataBuffer.push(...serialPortData);

    const voltages = [];
    for (let header of this._frameHeaders) {
      voltages.push([]);
    }

    for (let i = 0; i < this._dataBuffer.length - 1; i += 1) {
      const header = this._dataBuffer[i];
      const byteL = this._dataBuffer[i + 1];
      const byteH = this._dataBuffer[i + 2];
      const index = this._checkFrameHeader(header);

      if (index === null) {
        // skip till valid frame header found
        continue;
      } else if (i > this._dataBuffer.length - 3) {
        // frame start found yet it's not complete
        // remove all elements except incomplete frame
        this._dataBuffer = this._dataBuffer.slice(i);
        break;
      } else {
        // frame start found and complete
        voltages[index].push(
          this._parseVoltageBytes(byteL, byteH, referenceVoltage, adcResolution)
        );
        i += 2;
      }
    }

    // clean buffer if it was not sliced
    // max two bytes may remain (frame start and byteL)
    if (this._dataBuffer.length > 2) {
      this._dataBuffer = [];
    }

    process.send(
      new SerialDataProcessorMessage({
        referenceVoltage: referenceVoltage,
        adcResolution: adcResolution,
        voltages: voltages,
      })
    );
  },

  /**
   * @param {SerialDataProcessorMessage} message
   */
  _processMessage(message) {
    if (message && message.serialData) {
      this._readVoltages(message.serialData, message.referenceVoltage, message.adcResolution);
    }
  },

  init() {
    process.on("message", (message) => {
      this._processMessage(message);
    });
  },
};

serialDataProcessor.init();
