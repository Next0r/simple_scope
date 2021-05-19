/**
 * Applies Hampel Filter to provided dataset
 * @param {[]} dataset Numerical dataset to be filtered
 * @param {Number} windowSize Integer value that represents half of window width - whole window = 2 * windowSize + 1
 * @param {Number} nSigmas Filtering factor that should be greater than 0, makes algorithm more forgiving
 * @returns Filtered dataset
 */
const hampel = (dataset = [], windowSize = 3, nSigmas = 3) => {
  /**
   * Provides median of given dataset
   */
  const median = (dataset = []) => {
    if (dataset.length === 1) {
      return dataset[0];
    }

    const data = [...dataset];
    data.sort((a, b) => {
      return a - b;
    });

    if (data.length % 2 === 0) {
      return (data[data.length * 0.5] + data[data.length * 0.5 - 1]) * 0.5;
    } else {
      return data[(data.length - 1) * 0.5];
    }
  };

  /**
   * Provides MAD factor of given dataset
   */
  const medianAbsoluteDeviation = (dataset = []) => {
    const m = median(dataset);
    const X = [];

    for (let element of dataset) {
      X.push(Math.abs(element - m));
    }

    X.sort((a, b) => a - b);

    return median(X);
  };

  const k = 1.4826; // gaussian distribution factor

  for (let i = windowSize; i < dataset.length - windowSize; i += 1) {
    const subset = dataset.slice(i - windowSize, i + windowSize + 1);
    const m = median(subset);
    const s = k * medianAbsoluteDeviation(subset) * nSigmas;

    if (dataset[i] > m + s || dataset[i] < m - s) {
      dataset[i] = m;
    }
  }

  return dataset;
};

module.exports = hampel;
