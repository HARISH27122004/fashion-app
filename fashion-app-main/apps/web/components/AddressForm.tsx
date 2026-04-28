"use client";

import { useState, useCallback } from 'react';
import { useCheckout } from '@/contexts/CheckoutContext';
import Link from 'next/link';
import styles from './AddressForm.module.css';

export function AddressForm() {
  const { shippingAddress, setShippingAddress, setStep } = useCheckout();
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof shippingAddress, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof typeof shippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, [setShippingAddress]);

  const validateForm = useCallback(() => {
    const errors: Partial<Record<keyof typeof shippingAddress, string>> = {};
    
    if (!shippingAddress.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!shippingAddress.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(shippingAddress.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (!shippingAddress.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!shippingAddress.addressLine1.trim()) {
      errors.addressLine1 = 'Address line 1 is required';
    }
    
    if (!shippingAddress.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!shippingAddress.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!shippingAddress.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(shippingAddress.pincode)) {
      errors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    if (!shippingAddress.country.trim()) {
      errors.country = 'Country is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [shippingAddress]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const isValid = validateForm();
    if (!isValid) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('payment');
    } catch (error) {
      console.error('Address submission failed:', error);
      // In a real app, you might show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, isSubmitting, setStep]);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Shipping Address</h1>
      
      <div className={styles.formGroup}>
        <label htmlFor="fullName">Full Name *</label>
        <input
          type="text"
          id="fullName"
          value={shippingAddress.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Enter your full name"
          className={`${styles.input} ${formErrors.fullName ? styles.error : ''}`}
        />
        {formErrors.fullName && <p className={styles.errorText}>{formErrors.fullName}</p>}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber">Phone Number *</label>
        <input
          type="tel"
          id="phoneNumber"
          value={shippingAddress.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          placeholder="Enter your 10-digit phone number"
          className={`${styles.input} ${formErrors.phoneNumber ? styles.error : ''}`}
        />
        {formErrors.phoneNumber && <p className={styles.errorText}>{formErrors.phoneNumber}</p>}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          value={shippingAddress.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Enter your email address"
          className={`${styles.input} ${formErrors.email ? styles.error : ''}`}
        />
        {formErrors.email && <p className={styles.errorText}>{formErrors.email}</p>}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="addressLine1">Address Line 1 *</label>
        <input
          type="text"
          id="addressLine1"
          value={shippingAddress.addressLine1}
          onChange={(e) => handleChange('addressLine1', e.target.value)}
          placeholder="Street address, apartment, suite, etc."
          className={`${styles.input} ${formErrors.addressLine1 ? styles.error : ''}`}
        />
        {formErrors.addressLine1 && <p className={styles.errorText}>{formErrors.addressLine1}</p>}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="addressLine2">Address Line 2</label>
        <input
          type="text"
          id="addressLine2"
          value={shippingAddress.addressLine2}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          placeholder="Apartment, suite, unit, building, floor, etc."
          className={styles.input}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="landmark">Landmark</label>
        <input
          type="text"
          id="landmark"
          value={shippingAddress.landmark}
          onChange={(e) => handleChange('landmark', e.target.value)}
          placeholder="Nearby landmark (optional)"
          className={styles.input}
        />
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            value={shippingAddress.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Enter your city"
            className={`${styles.input} ${formErrors.city ? styles.error : ''}`}
          />
          {formErrors.city && <p className={styles.errorText}>{formErrors.city}</p>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="state">State *</label>
          <input
            type="text"
            id="state"
            value={shippingAddress.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="Enter your state"
            className={`${styles.input} ${formErrors.state ? styles.error : ''}`}
          />
          {formErrors.state && <p className={styles.errorText}>{formErrors.state}</p>}
        </div>
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="pincode">Pincode *</label>
          <input
            type="text"
            id="pincode"
            value={shippingAddress.pincode}
            onChange={(e) => handleChange('pincode', e.target.value)}
            placeholder="Enter 6-digit pincode"
            className={`${styles.input} ${formErrors.pincode ? styles.error : ''}`}
          />
          {formErrors.pincode && <p className={styles.errorText}>{formErrors.pincode}</p>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="country">Country *</label>
          <input
            type="text"
            id="country"
            value={shippingAddress.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Enter your country"
            className={`${styles.input} ${formErrors.country ? styles.error : ''}`}
          />
          {formErrors.country && <p className={styles.errorText}>{formErrors.country}</p>}
        </div>
      </div>
      
      <div className={styles.saveAddress}>
        <label className={styles.saveLabel}>
          <input
            type="checkbox"
            checked={false} // In a real app, this would be tied to state
            onChange={() => {}} // Handle save address preference
          />
          Save this address for future use
        </label>
      </div>
      
      <div className={styles.formActions}>
        <Link href="/" className={styles.backBtn}>
          ← Back to Cart
        </Link>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`${styles.continueBtn} ${isSubmitting ? styles.loading : ''}`}
        >
          {isSubmitting ? 'Saving...' : 'Continue to Payment Method'}
        </button>
      </div>
    </form>
  );
}