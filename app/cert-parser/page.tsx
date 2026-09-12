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
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Certificate Parser</h1>
      
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="inline-flex items-center cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              className="form-radio text-indigo-600 focus:ring-indigo-500"
              name="certType"
              value="PEM"
              checked={certificateType === 'PEM'}
              onChange={handleTypeChange}
            />
            <span className="ml-2">PEM Format</span>
          </label>
          <label className="inline-flex items-center cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              className="form-radio text-indigo-600 focus:ring-indigo-500"
              name="certType"
              value="DER"
              checked={certificateType === 'DER'}
              onChange={handleTypeChange}
            />
            <span className="ml-2">DER Format</span>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Certificate Content
        </label>
        <textarea
          className="w-full h-64 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={
            certificateType === 'PEM' 
              ? 'Paste PEM certificate (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)' 
              : 'Paste DER certificate content (binary)'
          }
          value={certificate}
          onChange={handleCertificateChange}
        />
      </div>

      <div className="flex space-x-3 mb-6">
        <button
          onClick={parseCertificate}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
        >
          Parse Certificate
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 text-rose-700 dark:text-rose-300 rounded-r-lg">
          <p>{error}</p>
        </div>
      )}

      {parsedDetails && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <h2 className="bg-slate-100 dark:bg-slate-800 px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Certificate Details</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {Object.entries(parsedDetails).map(([key, value]) => (
              <div key={key} className="px-4 py-3 flex">
                <div className="w-1/3 font-medium text-slate-700 dark:text-slate-300">{key}</div>
                <div className="w-2/3 text-slate-900 dark:text-slate-100 break-all font-mono text-sm">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        <p>Note: This is a simulation. In a real application, you would use a proper certificate parsing library.</p>
      </div>
    </div>
  );
};

export default CertificateParser;