// app/api/print/route.js
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export async function POST(request) {
  try {
    const { printerName } = await request.json();
    
    if (!printerName) {
      return Response.json({ 
        success: false, 
        error: 'Printer name is required' 
      }, { status: 400 });
    }
    
    // Initialize the printer correctly
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // Use PrinterTypes enum instead of ThermalPrinter.types
      interface: `printer:${printerName}`,
      options: {
        timeout: 5000
      }
    });

    // Check if printer is connected
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return Response.json({ 
        success: false, 
        error: 'Printer is not connected' 
      }, { status: 500 });
    }
    
    // Print test page
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("Thermal Printer Test");
    printer.println("------------------------");
    printer.bold(false);
    printer.println("Next.js with node-thermal-printer");
    printer.println("");
    printer.alignLeft();
    printer.println(`Date: ${new Date().toLocaleString()}`);
    printer.println(`Printer: ${printerName}`);
    printer.println("");
    printer.alignCenter();
    printer.printQR("https://nextjs.org", {
      cellSize: 8,
      correction: 'M'
    });
    printer.println("Scan for Next.js docs");
    printer.println("");
    printer.println("Test completed successfully!");
    printer.cut();
    
    // Execute print job
    await printer.execute();
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Printer error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to print' 
    }, { status: 500 });
  }
}