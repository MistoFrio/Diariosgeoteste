import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FieldError {
  [key: string]: string | null;
}

export interface TouchedFields {
  [key: string]: boolean;
}

/**
 * Hook para validação de formulários em tempo real
 * 
 * @example
 * const { errors, touched, validateField, validateForm, touchField } = useFormValidation({
 *   email: { required: true, email: true },
 *   password: { required: true, minLength: 6 }
 * });
 */
export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const rule = rules[fieldName];
      if (!rule) return null;

      // Required
      if (rule.required && (!value || value.toString().trim() === '')) {
        return 'Este campo é obrigatório';
      }

      // Se não é obrigatório e está vazio, não valida o resto
      if (!value || value.toString().trim() === '') {
        return null;
      }

      const stringValue = value.toString();

      // Min length
      if (rule.minLength && stringValue.length < rule.minLength) {
        return `Mínimo de ${rule.minLength} caracteres`;
      }

      // Max length
      if (rule.maxLength && stringValue.length > rule.maxLength) {
        return `Máximo de ${rule.maxLength} caracteres`;
      }

      // Email
      if (rule.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return 'Digite um email válido';
        }
      }

      // Pattern
      if (rule.pattern && !rule.pattern.test(stringValue)) {
        return 'Formato inválido. Verifique o campo e tente novamente';
      }

      // Custom validation
      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const validateForm = useCallback(
    (formData: any): boolean => {
      const newErrors: FieldError = {};
      let isValid = true;

      Object.keys(rules).forEach((fieldName) => {
        const error = validateField(fieldName, formData[fieldName]);
        newErrors[fieldName] = error;
        if (error) isValid = false;
      });

      setErrors(newErrors);
      
      // Marca todos os campos como touched
      const allTouched: TouchedFields = {};
      Object.keys(rules).forEach((fieldName) => {
        allTouched[fieldName] = true;
      });
      setTouched(allTouched);

      return isValid;
    },
    [rules, validateField]
  );

  const touchField = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const handleFieldValidation = useCallback(
    (fieldName: string, value: any) => {
      const error = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    },
    [validateField]
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateForm,
    touchField,
    handleFieldValidation,
    resetValidation,
  };
};

