"use client";

import Link from "next/link";
import { useCheckout } from "@/contexts/CheckoutContext";
import styles from "./PaymentMethod.module.css";

export function PaymentMethod() {
  const { paymentMethod, setPaymentMethod, setStep } = useCheckout();

  const paymentOptions = [
    {
      id: 'razorpay',
      title: 'Razorpay',
      description: 'Secure payments via credit/debit card, net banking, UPI, and wallets',
      icon: '💳',
      isRecommended: true
    },
    {
      id: 'cod',
      title: 'Cash on Delivery',
      description: 'Pay cash when your order is delivered',
      icon: '💵',
      isRecommended: false
    },
    {
      id: 'payLater',
      title: 'Pay Later',
      description: 'Buy now, pay later with flexible options',
      icon: '⏳',
      isRecommended: false,
      disabled: true // Placeholder for future implementation
    }
  ];

  const handleSelect = (method: typeof paymentOptions[number]['id']) => {
    setPaymentMethod(method);
  };

  const handleContinue = () => {
    if (paymentMethod === 'razorpay' || paymentMethod === 'cod') {
      setStep('success'); // For now, go directly to success (will be updated when Razorpay integration is added)
    }
    // For payLater, we'd show a message that it's not implemented yet
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Payment Method</h1>
      <p className={styles.subtitle}>Choose how you&apos;d like to pay for your order</p>
      
      <div className={styles.options}>
        {paymentOptions.map((option) => (
          <div
            key={option.id}
            className={`${styles.option} ${option.id === paymentMethod ? styles.selected : ''} ${option.disabled ? styles.disabled : ''}`}
            onClick={!option.disabled ? () => handleSelect(option.id) : undefined}
          >
            <div className={styles.optionIcon}>
              {option.icon}
            </div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>
                {option.title}
                {option.isRecommended && <span className={styles.recommendedBadge}>Recommended</span>}
              </h3>
              <p className={styles.optionDescription}>{option.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.actions}>
        <Link href="/" className={styles.backBtn}>
          ← Back to Cart
        </Link>
        <button 
          onClick={handleContinue}
          disabled={paymentMethod === 'payLater'}
          className={`${styles.continueBtn} ${paymentMethod === 'payLater' ? styles.disabled : ''}`}
        >
          Continue to Pay
        </button>
      </div>
    </div>
  );
}