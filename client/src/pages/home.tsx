import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import {
  Car,
  Users,
  FileText,
  Package,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  Sun,
  Moon,
  Wrench,
  IndianRupee,
  MessageCircle,
  Smartphone,
  Globe,
  Zap
} from "lucide-react";
import serviceguruLogo from "@/assets/serviceguru-logo.jpeg";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Car className="w-8 h-8" />,
      title: "Job Card Management",
      description: "Create, track, and complete service requests with digital job cards. Real-time status updates and automatic notifications."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Customer Management",
      description: "Comprehensive customer database with service history, vehicle details, and automated communication systems."
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Inventory Control",
      description: "Smart spare parts management with barcode scanning, low-stock alerts, and automated reorder suggestions."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Invoice Generation",
      description: "Professional PDF invoices with custom branding, WhatsApp integration, and automatic payment tracking."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Sales Analytics",
      description: "Revenue tracking, profit analysis, and detailed reports for data-driven business decisions."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Role-Based Access",
      description: "Secure multi-user system with garage admins, mechanics, and super admin controls."
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save Time",
      description: "Reduce paperwork by 80% with digital workflows"
    },
    {
      icon: <IndianRupee className="w-6 h-6" />,
      title: "Increase Revenue",
      description: "Track profits and optimize pricing strategies"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile Friendly",
      description: "Access from any device, anywhere"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Cloud Based",
      description: "Secure data with automatic backups"
    }
  ];

  const testimonials = [
    {
      name: "Ananth Kumar",
      role: "Garage Owner",
      comment: "ServiceGuru transformed our business operations. We've reduced paperwork by 90% and increased customer satisfaction.",
      rating: 5
    },
    {
      name: "Rajesh Mechanic",
      role: "Senior Technician",
      comment: "The job card system is so easy to use. I can track all my work and customers love the professional invoices.",
      rating: 5
    },
    {
      name: "Priya Auto Services",
      role: "Service Manager",
      comment: "Inventory management has never been easier. The barcode scanning feature saves us hours every week.",
      rating: 5
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src={serviceguruLogo} 
                  alt="ServiceGuru Logo" 
                  className="w-full h-full object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                    mixBlendMode: 'multiply',
                    background: 'transparent'
                  }} 
                />
              </div>
              <span className="text-xl font-bold text-blue-600">ServiceGuru</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#benefits" className="hover:text-blue-600 transition-colors">Benefits</a>
              <a href="#testimonials" className="hover:text-blue-600 transition-colors">Reviews</a>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Link href="/login">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900">
                  Login
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900">
                  Login
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                <a href="#benefits" className="hover:text-blue-600 transition-colors">Benefits</a>
                <a href="#testimonials" className="hover:text-blue-600 transition-colors">Reviews</a>
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Professional Garage Management System
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transform Your Automotive Business with ServiceGuru
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Complete garage management solution for modern automotive service businesses. 
              Streamline operations, boost productivity, and delight customers with our all-in-one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Run Your Garage
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for automotive service businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`h-full ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'} hover:shadow-lg transition-shadow duration-300`}>
                <CardHeader>
                  <div className="text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose ServiceGuru?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join hundreds of garage owners who have transformed their business operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-blue-600">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real feedback from garage owners who use ServiceGuru daily
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.comment}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Garage?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of garage owners who have streamlined their operations with ServiceGuru
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Your Free Trial <Zap className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                Request Demo <MessageCircle className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-gray-900 border-t border-gray-700' : 'bg-gray-50 border-t'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-blue-600">ServiceGuru</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
                Professional garage management system designed for modern automotive service businesses.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Built by Quintellix Systems
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>Job Card Management</li>
                <li>Customer Database</li>
                <li>Inventory Control</li>
                <li>Invoice Generation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>User Manual</li>
                <li>Training Videos</li>
                <li>24/7 Support</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              © 2025 ServiceGuru by Quintellix Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}