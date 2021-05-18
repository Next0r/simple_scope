const echarts = require("echarts");

const gui = {
  _elements: {
    /**
     * @type {HTMLSelectElement}
     */
    portSelectElement: undefined,
    /**
     * @type {HTMLButtonElement}
     */
    connectButton: undefined,
    /**
     * @type {HTMLButtonElement}
     */
    disconnectButton: undefined,
    /**
     * @type {HTMLInputElement}
     */
    baudRateInput: undefined,
    /**
     * @type {HTMLButtonElement}
     */
    scanPortsButton: undefined,
    /**
     * @type {HTMLSpanElement}
     */
    voltageSpan: undefined,
    /**
     * @type {HTMLDivElement}
     */
    voltageChartDiv: undefined,

    /**
     * @type {HTMLSpanElement}
     */
    samplesPerSecSpan: undefined,
    /**
     * @type {HTMLSpanElement}
     */
    voltageMinSpan: undefined,
    /**
     * @type {HTMLSpanElement}
     */
    voltageMaxSpan: undefined,
    /**
     * @type {HTMLInputElement}
     */
    referenceVoltageInput: undefined,
    /**
     * @type {HTMLDivElement}
     */
    currentChartDiv: undefined,
    /**
     * @type {HTMLInputElement}
     */
    offsetVoltageInput: undefined,
    /**
     * @type {HTMLInputElement}
     */
    acVoltageReference: undefined,
    /**
     * @type {HTMLInputElement}
     */
    useGainCheckbox: undefined,
  },

  /**
   * @type {echarts.ECharts}
   */
  _voltageChart: undefined,
  /**
   * @type {echarts.ECharts}
   */
  _currentChart: undefined,

  events: {
    onConnectClick: () => {},
    onDisconnectClick: () => {},
    onScanPortsClick: () => {},
  },

  _setHTMLElementsReferences() {
    this._elements.portSelectElement = document.querySelector("#select-port-list");
    this._elements.connectButton = document.querySelector("#connect-button");
    this._elements.disconnectButton = document.querySelector("#disconnect-button");
    this._elements.baudRateInput = document.querySelector("#baud-rate");
    this._elements.scanPortsButton = document.querySelector("#scan-ports-button");
    this._elements.voltageSpan = document.querySelector("#voltage");
    this._elements.voltageChartDiv = document.querySelector("#voltage-chart");
    this._elements.samplesPerSecSpan = document.querySelector("#samples-per-second");
    this._elements.voltageMinSpan = document.querySelector("#voltage-min");
    this._elements.voltageMaxSpan = document.querySelector("#voltage-max");
    this._elements.referenceVoltageInput = document.querySelector("#reference-voltage");
    this._elements.currentChartDiv = document.querySelector("#current-chart");
    this._elements.offsetVoltageInput = document.querySelector("#offset-voltage");
    this._elements.acVoltageReference = document.querySelector("#ac-voltage-reference");
    this._elements.useGainCheckbox = document.querySelector("#use-gain");
  },

  _setEventListeners() {
    this._elements.connectButton.addEventListener("click", async () => {
      const success = await this.events.onConnectClick();
      if (success) {
        this._elements.disconnectButton.disabled = false;
        this._elements.connectButton.disabled = true;
        this._elements.baudRateInput.disabled = true;
      }
    });

    this._elements.disconnectButton.addEventListener("click", async () => {
      const success = await this.events.onDisconnectClick();
      if (success) {
        this._elements.disconnectButton.disabled = true;
        this._elements.connectButton.disabled = false;
        this._elements.baudRateInput.disabled = false;
      }
    });

    this._elements.scanPortsButton.addEventListener("click", async () => {
      const ports = await this.events.onScanPortsClick();

      if (!ports || ports.length === 0) {
        return;
      }

      this._elements.portSelectElement.innerHTML = "";

      for (let port of ports) {
        const optionElement = document.createElement("option");
        optionElement.value = port;
        optionElement.innerText = port;

        this._elements.portSelectElement.appendChild(optionElement);
      }

      this._elements.baudRateInput.disabled = false;
      this._elements.connectButton.disabled = false;
      this._elements.disconnectButton.disabled = false;
    });

    this._elements.useGainCheckbox.addEventListener("change", () => {
      const checked = this._elements.useGainCheckbox.checked;

      if (checked) {
        this._elements.acVoltageReference.disabled = true;
      } else {
        this._elements.acVoltageReference.disabled = false;
      }
    });
  },

  _createChartOption() {
    return {
      xAxis: {
        type: "value",
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: [],
          type: "line",
          showSymbol: false,
        },
      ],
    };
  },

  _initializeCharts() {
    this._voltageChart = echarts.init(this._elements.voltageChartDiv);
    this._currentChart = echarts.init(this._elements.currentChartDiv);

    this._voltageChart.setOption(this._createChartOption());
    this._currentChart.setOption(this._createChartOption());
  },

  fakeDisconnectClick() {
    this._elements.disconnectButton.disabled = true;
    this._elements.connectButton.disabled = false;
    this._elements.baudRateInput.disabled = false;
  },

  updateVoltageChart(data) {
    const option = {
      series: [
        {
          data: data,
        },
      ],
    };

    this._voltageChart.setOption(option);
  },

  updateCurrentChart(data) {
    const option = {
      series: [
        {
          data: data,
        },
      ],
    };

    this._currentChart.setOption(option);
  },

  getSelectedPort() {
    return this._elements.portSelectElement.value;
  },

  getBaudRate() {
    return parseInt(this._elements.baudRateInput.value);
  },

  getReferenceVoltage() {
    return parseFloat(this._elements.referenceVoltageInput.value);
  },

  getOffsetVoltage() {
    return parseFloat(this._elements.offsetVoltageInput.value);
  },

  getACVoltageReference() {
    return parseFloat(this._elements.acVoltageReference.value);
  },

  getUseGain() {
    return this._elements.useGainCheckbox.checked;
  },

  setVoltage(value = 0) {
    this._elements.voltageSpan.innerText = value;
  },

  setSamplesPerSec(value = 0) {
    this._elements.samplesPerSecSpan.innerText = value;
  },

  setVoltageMin(value = 0) {
    this._elements.voltageMinSpan.innerText = value;
  },

  setVoltageMax(value = 0) {
    this._elements.voltageMaxSpan.innerText = value;
  },

  init() {
    this._setHTMLElementsReferences();
    this._setEventListeners();
    this._initializeCharts();
  },
};

module.exports = gui;
