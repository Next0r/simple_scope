const echarts = require("echarts");
const $ = require("jquery");

const gui = {
  _elements: {
    /** @type {HTMLSelectElement} */
    portSelectElement: undefined,
    /** @type {HTMLAnchorElement} */
    connectButton: undefined,
    /** @type {HTMLAnchorElement} */
    disconnectButton: undefined,
    /** @type {HTMLInputElement} */
    baudRateInput: undefined,
    /** @type {HTMLAnchorElement} */
    scanPortsButton: undefined,
    /** @type {HTMLSpanElement} */
    voltageSpan: undefined,
    /** @type {HTMLDivElement} */
    voltageChartDiv: undefined,
    /** @type {HTMLSpanElement} */
    samplesPerSecSpan: undefined,
    /** @type {HTMLSpanElement} */
    voltageMinSpan: undefined,
    /** @type {HTMLSpanElement} */
    voltageMaxSpan: undefined,
    /** @type {HTMLInputElement} */
    referenceVoltageInput: undefined,
    /** @type {HTMLDivElement} */
    currentChartDiv: undefined,
    /** @type {HTMLInputElement} */
    offsetVoltageInput: undefined,
    /** @type {HTMLInputElement} */
    acVoltageReference: undefined,
    /** @type {HTMLInputElement} */
    useGainCheckbox: undefined,
    /** @type {HTMLInputElement} */
    mcuSamplingSpeed: undefined,
    /** @type {HTMLInputElement} */
    useFilterCheckbox: undefined,
    /** @type {HTMLInputElement} */
    opAmpGainInput: undefined,
    /** @type {HTMLInputElement} */
    halfOffsetCheckbox: undefined,
    /** @type {HTMLSpanElement} */
    currentSpan: undefined,
    /** @type {HTMLSpanElement} */
    currentMinSpan: undefined,
    /** @type {HTMLSpanElement} */
    currentMaxSpan: undefined,
    /** @type {HTMLParagraphElement} */
    fileSavedNotificationParagraph: undefined,
    /** @type {HTMLButtonElement} */
    fileSavedNotificationButton: undefined,
    /** @type {HTMLSpanElement} */
    powerSpan: undefined,
    /** @type {HTMLDivElement} */
    mainContainer: undefined,
    /** @type {HTMLDivElement} */
    fileSavedNotification: undefined,
  },

  /** @type {echarts.ECharts} */
  _voltageChart: undefined,
  /** @type {echarts.ECharts} */
  _currentChart: undefined,
  _closeFileSavedNotificationTimeoutHandler: undefined,

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
    this._elements.mcuSamplingSpeed = document.querySelector("#mcu-sampling-speed");
    this._elements.useFilterCheckbox = document.querySelector("#use-filter");
    this._elements.opAmpGainInput = document.querySelector("#op-amp-gain");
    this._elements.halfOffsetCheckbox = document.querySelector("#half-offset");
    this._elements.currentSpan = document.querySelector("#current");
    this._elements.currentMinSpan = document.querySelector("#current-min");
    this._elements.currentMaxSpan = document.querySelector("#current-max");
    this._elements.fileSavedNotificationParagraph = document.querySelector(
      "#file-saved-notification-paragraph"
    );
    this._elements.fileSavedNotificationButton = document.querySelector(
      "#file-saved-notification-button"
    );
    this._elements.powerSpan = document.querySelector("#power");
    this._elements.mainContainer = document.querySelector("#main-container");
    this._elements.fileSavedNotification = document.querySelector("#file-saved-notification");
  },

  _setEventListeners() {
    this._elements.connectButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const success = await this.events.onConnectClick();
      if (success) {
        this._elements.disconnectButton.removeAttribute("disabled");
        this._elements.connectButton.setAttribute("disabled", "true");
        this._elements.baudRateInput.setAttribute("disabled", "true");
      }
    });

    this._elements.disconnectButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const success = await this.events.onDisconnectClick();
      if (success) {
        this._elements.disconnectButton.setAttribute("disabled", "true");
        this._elements.connectButton.removeAttribute("disabled");
        this._elements.baudRateInput.removeAttribute("disabled");
      }
    });

    this._elements.scanPortsButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const ports = await this.events.onScanPortsClick();

      this._elements.portSelectElement.innerHTML = "";

      if (!ports || ports.length === 0) {
        const optionElement = document.createElement("option");
        optionElement.innerText = "None";
        this._elements.portSelectElement.appendChild(optionElement);
        return;
      }

      for (let port of ports) {
        const optionElement = document.createElement("option");
        optionElement.value = port;
        optionElement.innerText = port;

        this._elements.portSelectElement.appendChild(optionElement);
      }

      this._elements.baudRateInput.removeAttribute("disabled");
      this._elements.connectButton.removeAttribute("disabled");
      this._elements.disconnectButton.removeAttribute("disabled");
    });

    this._elements.useGainCheckbox.addEventListener("change", () => {
      const checked = this._elements.useGainCheckbox.checked;

      if (checked) {
        this._elements.acVoltageReference.setAttribute("disabled", "true");
        this._elements.offsetVoltageInput.removeAttribute("disabled");
        this._elements.opAmpGainInput.removeAttribute("disabled");
        this._elements.halfOffsetCheckbox.removeAttribute("disabled");
        this._elements.halfOffsetCheckbox.checked = false;
      } else {
        this._elements.acVoltageReference.removeAttribute("disabled");
        this._elements.offsetVoltageInput.setAttribute("disabled", "true");
        this._elements.opAmpGainInput.setAttribute("disabled", "true");
        this._elements.halfOffsetCheckbox.setAttribute("disabled", "true");
        this._elements.halfOffsetCheckbox.checked = false;
      }
    });

    this._elements.halfOffsetCheckbox.addEventListener("change", () => {
      const checked = this._elements.halfOffsetCheckbox.checked;

      if (checked) {
        this._elements.offsetVoltageInput.setAttribute("disabled", "true");
      } else {
        this._elements.offsetVoltageInput.removeAttribute("disabled");
      }
    });

    this._elements.fileSavedNotificationButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      this.closeFileSavedNotification();
    });
  },

  _createChartOption({ title = "chart", xAxisName = "x", yAxisName = "y" } = {}) {
    return {
      title: {
        text: title,
        left: "center",
      },
      xAxis: {
        name: xAxisName,
        nameLocation: "middle",
        type: "value",
        nameGap:30,
      },
      yAxis: {
        name: yAxisName,
        nameLocation: "middle",
        type: "value",
        nameGap:30,
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

    this._voltageChart.setOption(
      this._createChartOption({
        title: "Measured voltage",
        xAxisName: "Time, ms",
        yAxisName: "Voltage, V",
      })
    );
    this._currentChart.setOption(
      this._createChartOption({
        title: "Measured current",
        xAxisName: "Time, ms",
        yAxisName: "Current, A",
      })
    );
  },

  _setupWindowResizeEvents() {
    this._elements.fileSavedNotification.style.width = `${this._elements.mainContainer.clientWidth}px`;
    window.addEventListener("resize", () => {
      this._elements.fileSavedNotification.style.width = `${this._elements.mainContainer.clientWidth}px`;
      this._voltageChart.resize();
      this._currentChart.resize();
    });
  },

  fakeDisconnectClick() {
    this._elements.disconnectButton.setAttribute("disabled", "true");
    this._elements.connectButton.removeAttribute("disabled");
    this._elements.baudRateInput.removeAttribute("disabled");
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

  getMCUSamplingSpeed() {
    return parseInt(this._elements.mcuSamplingSpeed.value);
  },

  getUseFilter() {
    return this._elements.useFilterCheckbox.checked;
  },

  getOpAmpGain() {
    return parseFloat(this._elements.opAmpGainInput.value);
  },

  getHalfOffset() {
    return this._elements.halfOffsetCheckbox.checked;
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

  setCurrent(value = 0) {
    this._elements.currentSpan.innerText = value;
  },

  setCurrentMin(value = 0) {
    this._elements.currentMinSpan.innerText = value;
  },

  setCurrentMax(value = 0) {
    this._elements.currentMaxSpan.innerText = value;
  },

  setPower(value = 0) {
    this._elements.powerSpan.innerText = value;
  },

  setAndViewFileSavedNotification(value = "", { closeTimeout = null } = {}) {
    this._elements.fileSavedNotificationParagraph.innerText = value;
    $(this._elements.fileSavedNotification).slideDown(500);

    if (closeTimeout !== null) {
      if (this._closeFileSavedNotificationTimeoutHandler) {
        clearTimeout(this._closeFileSavedNotificationTimeoutHandler);
      }

      this._closeFileSavedNotificationTimeoutHandler = setTimeout(() => {
        this.closeFileSavedNotification();
      }, closeTimeout);
    }
  },

  closeFileSavedNotification() {
    if (this._closeFileSavedNotificationTimeoutHandler) {
      clearTimeout(this._closeFileSavedNotificationTimeoutHandler);
    }

    $(this._elements.fileSavedNotification).slideUp(500);
  },

  init() {
    this._setHTMLElementsReferences();
    this._setEventListeners();
    this._initializeCharts();
    this._setupWindowResizeEvents();
  },
};

module.exports = gui;
