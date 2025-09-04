import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  garage_id: string;
  user_id: string;
  customer_id?: string;
  spare_part_id: string;
  quantity: number;
  reserved_price: number;
  expires_at: string;
  status: 'reserved' | 'checked_out' | 'expired';
  created_at: string;
  updated_at: string;
  spare_part_name: string;
  spare_part_number: string;
  current_price: number;
  available_quantity: number;
}

export default function Cart() {
  const [, navigate] = useLocation();
  const { garage, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/garages', garage?.id, 'cart'],
    enabled: !!garage?.id,
  });

  // Update cart item quantity
  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return await apiRequest(`/api/garages/${garage?.id}/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/garages', garage?.id, 'cart'] });
      toast({
        title: "✅ Cart Updated",
        description: "Item quantity updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update Failed",
        description: error?.message || "Failed to update cart item",
        variant: "destructive",
      });
    },
  });

  // Remove cart item
  const removeCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/garages/${garage?.id}/cart/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/garages', garage?.id, 'cart'] });
      toast({
        title: "✅ Item Removed",
        description: "Item removed from cart successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Remove Failed",
        description: error?.message || "Failed to remove cart item",
        variant: "destructive",
      });
    },
  });

  // Clear entire cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/garages/${garage?.id}/cart`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/garages', garage?.id, 'cart'] });
      toast({
        title: "✅ Cart Cleared",
        description: "All items removed from cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Clear Failed",
        description: error?.message || "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    
    updateCartMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: string) => {
    removeCartMutation.mutate(itemId);
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    if (confirm("Are you sure you want to clear all items from your cart?")) {
      clearCartMutation.mutate();
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total: number, item: CartItem) => {
      return total + (item.reserved_price * item.quantity);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs <= 0) {
      return "Expired";
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading cart...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/spare-parts')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Parts
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Shopping Cart
            </h1>
          </div>

          {cartItems.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearCart}
              disabled={clearCartMutation.isPending}
              data-testid="button-clear-cart"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Package className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-4">Add some spare parts to get started</p>
              <Button onClick={() => navigate('/spare-parts')} data-testid="button-browse-parts">
                Browse Spare Parts
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Cart Items List */}
            <div className="space-y-3">
              {cartItems.map((item: CartItem) => (
                <Card key={item.id} className="p-4" data-testid={`cart-item-${item.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.spare_part_name}
                        </h3>
                        {item.spare_part_number && (
                          <Badge variant="secondary" className="text-xs">
                            {item.spare_part_number}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Price: {formatCurrency(item.reserved_price)}</span>
                        <span>Available: {item.available_quantity}</span>
                        <span className="text-orange-600">
                          {formatExpiryTime(item.expires_at)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={item.quantity <= 1 || updateCartMutation.isPending}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-center min-w-[3rem]">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        disabled={updateCartMutation.isPending}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.reserved_price * item.quantity)}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removeCartMutation.isPending}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Cart Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span>{cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/job-card')}
                    data-testid="button-checkout"
                  >
                    Proceed to Job Card
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/spare-parts')}
                    data-testid="button-continue-shopping"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}