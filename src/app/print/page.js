'use client';

import { useEffect, useState } from 'react';

export default function ThermalPrinterTest() {
  const [status, setStatus] = useState('Click to print test page');
  const [error, setError] = useState(null);

  const printTestPage = async () => {
    try {
      setStatus('Sending print job...');
      
      // Call the server action to print
      const response = await fetch('/api/print', {
        method: 'POST',
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
            Device: USB Thermal Printer<br />
            Driver: Zadig<br />
            Library: escpos
          </p>
        </div>
        
        <button
          onClick={printTestPage}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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