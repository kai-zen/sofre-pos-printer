import "./index.css";
import {
  applyElementStyles,
  generatePageText,
  generateTableCell,
  renderImageToPage,
} from "./utils";

const ipcRender = require("electron").ipcRenderer;

const body = document.getElementById("main") as HTMLElement;

// Initialize container in html view, by setting the width and margins specified in the PosPrinter options
ipcRender.on("body-init", function (e, arg) {
  body.style.width = arg?.width || "100%";
  body.style.margin = arg?.margin || 0;

  e.sender.send("body-init-reply", { status: true, error: null });
});

ipcRender.on("render-line", async (event, arg) => {
  switch (arg.line.type) {
    case "text": {
      body.appendChild(generatePageText(arg.line));
      event.sender.send("render-line-reply", { status: true, error: null });
      return;
    }
    case "image": {
      const img = await renderImageToPage(arg.line);
      body.appendChild(img);
      event.sender.send("render-line-reply", { status: true, error: null });
      return;
    }
    case "table":
      // Creating table
      let tableContainer = document.createElement("div");
      tableContainer.setAttribute("id", `table-container-${arg.lineIndex}`);
      let table = document.createElement("table");
      table.setAttribute("id", `table${arg.lineIndex}`);
      table = applyElementStyles(table, {
        ...arg.line.style,
      }) as HTMLTableElement;

      let tHeader = document.createElement("thead");
      tHeader = applyElementStyles(
        tHeader,
        arg.line.tableHeaderStyle
      ) as HTMLTableSectionElement;

      let tBody = document.createElement("tbody");
      tBody = applyElementStyles(
        tBody,
        arg.line.tableBodyStyle
      ) as HTMLTableSectionElement;

      let tFooter = document.createElement("tfoot");
      tFooter = applyElementStyles(
        tFooter,
        arg.line.tableFooterStyle
      ) as HTMLTableSectionElement;
      // 1. Headers
      if (arg.line.tableHeader) {
        for (const headerArg of arg.line.tableHeader) {
          {
            if (typeof headerArg === "object") {
              switch (headerArg.type) {
                case "image":
                  await renderImageToPage(headerArg)
                    .then((img) => {
                      const th = document.createElement(`th`);
                      th.appendChild(img);
                      tHeader.appendChild(th);
                    })
                    .catch((e) => {
                      event.sender.send("render-line-reply", {
                        status: false,
                        error: (e as any).toString(),
                      });
                    });
                  break;
                case "text":
                  tHeader.appendChild(generateTableCell(headerArg, "th"));
                  break;
              }
            } else {
              const th = document.createElement(`th`);
              th.innerHTML = headerArg;
              tHeader.appendChild(th);
            }
          }
        }
      }
      // 2. Body
      if (arg.line.tableBody) {
        for (const bodyRow of arg.line.tableBody) {
          const rowTr = document.createElement("tr");
          for (const colArg of bodyRow) {
            if (typeof colArg === "object") {
              switch (colArg.type) {
                case "image":
                  await renderImageToPage(colArg)
                    .then((img) => {
                      const th = document.createElement(`td`);
                      th.appendChild(img);
                      rowTr.appendChild(th);
                    })
                    .catch((e) => {
                      event.sender.send("render-line-reply", {
                        status: false,
                        error: (e as any).toString(),
                      });
                    });
                  break;
                case "text":
                  rowTr.appendChild(generateTableCell(colArg));
                  break;
              }
            } else {
              const td = document.createElement(`td`);
              td.innerHTML = colArg;
              rowTr.appendChild(td);
            }
          }
          tBody.appendChild(rowTr);
        }
      }
      // 3. Footer
      if (arg.line.tableFooter) {
        for (const footerArg of arg.line.tableFooter) {
          if (typeof footerArg === "object") {
            switch (footerArg.type) {
              case "image":
                await renderImageToPage(footerArg)
                  .then((img) => {
                    const footerTh = document.createElement(`th`);
                    footerTh.appendChild(img);
                    tFooter.appendChild(footerTh);
                  })
                  .catch((e) => {
                    event.sender.send("render-line-reply", {
                      status: false,
                      error: e.toString(),
                    });
                  });
                break;
              case "text":
                tFooter.appendChild(generateTableCell(footerArg, "th"));
                break;
            }
          } else {
            const footerTh = document.createElement(`th`);
            footerTh.innerHTML = footerArg;
            tFooter.appendChild(footerTh);
          }
        }
      }
      // render table
      table.appendChild(tHeader);
      table.appendChild(tBody);
      table.appendChild(tFooter);
      tableContainer.appendChild(table);
      body.appendChild(tableContainer);
      // send
      event.sender.send("render-line-reply", { status: true, error: null });
      return;
  }
});
