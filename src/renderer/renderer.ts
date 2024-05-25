import "./index.css";
import {
  applyElementStyles,
  generatePageText,
  generateTableCell,
  renderImageToPage,
} from "./utils";
const ipcRender = require("electron").ipcRenderer;
const body = document.getElementById("main") as HTMLElement;

ipcRender.on("body-init", (e, arg) => {
  body.style.width = arg?.width || "100%";
  body.style.margin = arg?.margin || 0;
  e.sender.send("body-init-reply", { status: true, error: null });
});

ipcRender.on("render-line", async (event, arg) => {
  if (arg.line.type === "text") {
    body.appendChild(generatePageText(arg.line));
    event.sender.send("render-line-reply", { status: true, error: null });
  } else if (arg.line.type === "image") {
    const img = await renderImageToPage(arg.line);
    body.appendChild(img);
    event.sender.send("render-line-reply", { status: true, error: null });
  } else if (arg.line.type === "table") {
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
      for await (const headerArg of arg.line.tableHeader) {
        {
          if (typeof headerArg === "object") {
            if (headerArg.type === "image") {
              const th = document.createElement("th");
              const theImg = await renderImageToPage(headerArg);
              th.appendChild(theImg);
              tHeader.appendChild(th);
            } else tHeader.appendChild(generateTableCell(headerArg, "th"));
          } else {
            const th = document.createElement("th");
            th.innerHTML = headerArg;
            tHeader.appendChild(th);
          }
        }
      }
    }
    // 2. Body
    if (arg.line.tableBody) {
      for await (const bodyRow of arg.line.tableBody) {
        const rowTr = document.createElement("tr");
        for await (const colArg of bodyRow) {
          if (typeof colArg === "object") {
            if (colArg.type === "image") {
              const th = document.createElement("td");
              const theImg = await renderImageToPage(colArg);
              th.appendChild(theImg);
              rowTr.appendChild(th);
            } else rowTr.appendChild(generateTableCell(colArg));
          } else {
            const td = document.createElement("td");
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
          if (footerArg.type === "image") {
            const footerTh = document.createElement("th");
            const theImg = await renderImageToPage(footerArg);
            footerTh.appendChild(theImg);
            tFooter.appendChild(footerTh);
          } else tFooter.appendChild(generateTableCell(footerArg, "th"));
        } else {
          const footerTh = document.createElement("th");
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
