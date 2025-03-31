// app/api/printers/route.js
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function GET() {
  try {
    let printers = [];
    
    if (process.platform === 'win32') {
      // Windows - use PowerShell to get printer list
      const { stdout } = await execPromise('powershell -command "Get-Printer | Select-Object -ExpandProperty Name"');
      printers = stdout.split('\r\n').filter(Boolean);
    } else if (process.platform === 'darwin') {
      // macOS
      const { stdout } = await execPromise('lpstat -p | awk \'{print $2}\'');
      printers = stdout.split('\n').filter(Boolean);
    } else {
      // Linux
      const { stdout } = await execPromise('lpstat -a | awk \'{print $1}\'');
      printers = stdout.split('\n').filter(Boolean);
    }
    
    return Response.json({ 
      success: true, 
      printers 
    });
    
  } catch (error) {
    console.error('Error getting printers:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to get printers',
      printers: [] 
    }, { status: 500 });
  }
}