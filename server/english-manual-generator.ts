import PDFDocument from 'pdfkit';

interface ManualSection {
  title: string;
  content: string;
  steps?: string[];
}

export class EnglishManualGenerator {
  private doc: any;
  private pageHeight: number = 792;
  private pageWidth: number = 612;
  private margin: number = 50;
  private currentY: number = 50;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader() {
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('GarageGuru', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 30;
    
    this.doc
      .fontSize(18)
      .font('Helvetica')
      .fillColor('#374151')
      .text('Automotive Garage Management System', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 25;
    
    this.doc
      .fontSize(14)
      .fillColor('#6b7280')
      .text('Complete User Manual', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 50;
  }

  private addTableOfContents() {
    this.doc.addPage();
    this.currentY = this.margin;
    
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text('Table of Contents', this.margin, this.currentY);
    
    this.currentY += 40;
    
    const sections = [
      '1. System Overview and Login',
      '2. Customer Management',
      '3. Job Card Management',
      '4. Spare Parts Inventory',
      '5. Invoice Generation',
      '6. Sales Analytics',
      '7. Barcode Scanning',
      '8. User Roles and Access Control',
      '9. Mobile Features',
      '10. Troubleshooting',
      '11. Support Information'
    ];
    
    sections.forEach(section => {
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#374151')
        .text(section, this.margin + 20, this.currentY);
      
      this.currentY += 20;
    });
    
    this.currentY += 30;
  }

  private addTitle(title: string) {
    this.checkPageBreak(100);
    
    this.doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(title, this.margin, this.currentY);
    
    this.currentY += 35;
  }

  private addContent(content: string) {
    this.checkPageBreak(100);
    
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#374151')
      .text(content, this.margin, this.currentY, {
        width: this.pageWidth - (this.margin * 2),
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(content, {
      width: this.pageWidth - (this.margin * 2)
    }) + 20;
  }

  private addSteps(steps: string[]) {
    steps.forEach((step, index) => {
      this.checkPageBreak(60);
      
      this.doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text(`${index + 1}. ${step}`, this.margin + 20, this.currentY, {
          width: this.pageWidth - (this.margin * 2) - 20
        });
      
      this.currentY += this.doc.heightOfString(`${index + 1}. ${step}`, {
        width: this.pageWidth - (this.margin * 2) - 20
      }) + 12;
    });
    
    this.currentY += 15;
  }

  private addSection(section: ManualSection) {
    this.addTitle(section.title);
    this.addContent(section.content);
    
    if (section.steps && section.steps.length > 0) {
      this.addSteps(section.steps);
    }
  }

  generateManual(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      this.doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      this.doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      this.doc.on('error', (error: any) => {
        reject(error);
      });
    this.addHeader();
    this.addTableOfContents();
    
    // Section 1: System Overview and Login
    this.addSection({
      title: "1. System Overview and Login",
      content: "GarageGuru is a comprehensive automotive garage management system designed to streamline operations for garage owners. The system provides complete management of customers, spare parts inventory, job cards, and invoices with role-based access control.",
      steps: [
        "Access the system at http://localhost:5000",
        "Enter your email and password on the login screen",
        "For Super Admin: ananthautomotivegarage@gmail.com / Ananth123",
        "For Garage Admin: admin@ananthauto.com / Admin123",
        "Click 'Login' to access your dashboard"
      ]
    });

    // Section 2: Customer Management
    this.addSection({
      title: "2. Customer Management",
      content: "The customer management module allows you to maintain a complete database of your customers with their vehicle information, service history, and contact details. Each customer record includes bike details, total jobs completed, and total amount spent.",
      steps: [
        "Navigate to 'Customers' from the main menu",
        "Click 'Add Customer' to create a new customer record",
        "Fill in customer details: name, phone, bike number, model, and year",
        "Save the customer record and it will appear in the customer list",
        "Use the search function to quickly find existing customers",
        "View customer service history and statistics from their profile"
      ]
    });

    // Section 3: Job Card Management
    this.addSection({
      title: "3. Job Card Management",
      content: "Job cards are the core of your service operations. They track each service request from start to completion, including customer details, complaints, spare parts used, service charges, and final amounts.",
      steps: [
        "Go to 'Job Cards' section from the dashboard",
        "Click 'Create Job Card' to start a new service request",
        "Select existing customer or add new customer details",
        "Enter the customer complaint or service description",
        "Add spare parts used by selecting from inventory",
        "Set service charges and the total amount will be calculated automatically",
        "Mark job as complete when service is finished",
        "Generate invoice from completed job cards"
      ]
    });

    // Section 4: Spare Parts Inventory
    this.addSection({
      title: "4. Spare Parts Inventory Management",
      content: "Comprehensive inventory management with barcode scanning, low stock alerts, and cost price tracking for profit calculations. The system prevents duplicate entries and provides real-time stock levels.",
      steps: [
        "Access 'Spare Parts' from the main navigation",
        "Click 'Add Spare Part' to add new inventory items",
        "Enter part details: name, part number, selling price, cost price, and quantity",
        "Use barcode scanner to quickly add parts by scanning product codes",
        "Set low stock thresholds to receive automatic alerts",
        "Monitor inventory levels and reorder when stock is low",
        "Track cost vs selling price for profit analysis"
      ]
    });

    // Section 5: Invoice Generation
    this.addSection({
      title: "5. Invoice Generation and WhatsApp Integration",
      content: "Generate professional PDF invoices with your garage logo and send them directly to customers via WhatsApp. The system automatically calculates totals and maintains invoice history.",
      steps: [
        "Complete a job card to make it ready for invoicing",
        "Click 'Generate Invoice' button on the completed job card",
        "Review invoice details including parts, service charges, and total amount",
        "Download PDF invoice for printing or digital sharing",
        "Send invoice directly to customer via WhatsApp with one click",
        "Track sent invoices in the invoice history section",
        "Customize invoice with your garage logo and branding"
      ]
    });

    // Section 6: Sales Analytics
    this.addSection({
      title: "6. Sales Analytics and Reporting",
      content: "Comprehensive analytics dashboard showing revenue trends, profit calculations, parts vs service revenue breakdown, and customer statistics. Monitor your garage performance with real-time data.",
      steps: [
        "Navigate to 'Analytics' or 'Dashboard' section",
        "View daily, weekly, and monthly revenue charts",
        "Monitor parts revenue vs service revenue breakdown",
        "Track profit margins using cost price vs selling price data",
        "View customer statistics including total customers and repeat customers",
        "Export reports for accounting and business analysis",
        "Set performance goals and track progress"
      ]
    });

    // Section 7: Barcode Scanning
    this.addSection({
      title: "7. Barcode Scanning and Code Reading",
      content: "Advanced barcode scanning with dual detection technology supporting multiple formats. Mobile-optimized with torch support and automatic field population from scanned codes.",
      steps: [
        "Click the barcode scanner icon in spare parts or job card sections",
        "Allow camera access when prompted by the browser",
        "Point camera at barcode or QR code to scan automatically",
        "Use torch/flashlight button for scanning in low light conditions",
        "Scanned data automatically populates relevant fields",
        "Review and confirm the scanned information before saving",
        "Supports multiple formats: QR codes, barcodes, product codes"
      ]
    });

    // Section 8: User Roles and Access Control
    this.addSection({
      title: "8. User Roles and Access Control",
      content: "Three-tier role-based access system: Super Admin manages multiple garages, Garage Admin manages garage operations, and Mechanic Staff handles day-to-day service tasks.",
      steps: [
        "Super Admin: Full system access, manage all garages and users",
        "Garage Admin: Manage garage operations, customers, inventory, reports",
        "Mechanic Staff: Create job cards, update service status, basic operations",
        "Access levels are automatically enforced based on user role",
        "Password policies and security measures protect sensitive data",
        "User activity is logged for audit and security purposes"
      ]
    });

    // Section 9: Mobile Features
    this.addSection({
      title: "9. Mobile Responsiveness and PWA Features",
      content: "Fully responsive design optimized for mobile devices with Progressive Web App (PWA) capabilities. Works offline and can be installed as a native app on mobile devices.",
      steps: [
        "Access the system from any mobile browser (Chrome, Safari, etc.)",
        "Interface automatically adapts to screen size and orientation",
        "Touch-friendly buttons and inputs optimized for mobile use",
        "Install as a mobile app using 'Add to Home Screen' feature",
        "Offline capabilities allow basic operations without internet",
        "Camera integration for barcode scanning on mobile devices"
      ]
    });

    // Section 10: Troubleshooting
    this.addSection({
      title: "10. Troubleshooting and FAQ",
      content: "Common issues and their solutions to help you get the most out of GarageGuru. This section covers login problems, performance issues, and feature-specific troubleshooting.",
      steps: [
        "Login Issues: Check email format and password case sensitivity",
        "Slow Performance: Clear browser cache and refresh the page",
        "Barcode Scanner: Ensure camera permissions are granted",
        "PDF Download Issues: Check browser popup blocker settings",
        "Data Not Saving: Verify internet connection and try again",
        "WhatsApp Integration: Ensure phone numbers include country code",
        "Invoice Generation: Check if job card is marked as completed"
      ]
    });

    // Section 11: Support Information
    this.addSection({
      title: "11. Contact and Support",
      content: "For technical support, feature requests, or any questions about GarageGuru, please contact our support team. We provide comprehensive assistance to ensure your garage operations run smoothly.",
      steps: [
        "Email Support: ananthautomotivegarage@gmail.com",
        "Phone Support: +91 9876543210",
        "Business Hours: Monday to Saturday, 9 AM to 6 PM",
        "Emergency Support: Available 24/7 for critical issues",
        "Online Documentation: Available within the system",
        "Training Sessions: Available upon request"
      ]
    });

    // Add footer
    this.doc.addPage();
    this.currentY = this.pageHeight - 100;
    
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('GarageGuru - Automotive Management System', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 15;
    
    this.doc
      .text('© 2024 Ananth Automotive. All rights reserved.', this.margin, this.currentY, { align: 'center' });

      this.doc.end();
    });
  }
}