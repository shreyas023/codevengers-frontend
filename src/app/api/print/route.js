// app/api/print/route.js
import escpos from 'escpos';
// Import USB adapter
import USB from 'escpos-usb';
// Register the USB adapter
escpos.USB = USB;

export async function POST() {
  try {
    // Find USB device
    const device = new escpos.USB();
    
    // Create printer instance
    const printer = new escpos.Printer(device);
    
    // Connect to the printer and print test page
    device.open(function() {
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('Thermal Printer Test')
        .text('------------------------')
        .text('Next.js with escpos')
        .text('')
        .align('lt')
        .text('Date: ' + new Date().toLocaleString())
        .text('Device: USB Thermal Printer')
        .text('Driver: Zadig')
        .text('')
        .align('ct')
        .qrcode('https://nextjs.org')
        .text('Scan for Next.js docs')
        .text('')
        .text('Test completed successfully!')
        .cut()
        .close();
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Printer error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to connect to printer' 
    }, { status: 500 });
  }
}