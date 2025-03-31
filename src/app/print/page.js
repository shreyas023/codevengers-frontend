'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function PrintPage() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isJSPMLoaded, setIsJSPMLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && isJSPMLoaded) {
      JSPM.JSPrintManager.auto_reconnect = true;
      JSPM.JSPrintManager.start();

      JSPM.JSPrintManager.WS.onStatusChanged = async function () {
        if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Open) {
          const printersList = await JSPM.JSPrintManager.getPrinters();
          setPrinters(printersList);
          if (printersList.length > 0) setSelectedPrinter(printersList[0]);
        }
      };
    }
  }, [isJSPMLoaded]);

  const handlePrint = async () => {
    if (JSPM.JSPrintManager.websocket_status !== JSPM.WSStatus.Open) {
      alert('JSPrintManager is not running. Download from https://neodynamic.com/downloads/jspm');
      return;
    }

    const escpos = Neodynamic.JSESCPOSBuilder;
    const doc = new escpos.Document();

    try {
      const logo = await escpos.ESCPOSImage.load('/logo.png'); // Adjust path as needed
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
        .linearBarcode('1234567', escpos.Barcode1DType.EAN8, new escpos.Barcode1DOptions(2, 100, true, escpos.BarcodeTextPosition.Below, escpos.BarcodeFont.A))
        .qrCode('https://mycompany.com', new escpos.BarcodeQROptions(escpos.QRLevel.L, 6))
        .pdf417('PDF417 data to be encoded here', new escpos.BarcodePDF417Options(3, 3, 0, 0.1, false))
        .feed(5)
        .cut()
        .generateUInt8Array();

      const cpj = new JSPM.ClientPrintJob();
      cpj.clientPrinter = new JSPM.InstalledPrinter(selectedPrinter);
      cpj.binaryPrinterCommands = escposCommands;
      cpj.sendToClient();
    } catch (error) {
      console.error('Error generating print job:', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-5">
      <h1 className="text-2xl font-bold mb-4">Advanced ESC/POS Printing</h1>
      <hr className="w-full mb-4" />

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="useDefaultPrinter"
          checked={!selectedPrinter}
          onChange={() => setSelectedPrinter('')}
        />
        <span>Print to Default Printer</span>
      </label>
      <p>or...</p>

      <div>
        <label htmlFor="printerName">Select a Printer:</label>
        <select
          id="printerName"
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="border rounded p-1 ml-2"
        >
          {printers.map((printer, index) => (
            <option key={index} value={printer}>
              {printer}
            </option>
          ))}
        </select>
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handlePrint}
      >
        Print Now
      </button>

      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSPrintManager.js" onLoad={() => setIsJSPMLoaded(true)} />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSESCPOSBuilder.js" />
    </div>
  );
}