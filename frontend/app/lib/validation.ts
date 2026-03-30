export interface FormErrors {
  title?: string;
  description?: string;
  submitterEmail?: string;
}

export const validateFeedbackForm = (data: {
  title: string;
  description: string;
  submitterEmail?: string;
}): FormErrors => {
  const errors: FormErrors = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.trim().length > 120) {
    errors.title = 'Title cannot exceed 120 characters';
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }

  // Email validation (if provided)
  if (data.submitterEmail && data.submitterEmail.trim().length > 0) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.submitterEmail)) {
      errors.submitterEmail = 'Please enter a valid email address';
    }
  }

  return errors;
};

export const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0;
};
