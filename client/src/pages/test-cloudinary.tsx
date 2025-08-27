import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInvoicePDF, uploadPDFToCloudinary } from "@/utils/pdf-generator";

export default function TestCloudinary() {
  const [status, setStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const testPDFUpload = async () => {
    setIsUploading(true);
    setStatus('🚀 Starting PDF upload test...');

    try {
      // Create sample invoice data
      const sampleJobCard = {
        id: 'test-123',
        customer: {
          name: 'Test Customer',
          phone: '9876543210',
          bike_number: 'TS09EA1234'
        },
        service_charges: 500,
        parts: [
          { name: 'Test Part 1', quantity: 1, unit_price: 200, total_price: 200 },
          { name: 'Test Part 2', quantity: 2, unit_price: 150, total_price: 300 }
        ]
      };

      const sampleInvoice = {
        invoice_number: 'TEST-001',
        created_at: new Date().toISOString(),
        total_amount: 1000
      };

      setStatus('📄 Generating PDF...');
      
      // Generate PDF
      const pdfBlob = await generateInvoicePDF(sampleJobCard, sampleInvoice);

      setStatus('☁️ Uploading to Cloudinary...');
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadPDFToCloudinary(pdfBlob, 'test-invoice-001');
      
      if (cloudinaryUrl) {
        setStatus(`✅ SUCCESS! PDF uploaded to: ${cloudinaryUrl}`);
      } else {
        setStatus('❌ Upload failed - check console for details');
      }

    } catch (error) {
      console.error('Test failed:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Cloudinary Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Test the fixed Cloudinary PDF upload functionality with a sample invoice.
            </p>
            
            <Button 
              onClick={testPDFUpload} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Testing Upload...' : '🚀 Test PDF Upload'}
            </Button>

            {status && (
              <div className="p-4 bg-gray-100 rounded-md">
                <p className="text-sm font-mono whitespace-pre-wrap">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}