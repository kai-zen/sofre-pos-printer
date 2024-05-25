import { PosPrintData, PosPrintOptions } from "./models";
import { BrowserWindow } from "electron";
import { join } from "path";
import {
  convertPixelsToMicrons,
  parsePaperWidth,
  parsePaperWidthInMicrons,
  sendIpcMsg,
} from "./utils";

if (process.type === "renderer")
  throw new Error(
    'electron-pos-printer: use remote.require("electron-pos-printer") in the render process'
  );

export class PosPrinter {
  public static print(
    data: PosPrintData[],
    options: PosPrintOptions
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!options.preview && !options.printerName) {
        reject(
          new Error(
            "A printer name is required, if you don't want to specify a printer name, set silent to true"
          ).toString()
        );
      }

      let printedState = false;
      let window_print_error: any = null;

      if (!options.preview || !options.silent) {
        setTimeout(() => {
          if (!printedState) {
            const errorMsg =
              window_print_error ||
              "[TimedOutError] Make sure your printer is connected";
            reject(errorMsg);
            printedState = true;
          }
        }, (options.timeOutPerLine || 600) * data.length + 200);
      }

      let mainWindow = new BrowserWindow({
        width: parsePaperWidth(options.pageSize),
        height: 1200,
        show: Boolean(options.preview),
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      mainWindow.on("closed", () => {
        (mainWindow as any) = null;
      });

      mainWindow.loadFile(join(__dirname, "renderer/index.html"));

      mainWindow.webContents.on("did-finish-load", async () => {
        await sendIpcMsg("body-init", mainWindow.webContents, options);

        // Render print data as html in the mainWindow render process
        await PosPrinter.renderPrintDocument(mainWindow, data);

        let width = parsePaperWidthInMicrons(options.pageSize);
        const clientHeight = await mainWindow.webContents.executeJavaScript(
          "document.body.clientHeight"
        );
        const height = convertPixelsToMicrons(clientHeight);

        if (options.preview) {
          resolve({ complete: true, data, options });
          return;
        } else {
          const printOptions = {
            silent: Boolean(options.silent),
            printBackground: true,
            deviceName: options.printerName,
            copies: options?.copies || 1,
            //  1px = 264.5833 microns
            pageSize: { width, height },
            ...(options.color && { color: options.color }),
            ...(options.margins && { margins: options.margins }),
            ...(options.landscape && { landscape: options.landscape }),
            ...(options.scaleFactor && {
              scaleFactor: options.scaleFactor,
            }),
            ...(options.pagesPerSheet && {
              pagesPerSheet: options.pagesPerSheet,
            }),
            ...(options.collate && { collate: options.collate }),
            ...(options.pageRanges && { pageRanges: options.pageRanges }),
            ...(options.duplexMode && { duplexMode: options.duplexMode }),
          };
          mainWindow.webContents.print(printOptions, (arg, err) => {
            if (err) {
              window_print_error = err;
              reject(err);
            }
            if (!printedState) {
              resolve({ complete: arg, options });
              printedState = true;
            }
            mainWindow.close();
          });
        }
      });
    });
  }

  private static renderPrintDocument(
    window: any,
    data: PosPrintData[]
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      for await (const [lineIndex, line] of data.entries()) {
        if (line.type === "image" && !line.path && !line.url) {
          window.close();
          reject(
            new Error("An Image url/path is required for type image").toString()
          );
          break;
        }

        const result: any = await sendIpcMsg(
          "render-line",
          window.webContents,
          { line, lineIndex }
        );
        if (!result?.status) {
          window.close();
          reject(result?.error);
          return;
        }
      }
      // when the render process is done rendering the page, resolve
      resolve({ message: "page-rendered" });
    });
  }
}
