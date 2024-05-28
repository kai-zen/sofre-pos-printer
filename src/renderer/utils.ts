import { PosPrintData, PrintDataStyle } from "../main/models";

type PageElement = HTMLElement | HTMLDivElement | HTMLImageElement;
export const generatePageText = (arg: PosPrintData) => {
  const text = arg.value;
  let div = document.createElement("div") as HTMLElement;
  div.innerHTML = text || "";
  if (arg.style) div = applyElementStyles(div, arg.style) as HTMLElement;

  return div;
};

export const generatePageDiv = (arg: PosPrintData) => {
  const { factor_number, time } = arg.divVals || {};

  let parent = document.createElement("div") as HTMLElement;
  parent.setAttribute("class", "row-flex");

  // make the time
  const theTime = document.createElement("p") as HTMLElement;
  theTime.innerText = time || "";
  theTime.setAttribute("class", "time-p");

  // make factor box
  let factorBox = document.createElement("div") as HTMLElement;
  factorBox.setAttribute("class", "col-flex");
  const theH6 = document.createElement("h6") as HTMLElement;
  const theP = document.createElement("p") as HTMLElement;
  theP.innerText = "فاکتور";
  theH6.innerText = `شماره ${String(factor_number || "")}`;
  factorBox.appendChild(theP);
  factorBox.appendChild(theH6);

  parent.appendChild(factorBox);
  parent.appendChild(theTime);

  return parent;
};

export const generateTableCell = (
  arg: PosPrintData,
  type = "td"
): HTMLElement => {
  let cellElement: HTMLElement;

  cellElement = document.createElement(type);
  cellElement.innerHTML = arg.value || "";
  cellElement = applyElementStyles(cellElement, {
    padding: "6px 2px",
    ...arg.style,
  });

  return cellElement;
};

export const renderImageToPage = (arg: PosPrintData): Promise<HTMLElement> => {
  return new Promise(async (resolve) => {
    if (!arg.url) return;
    let img_con = document.createElement("div");

    img_con = applyElementStyles(img_con, {
      width: "100%",
      display: "flex",
      justifyContent: arg?.position || "left",
    }) as HTMLDivElement;

    let img = document.createElement("img") as HTMLImageElement;
    img = applyElementStyles(img, {
      height: arg.height,
      width: arg.width,
      ...arg.style,
    }) as HTMLImageElement;

    img.src = arg.url;
    img_con.prepend(img);
    resolve(img_con);
  });
};

export const applyElementStyles = (
  element: PageElement,
  style: PrintDataStyle
): PageElement => {
  for (const styleProp of Object.keys(style)) {
    if (!style[styleProp]) continue;
    element.style[styleProp] = style[styleProp];
  }
  return element;
};
