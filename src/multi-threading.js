const path = require("path");
const { fork } = require("child_process");

const multiThreading = {
  createSerialDataProcessor() {
    const serialDataProcessor = fork(
      path.join(__dirname, "serial-data-processor.js")
    );

    serialDataProcessor.on("error", (err) => {
      console.log(err.message);
    });

    serialDataProcessor.on("exit", (code) => {
      console.log(`Serial data processor subprocess exited with code ${code}`);
    });

    return serialDataProcessor;
  },
};

module.exports = multiThreading;
