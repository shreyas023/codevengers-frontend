'use client';

import { useEffect, useState } from 'react';

export default function ThermalPrinterTest() {
  const [status, setStatus] = useState('Click to print test page');
  const [error, setError] = useState(null);
  const [printerName, setPrinterName] = useState('');
  const [availablePrinters, setAvailablePrinters] = useState([]);

  useEffect(() => {
    // Fetch available printers when component mounts
    const getPrinters = async () => {
      try {
        const response = await fetch('/api/printers');
        const data = await response.json();
        if (data.success) {
          setAvailablePrinters(data.printers);
          if (data.printers.length > 0) {
            setPrinterName(data.printers[0]);
          }
        }
      } catch (err) {
        setError("Failed to fetch printers");
      }
    };

    getPrinters();
  }, []);

  const printTestPage = async () => {
    try {
      setStatus('Sending print job...');
      setError(null);
      
      // Call the server action to print
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerName }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus('Print job sent successfully!');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err.message);
      setStatus('Failed to print');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">Thermal Printer Test</h1>
        
        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <p className="font-mono text-sm">
            Using node-thermal-printer library
          </p>
        </div>

        {availablePrinters.length > 0 ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Printer:
            </label>
            <select 
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {availablePrinters.map(printer => (
                <option key={printer} value={printer}>{printer}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded border border-yellow-200">
            No printers found. Make sure your printer is connected and properly installed.
          </div>
        )}
        
        <button
          onClick={printTestPage}
          disabled={!printerName}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
        >
          Print Test Page
        </button>
        
        <div className="mt-4 text-center">
          <p className={`font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>
            {status}
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              Error: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}