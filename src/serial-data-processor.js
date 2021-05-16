let serialPortDataBuffer = [];

const processMessage = (data) => {
  serialPortDataBuffer.push(...data);

  const values = [];

  for (let i = 0; i < serialPortDataBuffer.length - 1; i += 1) {
    if (serialPortDataBuffer[i] !== 0x0a) {
      // skip till valid frame star found
      continue;
    } else if (i + 2 > serialPortDataBuffer.length - 1) {
      // frame start found yet it's not complete
      // remove all elements except incomplete frame
      serialPortDataBuffer = serialPortDataBuffer.slice(i);
      break;
    } else {
      // frame start found and complete
      const byteL = serialPortDataBuffer[i + 1];
      const byteH = serialPortDataBuffer[i + 2];
      const value = ((byteL | (byteH << 8)) / 4096) * 5;

      // 4096 - adc resolution
      // 5 - max voltage
      // L | (H << 8) = reading
      values.push(value);
      i += 2;
    }
  }

  // clean buffer if it was not sliced
  // max two bytes may remain (frame start and byte L)
  if (serialPortDataBuffer.length > 2) {
    serialPortDataBuffer.length = [];
  }

  process.send({ data: values });
};

process.on("message", (message) => {
  if (message.serialPortData === undefined) {
    process.send({ info: "return" });
    return;
  }

  processMessage(message.serialPortData);
});
