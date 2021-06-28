const path = require("path");
const fse = require("fs-extra");

class DataRecorder {
  constructor({ name = "recorder", directory = "records", maxSize = 1000 } = {}) {
    this._name = name;
    this._directory = directory;
    this._records = [];
    this._maxSize = maxSize;
  }

  record(value = "value") {
    return new Promise((resolve, reject) => {
      // store data
      this._records.push({
        timestamp: new Date().toLocaleString("en-US"),
        value: value,
      });

      // save file if max data size limit met
      if (this._records.length >= this._maxSize) {
        const date = new Date();

        // create file path and name with current date and time
        const filePath = path.join(
          __dirname,
          this._directory,
          `${this._name}_${date.getDate()}_${
            date.getMonth() + 1
          }_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.json`
        );

        // save as json
        fse.outputJSON(filePath, this._records, { flag: "w+" }, (err) => {
          if (err) {
            reject(err);
          }
          resolve(`Saved file ${filePath} with ${this._records.length} records.`);
          this._records = [];
        });
      }
    });
  }
}

module.exports = DataRecorder;
