import { ipcMain } from "electron";
import { PaperSize } from "./models";

export const sendIpcMsg = (channel: any, webContents: any, arg: any) => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    ipcMain.once(`${channel}-reply`, (event, result) => {
      if (result.status) resolve(result);
      else reject(result.error);
    });
    webContents.send(channel, arg);
  });
};

export const parsePaperWidth = (pageSize: PaperSize) => {
  return pageSize === "44mm"
    ? 166
    : pageSize === "57mm"
    ? 215
    : pageSize === "58mm"
    ? 219
    : pageSize === "76mm"
    ? 287
    : pageSize === "78mm"
    ? 295
    : 302;
};

export function parsePaperSizeInMicrons(pageSize?: PaperSize): {
  width: number;
  height: number;
} {
  let width = 58000,
    height = 10000; // in microns
  if (typeof pageSize == "string") {
    switch (pageSize) {
      case "44mm":
        width = Math.ceil(44 * 1000);
        break;
      case "57mm":
        width = Math.ceil(57 * 1000);
        break;
      case "58mm":
        width = Math.ceil(58 * 1000);
        break;
      case "76mm":
        width = Math.ceil(76 * 1000);
        break;
      case "78mm":
        width = Math.ceil(78 * 1000);
        break;
      case "80mm":
        width = Math.ceil(80 * 1000);
        break;
    }
  }

  return {
    width,
    height,
  };
}

export function convertPixelsToMicrons(pixels: number): number {
  return Math.ceil(pixels * 265);
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
