import { useState, useCallback } from 'react';

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: keyof FormState, value: string, formState: FormState): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name too short';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formState.password) return 'Passwords do not match';
        break;
    }
    return undefined;
  }, []);

  const validateAll = useCallback((formState: FormState): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    const fields: (keyof FormState)[] = ['fullName', 'email', 'password', 'confirmPassword'];
    fields.forEach((field) => {
      const err = validateField(field, formState[field], formState);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return newErrors;
  }, [validateField]);

  const handleBlur = useCallback((field: keyof FormState, value: string, formState: FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, value, formState);
    setErrors((prev) => ({ ...prev, [field]: err }));
  }, [validateField]);

  const clearError = useCallback((field: keyof FormState) => {
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const isFieldValid = useCallback((field: keyof FormState, value: string, formState: FormState): boolean => {
    if (!touched[field] || !value) return false;
    return !validateField(field, value, formState);
  }, [touched, validateField]);

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return { errors, touched, validateAll, handleBlur, clearError, isFieldValid, resetValidation };
}
