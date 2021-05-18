class SerialDataProcessorMessage {
  constructor({ serialData = [], referenceVoltage = 5, adcResolution = 4096, voltages = [] } = {}) {
    this.serialData = serialData;
    this.referenceVoltage = referenceVoltage;
    this.adcResolution = adcResolution;
    this.voltages = voltages;
  }
}

module.exports = SerialDataProcessorMessage;
