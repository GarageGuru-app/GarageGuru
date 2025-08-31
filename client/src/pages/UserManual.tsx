import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, BookOpen, Languages, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserManual() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to download the user manual.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/generate-user-manual', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate user manual');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition ? 
        contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 
        `Garage_Management_System_User_Manual_${new Date().toISOString().split('T')[0]}.pdf`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "User manual downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading user manual:', error);
      toast({
        title: "Error",
        description: "Failed to download user manual. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Manual
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive guide for using the Garage Management System in both English and Telugu languages.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            గ్యారేజ్ మేనేజ్‌మెంట్ సిస్టమ్ వాడటానికి ఇంగ్లీష్ మరియు తెలుగు భాషల్లో సమగ్ర మార్గదర్శిని.
          </p>
        </div>

        {/* Manual Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-green-600" />
                Bilingual Content
              </CardTitle>
              <CardDescription>
                Complete instructions in both English and Telugu languages
                <br />
                <span className="text-sm">ఇంగ్లీష్ మరియు తెలుగు భాషలలో పూర్తి సూచనలు</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Step-by-step instructions</li>
                <li>• Complete feature coverage</li>
                <li>• Screen-by-screen guidance</li>
                <li>• Troubleshooting tips</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                Comprehensive Guide
              </CardTitle>
              <CardDescription>
                Everything you need to know about the system
                <br />
                <span className="text-sm">సిస్టమ్ గురించి మీరు తెలుసుకోవాల్సినవన్నీ</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• User authentication & login</li>
                <li>• Customer management</li>
                <li>• Job card creation</li>
                <li>• Invoice generation</li>
                <li>• Inventory management</li>
                <li>• Sales analytics</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Table of Contents Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Contents</CardTitle>
            <CardDescription>
              What's included in the user manual
              <br />
              <span className="text-sm">వినియోగదారు మార్గదర్శినిలో ఏమి ఉంది</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">System Basics</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>1. Getting Started</li>
                  <li>2. User Authentication & Login</li>
                  <li>3. Super Admin Features</li>
                  <li>4. Garage Setup & Registration</li>
                  <li>5. Customer Management</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Advanced Features</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>6. Job Card Management</li>
                  <li>7. Spare Parts Inventory</li>
                  <li>8. Invoice Generation</li>
                  <li>9. Sales Analytics & Reports</li>
                  <li>10. System Administration</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Resources</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <ul className="space-y-1">
                  <li>11. Troubleshooting Guide</li>
                  <li>12. Frequently Asked Questions</li>
                </ul>
                <ul className="space-y-1">
                  <li>• Screenshots and visual guides</li>
                  <li>• Common issues and solutions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Download className="h-5 w-5" />
              Download User Manual
            </CardTitle>
            <CardDescription>
              Get the complete PDF manual with screenshots and bilingual instructions
              <br />
              <span className="text-sm">స్క్రీన్‌షాట్‌లు మరియు ద్విభాషా సూచనలతో పూర్తి PDF మార్గదర్శినిని పొందండి</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  What you'll get:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>✓ Complete user manual in PDF format</li>
                  <li>✓ Screenshots of all major features</li>
                  <li>✓ Step-by-step instructions in English and Telugu</li>
                  <li>✓ Troubleshooting guide and FAQ section</li>
                  <li>✓ Ready to print or share with your team</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleDownload} 
                disabled={isGenerating}
                className="w-full md:w-auto"
                size="lg"
                data-testid="button-download-manual"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download User Manual PDF
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF will be downloaded automatically. File size: ~2-3 MB
                <br />
                PDF స్వయంచాలకంగా డౌన్‌లోడ్ అవుతుంది. ఫైల్ పరిమాణం: ~2-3 MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}