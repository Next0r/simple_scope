const path = require("path");
const fse = require("fs-extra");
const gui = require("./gui");

class DataRecorder {
  constructor({ name = "recorder", directory = "records", maxSize = 1000 } = {}) {
    this._name = name;
    this._directory = directory;
    this._records = [];
    this._maxSize = maxSize;
  }

  record(value = "value") {
    this._records.push({
      timestamp: new Date().toISOString(),
      value: value,
    });

    fse;

    if (this._records.length >= this._maxSize) {
      const date = new Date();
      const filePath = path.join(
        __dirname,
        this._directory,
        `${this._name}_${date.getDate()}_${
          date.getMonth() + 1
        }_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.json`
      );

      fse
        .outputJSON(filePath, this._records, { flag: "w+" })
        .then(() => {
          gui.setAndViewFileSavedCallout(
            `Saved file ${filePath} with ${this._records.length} records.`,
            { closeTimeout: 5000 }
          );
          this._records = [];
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
}

module.exports = DataRecorder;
