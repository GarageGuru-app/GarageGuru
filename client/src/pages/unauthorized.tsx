import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function UnauthorizedPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive" data-testid="title-unauthorized">
            Access Denied
          </CardTitle>
          <CardDescription data-testid="description-unauthorized">
            You don't have permission to access this page. Super admin access is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>If you believe this is an error, please contact the system administrator.</p>
            <p className="mt-2 font-medium">Only authorized super admin accounts can access this area.</p>
          </div>
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            data-testid="button-go-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}