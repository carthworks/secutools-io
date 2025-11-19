"use client";
import { useState, useEffect } from 'react';

const CertificateParser = () => {
  const [certificate, setCertificate] = useState<string>('');
  const [certificateType, setCertificateType] = useState<'PEM' | 'DER'>('PEM');
  const [parsedDetails, setParsedDetails] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCertificate = () => {
    setError(null);
    setParsedDetails(null);

    try {
      if (!certificate.trim()) {
        throw new Error('Certificate content is empty');
      }

      // Simulate parsing logic (in a real app, you would use a proper library)
      const simulatedDetails: Record<string, string> = {};

      if (certificateType === 'PEM') {
        if (!certificate.includes('-----BEGIN CERTIFICATE-----') || 
            !certificate.includes('-----END CERTIFICATE-----')) {
          throw new Error('Invalid PEM format');
        }
        simulatedDetails['Format'] = 'PEM (Base64 ASCII)';
      } else {
        // DER is binary, but we're just simulating here
        simulatedDetails['Format'] = 'DER (Binary)';
      }

      // Simulate common certificate fields
      simulatedDetails['Subject'] = 'CN=example.com, O=Example Organization, C=US';
      simulatedDetails['Issuer'] = 'CN=Example CA, O=Certificate Authority, C=US';
      simulatedDetails['Valid From'] = '2023-01-01';
      simulatedDetails['Valid Until'] = '2024-01-01';
      simulatedDetails['Serial Number'] = '1234567890ABCDEF';
      simulatedDetails['Signature Algorithm'] = 'SHA256WithRSAEncryption';
      simulatedDetails['Public Key'] = 'RSA (2048 bit)';

      setParsedDetails(simulatedDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse certificate');
    }
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCertificate(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateType(e.target.value as 'PEM' | 'DER');
  };

  const clearAll = () => {
    setCertificate('');
    setParsedDetails(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Certificate Parser</h1>
      
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="certType"
              value="PEM"
              checked={certificateType === 'PEM'}
              onChange={handleTypeChange}
            />
            <span className="ml-2">PEM Format</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="certType"
              value="DER"
              checked={certificateType === 'DER'}
              onChange={handleTypeChange}
            />
            <span className="ml-2">DER Format</span>
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificate Content
        </label>
        <textarea
          className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder={
            certificateType === 'PEM' 
              ? 'Paste PEM certificate (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)' 
              : 'Paste DER certificate content (binary)'
          }
          value={certificate}
          onChange={handleCertificateChange}
        />
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={parseCertificate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Parse Certificate
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {parsedDetails && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <h2 className="bg-gray-100 px-4 py-3 font-medium text-gray-800">Certificate Details</h2>
          <div className="divide-y divide-gray-200">
            {Object.entries(parsedDetails).map(([key, value]) => (
              <div key={key} className="px-4 py-3 flex">
                <div className="w-1/3 font-medium text-gray-700">{key}</div>
                <div className="w-2/3 text-gray-900 break-all">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>Note: This is a simulation. In a real application, you would use a proper certificate parsing library.</p>
      </div>
    </div>
  );
};

export default CertificateParser;