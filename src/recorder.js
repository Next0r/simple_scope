const path = require("path");
const fs = require("fs");

const recorder = {
  _directory: "records",
  _maxSize: 300,
  _tmpFileName: "recorder.tmp",
  _rowSeparator: ";",
  _recordFileName: "record",

  init(directory = "records", maxSize = 300) {
    this._directory = directory;
    this._maxSize = maxSize;
    return this;
  },

  _createTimestamp() {
    const d = new Date();
    const timestamp = `${d.getFullYear()}/${
      d.getMonth() + 1
    }/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`;
    return timestamp;
  },

  _createDataFilePath(dirPath = "") {
    const d = new Date();
    const dataFilePath = path.join(
      dirPath,
      `${this._recordFileName}_${d.getDate()}_${
        d.getMonth() + 1
      }_${d.getFullYear()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.json`
    );
    return dataFilePath;
  },

  record(value = "") {
    return new Promise((resolve, reject) => {
      const dirPath = path.join(__dirname, this._directory);
      const tmpFilePath = path.join(__dirname, this._directory, this._tmpFileName);

      let tmpFileContent;

      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath);
        }

        if (!fs.existsSync(tmpFilePath)) {
          fs.writeFileSync(tmpFilePath, "", { flag: "w+" });
        }

        fs.appendFileSync(
          tmpFilePath,
          `${this._createTimestamp()},${value}${this._rowSeparator}\n`,
          {
            flag: "a",
            encoding: "utf8",
          }
        );

        tmpFileContent = fs.readFileSync(tmpFilePath, { flag: "r", encoding: "utf8" });
      } catch (e) {
        reject(e);
      }

      const dataRows = tmpFileContent.replace(/\r?\n|\r/g, "").split(this._rowSeparator);
      dataRows.pop();

      if (dataRows.length < this._maxSize) {
        return resolve();
      }

      const dataFileContent = [];

      for (row of dataRows) {
        const rowArray = row.split(",");

        const timestamp = rowArray[0];
        const val = rowArray[1];

        dataFileContent.push({ timestamp: timestamp, value: val });
      }

      const dataFilePath = this._createDataFilePath(dirPath);

      try {
        fs.writeFileSync(this._createDataFilePath(dirPath), JSON.stringify(dataFileContent), {
          flag: "w+",
        });

        fs.rmSync(tmpFilePath);
      } catch (e) {
        reject(e);
      }

      resolve(`Saved ${dataFilePath} with ${dataFileContent.length} records.`);
    });
  },
};

module.exports.recorder = recorder;
