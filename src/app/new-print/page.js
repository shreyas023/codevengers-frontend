'use client';
import { useState, useEffect } from 'react';
import { create } from 'zustand';

// Create a store for printer state
const usePrinterStore = create((set) => ({
  printers: [],
  selectedPrinter: '',
  isConnected: false,
  isLoading: false,
  error: null,
  setPrinters: (printers) => set({ printers }),
  setSelectedPrinter: (printer) => set({ selectedPrinter: printer }),
  setConnected: (status) => set({ isConnected: status }),
  setLoading: (status) => set({ isLoading: status }),
  setError: (error) => set({ error }),
}));

// Sample order data
const sampleOrder = {
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

export default function PrintPage() {
  const { 
    printers, 
    selectedPrinter, 
    isConnected, 
    isLoading,
    error,
    setPrinters, 
    setSelectedPrinter, 
    setConnected,
    setLoading,
    setError
  } = usePrinterStore();
  
  // Initialize JSPM
  useEffect(() => {
    let jspmInstance = null;
    
    const initJSPM = async () => {
      try {
        setLoading(true);
        
        // Import JSPM dynamically to avoid SSR issues
        const JSPM = await import('jsprintmanager');
        jspmInstance = JSPM;
        
        // Configure JSPrintManager
        JSPM.JSPrintManager.auto_reconnect = true;
        await JSPM.JSPrintManager.start();
        
        // Listen for WebSocket status changes
        JSPM.JSPrintManager.WS.onStatusChanged = async () => {
          const status = JSPM.JSPrintManager.websocket_status;
          
          if (status === JSPM.WSStatus.Open) {
            setConnected(true);
            try {
              // Get available printers
              const printersList = await JSPM.JSPrintManager.getPrinters();
              setPrinters(printersList);
            } catch (err) {
              setError(`Failed to get printers: ${err.message}`);
            }
          } else {
            setConnected(false);
            
            if (status === JSPM.WSStatus.Closed) {
              setError('JSPrintManager is not installed or not running');
            } else if (status === JSPM.WSStatus.Blocked) {
              setError('JSPrintManager has blocked this website');
            }
          }
        };
        
      } catch (err) {
        setError(`Failed to initialize printer: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initJSPM();
    
    // Cleanup on component unmount
    return () => {
      if (jspmInstance) {
        jspmInstance.JSPrintManager.stop();
      }
    };
  }, [setPrinters, setConnected, setLoading, setError]);
  
  // Handle printer selection
  const handlePrinterChange = (e) => {
    setSelectedPrinter(e.target.value);
  };
  
  // Print receipt
  const printReceipt = async (order) => {
    if (!isConnected) {
      setError('Printer not connected. Please check JSPrintManager status.');
      return;
    }
    
    if (!selectedPrinter) {
      setError('Please select a printer first.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Import modules dynamically
      const JSPM = await import('jsprintmanager');
      
      // We need to also get the Neodynamic.JSESCPOSBuilder which is provided by jsprintmanager
      // But we need to access it from the window object after it's loaded
      if (!window.Neodynamic || !window.Neodynamic.JSESCPOSBuilder) {
        setError('JSESCPOSBuilder not available. Please check if jsprintmanager is properly installed.');
        setLoading(false);
        return;
      }
      
      const escpos = window.Neodynamic.JSESCPOSBuilder;
      const doc = new escpos.Document();
      
      try {
        // Try to load the logo
        const logo = await escpos.ESCPOSImage.load('/logo.png');
        doc.image(logo, escpos.BitmapDensity.D24);
      } catch (logoErr) {
        console.warn('Failed to load logo, continuing without it:', logoErr);
        // Continue without the logo
      }
      
      // Build receipt content
      let receipt = doc
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
      
      // Generate ESC/POS commands
      const escposCommands = receipt.generateUInt8Array();
      
      // Create print job
      const cpj = new JSPM.ClientPrintJob();
      cpj.clientPrinter = new JSPM.InstalledPrinter(selectedPrinter);
      cpj.binaryPrinterCommands = escposCommands;
      
      // Send to printer
      cpj.sendToClient();
      
      console.log('Print job sent successfully');
    } catch (err) {
      setError(`Printing error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">ESC/POS Receipt Printer</h1>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">
            {isConnected ? 'Connected to JSPrintManager' : 'Not connected to JSPrintManager'}
          </span>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Printer Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select an installed Printer:</label>
        <select 
          className="w-full p-2 border rounded-md bg-white"
          value={selectedPrinter}
          onChange={handlePrinterChange}
          disabled={!isConnected || isLoading}
        >
          <option value="">Select a printer</option>
          {printers.map((printer, index) => (
            <option key={index} value={printer}>{printer}</option>
          ))}
        </select>
      </div>
      
      {/* Print Button */}
      <button 
        className="w-full p-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        onClick={() => printReceipt(sampleOrder)}
        disabled={!isConnected || !selectedPrinter || isLoading}
      >
        {isLoading ? 'Printing...' : 'Print Receipt'}
      </button>
      
      {/* Receipt Preview */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-3">Receipt Preview:</h2>
        <div className="border rounded-md p-4 font-mono text-sm whitespace-pre-wrap bg-gray-50">
          <div className="text-center">
            <div className="font-bold">Padmavati Restaurant</div>
            <div>Order Receipt</div>
            <div>Order No: {sampleOrder.orderNo}</div>
          </div>
          <div className="text-center">------------------------------</div>
          <div>Order ID: {sampleOrder.orderid}</div>
          <div>Date & Time: {sampleOrder.timeStamp}</div>
          <div>Customer: {sampleOrder.userid}</div>
          {sampleOrder.userPhone && <div>Phone: {sampleOrder.userPhone}</div>}
          <div>Payment: {sampleOrder.payment || 'Cash'}</div>
          <div className="text-center">------------------------------</div>
          <div>Item          Qty  ₹/Unit  Total</div>
          <div className="text-center">------------------------------</div>
          {sampleOrder.items.map((item, index) => (
            <div key={index}>
              {item.name.padEnd(14).substring(0, 14)} {String(item.qty).padStart(2)}  {String(item.price).padStart(7)}  {String(item.total).padStart(7)}
            </div>
          ))}
          <div className="text-center">------------------------------</div>
          <div className="text-right">Subtotal: ₹{sampleOrder.subtotal.toFixed(2)}</div>
          <div className="text-right">Tax (5%): ₹{sampleOrder.tax.toFixed(2)}</div>
          <div className="text-right font-bold">TOTAL: ₹{sampleOrder.total.toFixed(2)}</div>
          <div className="text-center mt-2">
            <div>Thank you for dining with us!</div>
            <div>Please visit again</div>
          </div>
        </div>
      </div>
    </div>
  );
}