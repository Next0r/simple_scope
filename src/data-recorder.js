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
    this._records.push({
      timestamp: new Date().toISOString(),
      value: value,
    });

    fse;

    if (this._records.length >= this._maxSize) {
      const date = new Date();
      const p = path.join(
        __dirname,
        this._directory,
        `${this._name}_${date.getDate()}_${
          date.getMonth() + 1
        }_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.json`
      );

      fse
        .outputJSON(p, this._records, { flag: "w+" })
        .then(() => {
          console.log(`Saved file ${p} with ${this._records.length} records.`);
          this._records = [];
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
}

module.exports = DataRecorder;
