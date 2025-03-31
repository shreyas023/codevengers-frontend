'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function PrintPage() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isJSPMReady, setIsJSPMReady] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Sample order data
  const order = {
    orderNo: '12345',
    orderid: 'ORD-987654',
    timeStamp: '31/03/2025 14:30',
    userid: 'John Doe',
    userPhone: '+91 9876543210',
    payment: 'Online Payment',
    items: [
      { name: 'Paneer Tikka', qty: 2, price: 180, total: 360 },
      { name: 'Butter Naan', qty: 4, price: 40, total: 160 },
      { name: 'Dal Makhani', qty: 1, price: 150, total: 150 }
    ],
    subtotal: 670,
    tax: 33.5,
    total: 703.5
  };

  // Load JSPrintManager and set up event handlers
  useEffect(() => {
    const checkJSPMStatus = async () => {
      if (window.JSPM) {
        window.JSPM.JSPrintManager.auto_reconnect = true;
        window.JSPM.JSPrintManager.start();
        
        window.JSPM.JSPrintManager.WS.onStatusChanged = async function () {
          if (jspmWSStatus()) {
            setIsJSPMReady(true);
            try {
              // Get available printers
              const printerList = await window.JSPM.JSPrintManager.getPrinters();
              setPrinters(printerList);
              
              // Automatically select the default printer (first in the list)
              if (printerList && printerList.length > 0) {
                setSelectedPrinter(printerList[0]);
              }
            } catch (error) {
              console.error('Error getting printers:', error);
            }
          } else {
            setIsJSPMReady(false);
          }
        };
      }
    };
    
    // Check status every 1 second until JSPM is ready
    const interval = setInterval(() => {
      if (window.JSPM) {
        checkJSPMStatus();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const jspmWSStatus = () => {
    if (!window.JSPM) return false;
    
    const status = window.JSPM.JSPrintManager.websocket_status;
    if (status === window.JSPM.WSStatus.Open) return true;
    if (status === window.JSPM.WSStatus.Closed) {
      console.warn('JSPrintManager is not installed or not running!');
      return false;
    }
    if (status === window.JSPM.WSStatus.Blocked) {
      alert('JSPM has blocked this website!');
      return false;
    }
    return false;
  };

  const doPrinting = async () => {
    if (!jspmWSStatus() || !selectedPrinter) {
      console.error('Cannot print: JSPM not ready or no printer selected');
      return;
    }
    
    setIsPrinting(true);
    
    try {
      const escpos = window.Neodynamic.JSESCPOSBuilder;
      const doc = new escpos.Document();
      
      // Generate receipt content
      const receipt = await generateReceipt(doc, escpos, order);
      
      // Generate commands and send to printer asynchronously
      const escposCommands = receipt.generateUInt8Array();
      const cpj = new window.JSPM.ClientPrintJob();
      cpj.clientPrinter = new window.JSPM.InstalledPrinter(selectedPrinter);
      cpj.binaryPrinterCommands = escposCommands;
      
      // Send print job to printer
      await new Promise((resolve) => {
        cpj.onFinished = function() {
          resolve();
        };
        cpj.sendToClient();
      });
      
      console.log('Printing completed successfully');
    } catch (error) {
      console.error('Printing error:', error);
    } finally {
      setIsPrinting(false);
    }
  };
  
  // Separate function to generate receipt content
  const generateReceipt = async (doc, escpos, orderData) => {
    try {
      // Try to load and print logo
      let receipt;
      try {
        const logo = await escpos.ESCPOSImage.load('/logo.png');
        receipt = doc.image(logo, escpos.BitmapDensity.D24);
      } catch (logoError) {
        console.warn('Failed to load logo:', logoError);
        receipt = doc; // Continue without logo
      }
      
      // Format receipt
      receipt = receipt
        .align(escpos.TextAlignment.Center)
        // Restaurant name - double height, bold
        .font(escpos.FontFamily.A)
        .style([escpos.FontStyle.Bold])
        .size(0, 1)
        .text('Padmavati Restaurant')
        .feed(1)
        
        // Order Receipt - normal text, bold
        .size(0, 0)
        .text('Order Receipt')
        .feed(1)
        
        // Order No - normal text, bold
        .text(`Order No: ${orderData.orderNo}`)
        .feed(1)
        
        // Divider line
        .text('------------------------------')
        .feed(1)
        
        // Order details - left aligned, normal text
        .align(escpos.TextAlignment.Left)
        .text(`Order ID: ${orderData.orderid}`)
        .feed(1)
        .text(`Date & Time: ${orderData.timeStamp}`)
        .feed(1)
        .text(`Customer: ${orderData.userid}`)
        .feed(1);
      
      // Conditional phone number
      if (orderData.userPhone) {
        receipt = receipt.text(`Phone: ${orderData.userPhone}`).feed(1);
      }
      
      // Payment method
      receipt = receipt
        .text(`Payment: ${orderData.payment || 'Cash'}`)
        .feed(1)
        .text('------------------------------')
        .feed(1)
        
        // Table header
        .style([escpos.FontStyle.Bold])
        .text('Item          Qty  ₹/Unit  Total')
        .feed(1)
        .text('------------------------------')
        .feed(1)
        
        // Reset style for items
        .style([]);
      
      // Add items
      for (const item of orderData.items) {
        // Format item line with proper spacing
        const itemName = item.name.padEnd(14).substring(0, 14);
        const qty = String(item.qty).padStart(2);
        const price = String(item.price).padStart(7);
        const total = String(item.total).padStart(7);
        
        receipt = receipt.text(`${itemName} ${qty}  ${price}  ${total}`).feed(1);
      }
      
      // Add totals
      receipt = receipt
        .text('------------------------------')
        .feed(1)
        .align(escpos.TextAlignment.Right)
        .text(`Subtotal: ₹${orderData.subtotal.toFixed(2)}`)
        .feed(1)
        .text(`Tax (5%): ₹${orderData.tax.toFixed(2)}`)
        .feed(1)
        .style([escpos.FontStyle.Bold])
        .text(`TOTAL: ₹${orderData.total.toFixed(2)}`)
        .feed(1)
        .style([])
        .align(escpos.TextAlignment.Center)
        .feed(1)
        .text('Thank you for dining with us!')
        .feed(1)
        .text('Please visit again')
        .feed(4)
        .cut();
        
      return receipt;
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  };

  // Auto-print when printer is selected
  useEffect(() => {
    if (selectedPrinter && isJSPMReady && !isPrinting) {
      doPrinting();
    }
  }, [selectedPrinter, isJSPMReady]);

  return (
    <div className="text-center p-4">
      <h1 className="text-xl font-bold">Advanced ESC/POS Printing</h1>
      <hr className="my-4" />
      <div>
        <p className="text-sm mb-2">Status: {isJSPMReady ? 'JSPM Connected' : 'Connecting to JSPM...'}</p>
        <p className="text-sm mb-2">Selected Printer: {selectedPrinter || 'None'}</p>
        
        <label className="block font-medium mt-4">Available Printers:</label>
        <select 
          className="border p-2" 
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          disabled={isPrinting}
        >
          <option value="">Select a printer</option>
          {printers.map((printer, index) => (
            <option key={index} value={printer}>{printer}</option>
          ))}
        </select>
      </div>
      <button 
        className="mt-4 p-2 bg-blue-600 text-white rounded" 
        onClick={doPrinting}
        disabled={!selectedPrinter || isPrinting || !isJSPMReady}
      >
        {isPrinting ? 'Printing...' : 'Print Receipt'}
      </button>
      
      {/* Load JSPrintManager Scripts */}
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSPrintManager.js" strategy="beforeInteractive" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSESCPOSBuilder.js" strategy="beforeInteractive" />
    </div>
  );
}