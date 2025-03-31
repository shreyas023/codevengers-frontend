'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function PrintPage() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  
  // Sample order data (static as requested)
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

  useEffect(() => {
    if (window.JSPM) {
      window.JSPM.JSPrintManager.auto_reconnect = true;
      window.JSPM.JSPrintManager.start();
      window.JSPM.JSPrintManager.WS.onStatusChanged = function () {
        if (jspmWSStatus()) {
          window.JSPM.JSPrintManager.getPrinters().then(setPrinters);
        }
      };
    }
  }, []);

  const jspmWSStatus = () => {
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
  };

  const doPrinting = async () => {
    if (!jspmWSStatus()) return;
    const escpos = window.Neodynamic.JSESCPOSBuilder;
    const doc = new escpos.Document();
    
    try {
      // Load and print logo
      const logo = await escpos.ESCPOSImage.load('/logo.png');
      
      // Initialize printer
      let receipt = doc
        .image(logo, escpos.BitmapDensity.D24)
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
        .text(`Order No: ${order.orderNo}`)
        .feed(1)
        
        // Divider line
        .text('------------------------------')
        .feed(1)
        
        // Order details - left aligned, normal text
        .align(escpos.TextAlignment.Left)
        .text(`Order ID: ${order.orderid}`)
        .feed(1)
        .text(`Date & Time: ${order.timeStamp}`)
        .feed(1)
        .text(`Customer: ${order.userid}`)
        .feed(1);
      
      // Conditional phone number
      if (order.userPhone) {
        receipt = receipt.text(`Phone: ${order.userPhone}`).feed(1);
      }
      
      // Payment method
      receipt = receipt
        .text(`Payment: ${order.payment || 'Cash'}`)
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
      for (const item of order.items) {
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
        .text(`Subtotal: ₹${order.subtotal.toFixed(2)}`)
        .feed(1)
        .text(`Tax (5%): ₹${order.tax.toFixed(2)}`)
        .feed(1)
        .style([escpos.FontStyle.Bold])
        .text(`TOTAL: ₹${order.total.toFixed(2)}`)
        .feed(1)
        .style([])
        .align(escpos.TextAlignment.Center)
        .feed(1)
        .text('Thank you for dining with us!')
        .feed(1)
        .text('Please visit again')
        .feed(4)
        .cut();
      
      // Generate commands and send to printer
      const escposCommands = receipt.generateUInt8Array();
      const cpj = new window.JSPM.ClientPrintJob();
      cpj.clientPrinter = new window.JSPM.InstalledPrinter(selectedPrinter);
      cpj.binaryPrinterCommands = escposCommands;
      cpj.sendToClient();
      
    } catch (error) {
      console.error('Printing error:', error);
    }
  };

  return (
    <div className="text-center p-4">
      <h1 className="text-xl font-bold">Advanced ESC/POS Printing</h1>
      <hr className="my-4" />
      <div>
        <label className="block font-medium">Select an installed Printer:</label>
        <select className="border p-2" onChange={(e) => setSelectedPrinter(e.target.value)}>
          <option value="">Select a printer</option>
          {printers.map((printer, index) => (
            <option key={index} value={printer}>{printer}</option>
          ))}
        </select>
      </div>
      <button 
        className="mt-4 p-2 bg-blue-600 text-white rounded" 
        onClick={doPrinting}
        disabled={!selectedPrinter}
      >
        Print Receipt
      </button>
      {/* Load JSPrintManager Scripts */}
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSPrintManager.js" strategy="lazyOnload" />
      <Script src="https://jsprintmanager.azurewebsites.net/scripts/JSESCPOSBuilder.js" strategy="lazyOnload" />
    </div>
  );
}