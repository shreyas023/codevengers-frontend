'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function Page() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [useDefaultPrinter, setUseDefaultPrinter] = useState(false);

  useEffect(() => {
    const initializePrinters = async () => {
      if (window.JSPM) {
        JSPM.JSPrintManager.auto_reconnect = true;
        JSPM.JSPrintManager.start();

        JSPM.JSPrintManager.WS.onStatusChanged = () => {
          if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Open) {
            JSPM.JSPrintManager.getPrinters().then((printersList) => {
              setPrinters(printersList);
              if (printersList.length > 0) {
                setSelectedPrinter(printersList[0]);
              }
            });
          }
        };
      }
    };

    initializePrinters();
  }, []);

  const doPrinting = async () => {
    if (!window.JSPM || JSPM.JSPrintManager.websocket_status !== JSPM.WSStatus.Open) {
      alert('JSPrintManager is not installed or not running!');
      return;
    }

    const escpos = Neodynamic.JSESCPOSBuilder;
    const doc = new escpos.Document();
    const logo = await escpos.ESCPOSImage.load('data:image/png;base64,iVBORw0KG...'); // Add your base64 image

    const escposCommands = doc
      .image(logo, escpos.BitmapDensity.D24)
      .font(escpos.FontFamily.A)
      .align(escpos.TextAlignment.Center)
      .style([escpos.FontStyle.Bold])
      .size(1, 1)
      .text('This is a BIG text')
      .font(escpos.FontFamily.B)
      .size(0, 0)
      .text('Normal-small text')
      .linearBarcode('1234567', escpos.Barcode1DType.EAN8)
      .qrCode('https://mycompany.com')
      .feed(5)
      .cut()
      .generateUInt8Array();

    const cpj = new JSPM.ClientPrintJob();
    cpj.clientPrinter = useDefaultPrinter
      ? new JSPM.DefaultPrinter()
      : new JSPM.InstalledPrinter(selectedPrinter);
    cpj.binaryPrinterCommands = escposCommands;
    cpj.sendToClient();
  };

  return (
    <div className="text-center p-5">
      <h1 className="text-2xl font-bold">Advanced ESC/POS Printing</h1>
      <hr className="my-4" />
      <label className="block my-2">
        <input type="checkbox" checked={useDefaultPrinter} onChange={() => setUseDefaultPrinter(!useDefaultPrinter)} />
        <strong className="ml-2">Print to Default Printer</strong>
      </label>
      <p>or...</p>
      <div className="my-3">
        <label>Select an installed Printer:</label>
        <select
          className="border p-2 ml-2"
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          disabled={useDefaultPrinter}
        >
          {printers.map((printer, index) => (
            <option key={index} value={printer}>{printer}</option>
          ))}
        </select>
      </div>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={doPrinting}>Print Now</button>

      {/* Load scripts in order */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.5/bluebird.min.js" strategy="beforeInteractive" />
      <Script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/cptable.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/cputils.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSESCPOSBuilder.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSPrintManager.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/zip.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/zip-ext.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/deflate.js" strategy="beforeInteractive" />
    </div>
  );
}
