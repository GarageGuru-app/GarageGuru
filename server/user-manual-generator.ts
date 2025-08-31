import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ManualSection {
  titleEn: string;
  titleTe: string;
  contentEn: string;
  contentTe: string;
  screenshots?: string[];
  steps?: {
    stepEn: string;
    stepTe: string;
  }[];
}

export class UserManualGenerator {
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

  private addTitle(titleEn: string, titleTe: string) {
    this.checkPageBreak(100);
    
    // English Title
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(titleEn, this.margin, this.currentY);
    
    this.currentY += 30;
    
    // Telugu Title (if different from English)
    if (titleTe !== titleEn) {
      this.doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(titleTe, this.margin, this.currentY);
      
      this.currentY += 30;
    }
    
    this.currentY += 10;
  }

  private addContent(contentEn: string, contentTe: string) {
    this.checkPageBreak(100);
    
    // English Content
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#374151')
      .text(contentEn, this.margin, this.currentY, {
        width: this.pageWidth - (this.margin * 2),
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(contentEn, {
      width: this.pageWidth - (this.margin * 2)
    }) + 15;
    
    // Telugu Content
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text(contentTe, this.margin, this.currentY, {
        width: this.pageWidth - (this.margin * 2),
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(contentTe, {
      width: this.pageWidth - (this.margin * 2)
    }) + 20;
  }

  private addSteps(steps: { stepEn: string; stepTe: string }[]) {
    steps.forEach((step, index) => {
      this.checkPageBreak(80);
      
      // Step number and English text
      this.doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text(`${index + 1}. ${step.stepEn}`, this.margin + 20, this.currentY, {
          width: this.pageWidth - (this.margin * 2) - 20
        });
      
      this.currentY += this.doc.heightOfString(`${index + 1}. ${step.stepEn}`, {
        width: this.pageWidth - (this.margin * 2) - 20
      }) + 5;
      
      // Telugu step text
      this.doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#065f46')
        .text(`   ${step.stepTe}`, this.margin + 20, this.currentY, {
          width: this.pageWidth - (this.margin * 2) - 20
        });
      
      this.currentY += this.doc.heightOfString(`   ${step.stepTe}`, {
        width: this.pageWidth - (this.margin * 2) - 20
      }) + 10;
    });
    
    this.currentY += 10;
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addScreenshotPlaceholder(description: string) {
    this.checkPageBreak(150);
    
    // Screenshot placeholder box
    this.doc
      .rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 120)
      .stroke('#d1d5db');
    
    // Screenshot description
    this.doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .fillColor('#6b7280')
      .text(`Screenshot: ${description}`, this.margin + 10, this.currentY + 50, {
        width: this.pageWidth - (this.margin * 2) - 20,
        align: 'center'
      });
    
    this.currentY += 140;
  }

  public generateManual(): Buffer {
    // Cover Page
    this.addCoverPage();
    
    // Table of Contents
    this.addTableOfContents();
    
    // Manual Sections
    const sections: ManualSection[] = [
      {
        titleEn: "1. Getting Started",
        titleTe: "1. ప్రారంభించడం",
        contentEn: "Welcome to the Garage Management System. This comprehensive software solution helps you manage your automotive service business efficiently.",
        contentTe: "గ్యారేజ్ మేనేజ్‌మెంట్ సిస్టమ్‌కు స్వాగతం. ఈ సమగ్ర సాఫ్ట్‌వేర్ పరిష్కారం మీ ఆటోమోటివ్ సేవా వ్యాపారాన్ని సమర్థవంతంగా నిర్వహించడంలో సహాయపడుతుంది.",
        steps: [
          {
            stepEn: "Open your web browser and navigate to the application URL",
            stepTe: "మీ వెబ్ బ్రౌజర్‌ను తెరిచి అప్లికేషన్ URL కు వెళ్లండి"
          },
          {
            stepEn: "You will see the login screen where you can access the system",
            stepTe: "మీరు లాగిన్ స్క్రీన్‌ను చూస్తారు, అక్కడ మీరు సిస్టమ్‌ను యాక్సెస్ చేయవచ్చు"
          }
        ]
      },
      {
        titleEn: "2. User Authentication & Login",
        titleTe: "2. వినియోగదారు ప్రమాණీకరణ మరియు లాగిన్",
        contentEn: "The system uses secure email-based authentication with OTP (One-Time Password) verification for enhanced security.",
        contentTe: "సిస్టమ్ మెరుగైన భద్రత కోసం OTP (వన్-టైమ్ పాస్‌వర్డ్) ధృవీకరణతో సురక్షిత ఇమెయిల్ ఆధారిత ప్రమాణీకరణను ఉపయోగిస్తుంది.",
        steps: [
          {
            stepEn: "Enter your registered email address in the login form",
            stepTe: "లాగిన్ ఫారమ్‌లో మీ నమోదిత ఇమెయిల్ చిరునామాను నమోదు చేయండి"
          },
          {
            stepEn: "Click 'Send OTP' to receive a verification code",
            stepTe: "ధృవీకరణ కోడ్‌ను స్వీకరించడానికి 'Send OTP' క్లిక్ చేయండి"
          },
          {
            stepEn: "Check your email for the 6-digit OTP code",
            stepTe: "6-అంకెల OTP కోడ్ కోసం మీ ఇమెయిల్‌ను తనిఖీ చేయండి"
          },
          {
            stepEn: "Enter the OTP code and click 'Verify & Login'",
            stepTe: "OTP కోడ్‌ను నమోదు చేసి 'Verify & Login' క్లిక్ చేయండి"
          }
        ]
      },
      {
        titleEn: "3. Super Admin Features",
        titleTe: "3. సూపర్ అడ్మిన్ ఫీచర్లు",
        contentEn: "Super admins have full system access and can manage all garages, approve new registrations, and access system-wide analytics.",
        contentTe: "సూపర్ అడ్మిన్‌లకు పూర్తి సిస్టమ్ యాక్సెస్ ఉంది మరియు అన్ని గ్యారేజీలను నిర్వహించవచ్చు, కొత్త రిజిస్ట్రేషన్‌లను ఆమోదించవచ్చు మరియు సిస్టమ్-వైడ్ అనలిటిక్స్‌ను యాక్సెస్ చేయవచ్చు.",
        steps: [
          {
            stepEn: "Access the Super Admin Dashboard after login",
            stepTe: "లాగిన్ తర్వాత సూపర్ అడ్మిన్ డ్యాష్‌బోర్డ్‌ను యాక్సెస్ చేయండి"
          },
          {
            stepEn: "View and manage all registered garages",
            stepTe: "అన్ని నమోదిత గ్యారేజీలను వీక్షించండి మరియు నిర్వహించండి"
          },
          {
            stepEn: "Approve or reject new garage registration requests",
            stepTe: "కొత్త గ్యారేజ్ రిజిస్ట్రేషన్ అభ్యర్థనలను ఆమోదించండి లేదా తిరస్కరించండి"
          }
        ]
      },
      {
        titleEn: "4. Garage Setup & Registration",
        titleTe: "4. గ్యారేజ్ సెటప్ మరియు రిజిస్ట్రేషన్",
        contentEn: "New garages can register through the system and set up their business profile with complete information.",
        contentTe: "కొత్త గ్యారేజీలు సిస్టమ్ ద్వారా నమోదు చేసుకోవచ్చు మరియు పూర్తి సమాచారంతో వారి వ్యాపార ప్రొఫైల్‌ను సెటప్ చేయవచ్చు.",
        steps: [
          {
            stepEn: "Click 'Register New Garage' from the main menu",
            stepTe: "ప్రధాన మెనూ నుండి 'Register New Garage' క్లిక్ చేయండి"
          },
          {
            stepEn: "Fill in garage details: name, address, contact information",
            stepTe: "గ్యారేజ్ వివరాలను పూరించండి: పేరు, చిరునామా, సంప్రదింపు సమాచారం"
          },
          {
            stepEn: "Upload garage logo and business documents",
            stepTe: "గ్యారేజ్ లోగో మరియు వ్యాపార పత్రాలను అప్‌లోడ్ చేయండి"
          },
          {
            stepEn: "Submit registration for super admin approval",
            stepTe: "సూపర్ అడ్మిన్ ఆమోదం కోసం రిజిస్ట్రేషన్‌ను సమర్పించండి"
          }
        ]
      },
      {
        titleEn: "5. Customer Management",
        titleTe: "5. కస్టమర్ మేనేజ్‌మెంట్",
        contentEn: "Efficiently manage customer information, vehicle details, and service history with comprehensive tracking capabilities.",
        contentTe: "సమగ్ర ట్రాకింగ్ సామర్థ్యాలతో కస్టమర్ సమాచారం, వాహన వివరాలు మరియు సేవా చరిత్రను సమర్థవంతంగా నిర్వహించండి.",
        steps: [
          {
            stepEn: "Navigate to 'Customers' section from the dashboard",
            stepTe: "డ్యాష్‌బోర్డ్ నుండి 'Customers' విభాగానికి వెళ్లండి"
          },
          {
            stepEn: "Click 'Add New Customer' to register new clients",
            stepTe: "కొత్త క్లయింట్‌లను నమోదు చేయడానికి 'Add New Customer' క్లిక్ చేయండి"
          },
          {
            stepEn: "Enter customer details: name, phone, vehicle information",
            stepTe: "కస్టమర్ వివరాలను నమోదు చేయండి: పేరు, ఫోన్, వాహన సమాచారం"
          },
          {
            stepEn: "Save customer profile for future service tracking",
            stepTe: "భవిష్యత్తు సేవా ట్రాకింగ్ కోసం కస్టమర్ ప్రొఫైల్‌ను సేవ్ చేయండి"
          }
        ]
      },
      {
        titleEn: "6. Job Card Management",
        titleTe: "6. జాబ్ కార్డ్ మేనేజ్‌మెంట్",
        contentEn: "Create, track, and manage service requests with detailed job cards that include labor, parts, and service descriptions.",
        contentTe: "లేబర్, పార్ట్స్ మరియు సేవా వివరణలను కలిగి ఉన్న వివరణాత్మక జాబ్ కార్డ్‌లతో సేవా అభ్యర్థనలను సృష్టించండి, ట్రాక్ చేయండి మరియు నిర్వహించండి.",
        steps: [
          {
            stepEn: "Go to 'Job Cards' section and click 'Create New Job'",
            stepTe: "'Job Cards' విభాగానికి వెళ్లి 'Create New Job' క్లిక్ చేయండి"
          },
          {
            stepEn: "Select customer and vehicle from existing records",
            stepTe: "ఇప్పటికే ఉన్న రికార్డుల నుండి కస్టమర్ మరియు వాహనాన్ని ఎంచుకోండి"
          },
          {
            stepEn: "Add service descriptions and required parts",
            stepTe: "సేవా వివరణలు మరియు అవసరమైన భాగాలను జోడించండి"
          },
          {
            stepEn: "Assign mechanic and set service timeline",
            stepTe: "మెకానిక్‌ను కేటాయించండి మరియు సేవా కాలపరిమితిని సెట్ చేయండి"
          },
          {
            stepEn: "Update job status as work progresses",
            stepTe: "పని పురోగతికి అనుగుణంగా జాబ్ స్థితిని అప్‌డేట్ చేయండి"
          }
        ]
      },
      {
        titleEn: "7. Spare Parts Inventory",
        titleTe: "7. స్పేర్ పార్ట్స్ ఇన్వెంటరీ",
        contentEn: "Maintain comprehensive inventory of spare parts with barcode scanning, stock alerts, and automatic pricing calculations.",
        contentTe: "బార్‌కోడ్ స్కానింగ్, స్టాక్ అలర్ట్‌లు మరియు ఆటోమేటిక్ ప్రైసింగ్ లెక్కలతో స్పేర్ పార్ట్స్ యొక్క సమగ్ర ఇన్వెంటరీని నిర్వహించండి.",
        steps: [
          {
            stepEn: "Access 'Spare Parts' section from the main menu",
            stepTe: "ప్రధాన మెనూ నుండి 'Spare Parts' విభాగాన్ని యాక్సెస్ చేయండి"
          },
          {
            stepEn: "Use barcode scanner to add new parts quickly",
            stepTe: "కొత్త భాగాలను త్వరగా జోడించడానికి బార్‌కోడ్ స్కానర్‌ను ఉపయోగించండి"
          },
          {
            stepEn: "Set minimum stock levels for automatic alerts",
            stepTe: "ఆటోమేటిక్ అలర్ట్‌ల కోసం కనీస స్టాక్ స్థాయిలను సెట్ చేయండి"
          },
          {
            stepEn: "Track cost price and selling price for profit analysis",
            stepTe: "లాభ విశ్లేషణ కోసం కాస్ట్ ప్రైస్ మరియు సెల్లింగ్ ప్రైస్‌ను ట్రాక్ చేయండి"
          }
        ]
      },
      {
        titleEn: "8. Invoice Generation",
        titleTe: "8. ఇన్వాయిస్ జనరేషన్",
        contentEn: "Generate professional invoices with garage branding, send via WhatsApp, and maintain complete billing records.",
        contentTe: "గ్యారేజ్ బ్రాండింగ్‌తో ప్రొఫెషనల్ ఇన్వాయిస్‌లను రూపొందించండి, WhatsApp ద్వారా పంపండి మరియు పూర్తి బిల్లింగ్ రికార్డులను నిర్వహించండి.",
        steps: [
          {
            stepEn: "Complete a job card and click 'Generate Invoice'",
            stepTe: "జాబ్ కార్డ్‌ను పూర్తి చేసి 'Generate Invoice' క్లిక్ చేయండి"
          },
          {
            stepEn: "Review invoice details including parts and labor costs",
            stepTe: "పార్ట్స్ మరియు లేబర్ కాస్ట్‌లతో సహా ఇన్వాయిస్ వివరాలను సమీక్షించండి"
          },
          {
            stepEn: "Add any additional charges or apply discounts",
            stepTe: "ఏదైనా అదనపు ఛార్జీలను జోడించండి లేదా డిస్కౌంట్‌లను వర్తింపజేయండి"
          },
          {
            stepEn: "Generate PDF invoice with garage logo and branding",
            stepTe: "గ్యారేజ్ లోగో మరియు బ్రాండింగ్‌తో PDF ఇన్వాయిస్‌ను రూపొందించండి"
          },
          {
            stepEn: "Send invoice to customer via WhatsApp or email",
            stepTe: "WhatsApp లేదా ఇమెయిల్ ద్వారా కస్టమర్‌కు ఇన్వాయిస్‌ను పంపండి"
          }
        ]
      },
      {
        titleEn: "9. Sales Analytics & Reports",
        titleTe: "9. సేల్స్ అనలిటిక్స్ మరియు రిపోర్ట్‌లు",
        contentEn: "Access comprehensive business analytics including revenue tracking, profit analysis, and performance metrics.",
        contentTe: "రెవెన్యూ ట్రాకింగ్, లాభ విశ్లేషణ మరియు పనితీరు మెట్రిక్‌లతో సహా సమగ్ర వ్యాపార అనలిటిక్స్‌ను యాక్సెస్ చేయండి.",
        steps: [
          {
            stepEn: "Navigate to 'Analytics' or 'Reports' section",
            stepTe: "'Analytics' లేదా 'Reports' విభాగానికి వెళ్లండి"
          },
          {
            stepEn: "View daily, weekly, and monthly revenue summaries",
            stepTe: "రోజువారీ, వారపు మరియు మాసిక రెవెన్యూ సారాంశాలను వీక్షించండి"
          },
          {
            stepEn: "Analyze profit margins on parts and services",
            stepTe: "పార్ట్స్ మరియు సేవలపై లాభ మార్జిన్‌లను విశ్లేషించండి"
          },
          {
            stepEn: "Export reports for accounting and business planning",
            stepTe: "అకౌంటింగ్ మరియు వ్యాపార ప్రణాళిక కోసం రిపోర్ట్‌లను ఎగుమతి చేయండి"
          }
        ]
      },
      {
        titleEn: "10. System Administration",
        titleTe: "10. సిస్టమ్ అడ్మినిస్ట్రేషన్",
        contentEn: "Manage user accounts, set permissions, configure system settings, and maintain data security.",
        contentTe: "వినియోగదారు ఖాతాలను నిర్వహించండి, అనుమతులను సెట్ చేయండి, సిస్టమ్ సెట్టింగ్‌లను కాన్ఫిగర్ చేయండి మరియు డేటా భద్రతను నిర్వహించండి.",
        steps: [
          {
            stepEn: "Access admin settings from your user profile menu",
            stepTe: "మీ వినియోగదారు ప్రొఫైల్ మెనూ నుండి అడ్మిన్ సెట్టింగ్‌లను యాక్సెస్ చేయండి"
          },
          {
            stepEn: "Add new staff members and assign roles",
            stepTe: "కొత్త సిబ్బందిని జోడించండి మరియు పాత్రలను కేటాయించండి"
          },
          {
            stepEn: "Configure garage-specific settings and preferences",
            stepTe: "గ్యారేజ్-నిర్దిష్ట సెట్టింగ్‌లు మరియు ప్రాధాన్యతలను కాన్ఫిగర్ చేయండి"
          },
          {
            stepEn: "Set up backup and data retention policies",
            stepTe: "బ్యాకప్ మరియు డేటా నిలుపుదల విధానాలను సెటప్ చేయండి"
          }
        ]
      }
    ];

    // Add each section
    sections.forEach(section => {
      this.doc.addPage();
      this.currentY = this.margin;
      
      this.addTitle(section.titleEn, section.titleTe);
      this.addContent(section.contentEn, section.contentTe);
      
      if (section.steps) {
        this.addSteps(section.steps);
      }
      
      // Add screenshot placeholder
      this.addScreenshotPlaceholder(section.titleEn);
    });

    // Add troubleshooting section
    this.addTroubleshootingSection();
    
    // Add FAQ section
    this.addFAQSection();

    this.doc.end();
    
    // Return the PDF buffer
    const chunks: Buffer[] = [];
    this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise((resolve) => {
      this.doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    }) as any;
  }

  private addCoverPage() {
    // Title
    this.doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Garage Management System', this.margin, 150, {
        width: this.pageWidth - (this.margin * 2),
        align: 'center'
      });
    
    // Telugu title
    this.doc
      .fontSize(24)
      .fillColor('#2563eb')
      .text('గ్యారేజ్ మేనేజ్‌మెంట్ సిస్టమ్', this.margin, 200, {
        width: this.pageWidth - (this.margin * 2),
        align: 'center'
      });
    
    // Subtitle
    this.doc
      .fontSize(16)
      .font('Helvetica')
      .fillColor('#374151')
      .text('Complete User Manual | పూర్తి వినియోగదారు మార్గదర్శిని', this.margin, 280, {
        width: this.pageWidth - (this.margin * 2),
        align: 'center'
      });
    
    // Version and date
    this.doc
      .fontSize(12)
      .fillColor('#6b7280')
      .text('Version 1.0 | అనుష్కరణ 1.0', this.margin, 350, {
        width: this.pageWidth - (this.margin * 2),
        align: 'center'
      });
    
    this.doc
      .text(`Generated on ${new Date().toLocaleDateString()} | రూపొందించిన తేదీ ${new Date().toLocaleDateString()}`, this.margin, 370, {
        width: this.pageWidth - (this.margin * 2),
        align: 'center'
      });
  }

  private addTableOfContents() {
    this.doc.addPage();
    this.currentY = this.margin;
    
    this.addTitle('Table of Contents', 'విషయ సూచిక');
    
    const contents = [
      '1. Getting Started | ప్రారంభించడం',
      '2. User Authentication & Login | వినియోగదారు ప్రమాణీకరణ మరియు లాగిన్',
      '3. Super Admin Features | సూపర్ అడ్మిన్ ఫీచర్లు',
      '4. Garage Setup & Registration | గ్యారేజ్ సెటప్ మరియు రిజిస్ట్రేషన్',
      '5. Customer Management | కస్టమర్ మేనేజ్‌మెంట్',
      '6. Job Card Management | జాబ్ కార్డ్ మేనేజ్‌మెంట్',
      '7. Spare Parts Inventory | స్పేర్ పార్ట్స్ ఇన్వెంటరీ',
      '8. Invoice Generation | ఇన్వాయిస్ జనరేషన్',
      '9. Sales Analytics & Reports | సేల్స్ అనలిటిక్స్ మరియు రిపోర్ట్‌లు',
      '10. System Administration | సిస్టమ్ అడ్మినిస్ట్రేషన్',
      '11. Troubleshooting | సమస్య నిర్ధారణ',
      '12. Frequently Asked Questions | తరచుగా అడిగే ప్రశ్నలు'
    ];
    
    contents.forEach(content => {
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#374151')
        .text(content, this.margin + 20, this.currentY);
      
      this.currentY += 25;
    });
  }

  private addTroubleshootingSection() {
    this.doc.addPage();
    this.currentY = this.margin;
    
    this.addTitle('11. Troubleshooting', '11. సమస్య నిర్ధారణ');
    
    const troubleshooting = [
      {
        problemEn: "Unable to login or receive OTP",
        problemTe: "లాగిన్ చేయలేకపోవడం లేదా OTP రాకపోవడం",
        solutionEn: "Check your email spam folder, ensure stable internet connection, and verify email address is correct.",
        solutionTe: "మీ ఇమెయిల్ స్పామ్ ఫోల్డర్‌ను తనిఖీ చేయండి, స్థిరమైన ఇంటర్నెట్ కనెక్షన్‌ను నిర్ధారించండి మరియు ఇమెయిల్ చిరునామా సరిగ్గా ఉందో ధృవీకరించండి."
      },
      {
        problemEn: "Barcode scanner not working",
        problemTe: "బార్‌కోడ్ స్కానర్ పని చేయడం లేదు",
        solutionEn: "Ensure camera permissions are granted, clean camera lens, and try different lighting conditions.",
        solutionTe: "కెమెరా అనుమతులు ఇవ్వబడ్డాయని నిర్ధారించుకోండి, కెమెరా లెన్స్‌ను శుభ్రపరచండి మరియు వేర్వేరు లైటింగ్ పరిస్థితులను ప్రయత్నించండి."
      },
      {
        problemEn: "Invoice not generating or downloading",
        problemTe: "ఇన్వాయిస్ రూపొందించడం లేదా డౌన్‌లోడ్ చేయడం లేదు",
        solutionEn: "Clear browser cache, check popup blockers, and ensure stable internet connection.",
        solutionTe: "బ్రౌజర్ కాష్‌ను క్లియర్ చేయండి, పాప్అప్ బ్లాకర్‌లను తనిఖీ చేయండి మరియు స్థిరమైన ఇంటర్నెట్ కనెక్షన్‌ను నిర్ధారించండి."
      }
    ];
    
    troubleshooting.forEach(item => {
      this.checkPageBreak(120);
      
      this.doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#dc2626')
        .text(`Problem: ${item.problemEn}`, this.margin, this.currentY);
      
      this.currentY += 20;
      
      this.doc
        .fontSize(12)
        .fillColor('#b91c1c')
        .text(`సమస్య: ${item.problemTe}`, this.margin, this.currentY);
      
      this.currentY += 25;
      
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text(`Solution: ${item.solutionEn}`, this.margin, this.currentY, {
          width: this.pageWidth - (this.margin * 2)
        });
      
      this.currentY += this.doc.heightOfString(`Solution: ${item.solutionEn}`, {
        width: this.pageWidth - (this.margin * 2)
      }) + 10;
      
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#065f46')
        .text(`పరిష్కారం: ${item.solutionTe}`, this.margin, this.currentY, {
          width: this.pageWidth - (this.margin * 2)
        });
      
      this.currentY += this.doc.heightOfString(`పరిష్కారం: ${item.solutionTe}`, {
        width: this.pageWidth - (this.margin * 2)
      }) + 30;
    });
  }

  private addFAQSection() {
    this.doc.addPage();
    this.currentY = this.margin;
    
    this.addTitle('12. Frequently Asked Questions', '12. తరచుగా అడిగే ప్రశ్నలు');
    
    const faqs = [
      {
        questionEn: "How do I reset my password?",
        questionTe: "నా పాస్‌వర్డ్‌ను ఎలా రీసెట్ చేయాలి?",
        answerEn: "The system uses OTP-based authentication, so you don't need to remember passwords. Simply use your email to receive a new OTP each time you login.",
        answerTe: "సిస్టమ్ OTP-ఆధారిత ప్రమాణీకరణను ఉపయోగిస్తుంది, కాబట్టి మీరు పాస్‌వర్డ్‌లను గుర్తుంచుకోవలసిన అవసరం లేదు. మీరు లాగిన్ చేసే ప్రతిసారీ కొత్త OTP స్వీకరించడానికి మీ ఇమెయిల్‌ను ఉపయోగించండి."
      },
      {
        questionEn: "Can I access the system from mobile devices?",
        questionTe: "మొబైల్ పరికరాల నుండి సిస్టమ్‌ను యాక్సెస్ చేయవచ్చా?",
        answerEn: "Yes, the system is fully responsive and works perfectly on smartphones and tablets with touch-friendly interface.",
        answerTe: "అవును, సిస్టమ్ పూర్తిగా రెస్పాన్సివ్‌గా ఉంది మరియు టచ్-ఫ్రెండ్లీ ఇంటర్‌ఫేస్‌తో స్మార్ట్‌ఫోన్‌లు మరియు టాబ్లెట్‌లలో ఖచ్చితంగా పని చేస్తుంది."
      },
      {
        questionEn: "How is my data backed up and secured?",
        questionTe: "నా డేటా ఎలా బ్యాకప్ చేయబడింది మరియు భద్రపరచబడింది?",
        answerEn: "All data is securely stored in cloud databases with automated backups, encryption, and role-based access control.",
        answerTe: "అన్ని డేటా ఆటోమేటెడ్ బ్యాకప్‌లు, ఎన్‌క్రిప్షన్ మరియు రోల్-బేస్డ్ యాక్సెస్ కంట్రోల్‌తో క్లౌడ్ డేటాబేస్‌లలో సురక్షితంగా నిల్వ చేయబడుతుంది."
      },
      {
        questionEn: "Can I customize invoice templates?",
        questionTe: "ఇన్వాయిస్ టెంప్లేట్‌లను అనుకూలీకరించవచ్చా?",
        answerEn: "Yes, you can upload your garage logo and customize invoice branding through the garage settings section.",
        answerTe: "అవును, మీరు గ్యారేజ్ సెట్టింగ్‌ల విభాగం ద్వారా మీ గ్యారేజ్ లోగోను అప్‌లోడ్ చేయవచ్చు మరియు ఇన్వాయిస్ బ్రాండింగ్‌ను అనుకూలీకరించవచ్చు."
      }
    ];
    
    faqs.forEach(faq => {
      this.checkPageBreak(100);
      
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text(`Q: ${faq.questionEn}`, this.margin, this.currentY, {
          width: this.pageWidth - (this.margin * 2)
        });
      
      this.currentY += this.doc.heightOfString(`Q: ${faq.questionEn}`, {
        width: this.pageWidth - (this.margin * 2)
      }) + 5;
      
      this.doc
        .fontSize(11)
        .fillColor('#1e40af')
        .text(`ప్రశ్న: ${faq.questionTe}`, this.margin, this.currentY, {
          width: this.pageWidth - (this.margin * 2)
        });
      
      this.currentY += this.doc.heightOfString(`ప్రశ్న: ${faq.questionTe}`, {
        width: this.pageWidth - (this.margin * 2)
      }) + 10;
      
      this.doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#374151')
        .text(`A: ${faq.answerEn}`, this.margin, this.currentY, {
          width: this.pageWidth - (this.margin * 2)
        });
      
      this.currentY += this.doc.heightOfString(`A: ${faq.answerEn}`, {
        width: this.pageWidth - (this.margin * 2)
      }) + 5;
      
      this.doc
        .fontSize(11)
        .fillColor('#4b5563')
        .text(`సమాధానం: ${faq.answerTe}`, this.margin, this.currentY, {
          width: this.pageWidth - (this.margin * 2)
        });
      
      this.currentY += this.doc.heightOfString(`సమాధానం: ${faq.answerTe}`, {
        width: this.pageWidth - (this.margin * 2)
      }) + 25;
    });
  }
}