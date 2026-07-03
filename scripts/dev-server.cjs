/* eslint-disable @typescript-eslint/no-require-imports */

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.__NEXT_DEV_SERVER = "1";
process.env.NEXT_PRIVATE_START_TIME = String(Date.now());

const { startServer } = require("next/dist/server/lib/start-server");

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);

  if (index === -1 || !process.argv[index + 1]) {
    return fallback;
  }

  return process.argv[index + 1];
}

const port = Number(readOption("--port", process.env.PORT || "3000"));
const hostname = readOption("--hostname", process.env.HOSTNAME || "127.0.0.1");

startServer({
  dir: process.cwd(),
  hostname,
  port,
  isDev: true,
  allowRetry: false
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
