const echarts = require("echarts");

const gui = {
  _elements: {
    /**
     * @type {HTMLSelectElement}
     */
    portSelectElement: null,
    /**
     * @type {HTMLButtonElement}
     */
    connectButton: null,
    /**
     * @type {HTMLButtonElement}
     */
    disconnectButton: null,
    /**
     * @type {HTMLInputElement}
     */
    baudRateInput: null,
    /**
     * @type {HTMLButtonElement}
     */
    scanPortsButton: null,
    /**
     * @type {HTMLSpanElement}
     */
    voltageSpan: null,
    /**
     * @type {HTMLDivElement}
     */
    chartDiv: null,
    /**
     * @type {echarts.ECharts}
     */
    chart: null,
    /**
     * @type {HTMLSpanElement}
     */
    samplesPerSecSpan: null,
  },

  events: {
    onConnectClick: () => {},
    onDisconnectClick: () => {},
    onScanPortsClick: () => {},
  },

  _setHTMLElementsReferences() {
    this._elements.portSelectElement =
      document.querySelector("#select-port-list");
    this._elements.connectButton = document.querySelector("#connect-button");
    this._elements.disconnectButton =
      document.querySelector("#disconnect-button");
    this._elements.baudRateInput = document.querySelector("#baud-rate");
    this._elements.scanPortsButton =
      document.querySelector("#scan-ports-button");
    this._elements.voltageSpan = document.querySelector("#voltage");
    this._elements.chartDiv = document.querySelector("#chart");
    this._elements.samplesPerSecSpan = document.querySelector(
      "#samples-per-second"
    );
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
  },

  _initializeCharts() {
    this._elements.chart = echarts.init(this._elements.chartDiv);

    const option = {
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

    this._elements.chart.setOption(option);
  },

  updateChart(data) {
    const option = {
      series: [
        {
          data: data,
        },
      ],
    };

    this._elements.chart.setOption(option);
  },

  getSelectedPort() {
    return this._elements.portSelectElement.value;
  },

  getBaudRate() {
    return parseInt(this._elements.baudRateInput.value);
  },

  setVoltage(value = 0) {
    this._elements.voltageSpan.innerText = value;
  },

  setSamplesPerSec(value = 0) {
    this._elements.samplesPerSecSpan.innerText = value;
  },

  init() {
    this._setHTMLElementsReferences();
    this._setEventListeners();
    this._initializeCharts();
  },
};

module.exports = gui;
