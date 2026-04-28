"use client";

import { createContext, useContext, useState, type ReactNode, Dispatch, SetStateAction } from 'react';

export type CheckoutStep = 'cart' | 'address' | 'payment' | 'success' | 'tracking';

export type ShippingAddress = {
  fullName: string;
  phoneNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type PaymentMethod = 'razorpay' | 'cod' | 'payLater';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type CheckoutContextType = {
  step: CheckoutStep;
  setStep: Dispatch<SetStateAction<CheckoutStep>>;
  shippingAddress: ShippingAddress;
  setShippingAddress: (update: Partial<ShippingAddress>) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod>>;
  cartItems: OrderItem[];
  setCartItems: Dispatch<SetStateAction<OrderItem[]>>;
  orderId: string | null;
  setOrderId: Dispatch<SetStateAction<string | null>>;
  paymentId: string | null;
  setPaymentId: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isPaymentProcessing: boolean;
  setIsPaymentProcessing: Dispatch<SetStateAction<boolean>>;
  resetCheckout: () => void;
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [shippingAddress, setShippingAddressState] = useState<ShippingAddress>({
    fullName: '',
    phoneNumber: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const setShippingAddress = (update: Partial<ShippingAddress>) => {
    setShippingAddressState(prev => ({ ...prev, ...update }));
  };

  const resetCheckout = () => {
    setStep('cart');
    setShippingAddress({
      fullName: '',
      phoneNumber: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
    });
    setPaymentMethod('razorpay');
    setCartItems([]);
    setOrderId(null);
    setPaymentId(null);
    setIsLoading(false);
    setIsPaymentProcessing(false);
  };

  return (
    <CheckoutContext.Provider
      value={{
        step,
        setStep,
        shippingAddress,
        setShippingAddress,
        paymentMethod,
        setPaymentMethod,
        cartItems,
        setCartItems,
        orderId,
        setOrderId,
        paymentId,
        setPaymentId,
        isLoading,
        setIsLoading,
        isPaymentProcessing,
        setIsPaymentProcessing,
        resetCheckout,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}