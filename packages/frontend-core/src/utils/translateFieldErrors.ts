import type {
  FieldError,
  FieldErrors,
  FieldValues,
  ValidateResult,
} from 'react-hook-form';

type Translate = (message: string) => string;

const isFieldError = (value: unknown): value is FieldError =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { type?: unknown }).type === 'string';

const translateTypeValue = (
  value: ValidateResult,
  translate: Translate,
): ValidateResult => {
  if (Array.isArray(value)) return value.map((entry) => translate(entry));
  if (typeof value === 'string') return translate(value);
  return value;
};

const translateTypes = (
  types: NonNullable<FieldError['types']>,
  translate: Translate,
): NonNullable<FieldError['types']> =>
  Object.fromEntries(
    Object.entries(types).map(([key, value]) => [
      key,
      translateTypeValue(value, translate),
    ]),
  );

const translateNode = (node: unknown, translate: Translate): unknown => {
  if (Array.isArray(node)) {
    return node.map((child) => translateNode(child, translate));
  }

  if (isFieldError(node)) {
    const message =
      typeof node.message === 'string' ? translate(node.message) : undefined;
    const types = node.types
      ? translateTypes(node.types, translate)
      : undefined;

    if (message === undefined && types === undefined) return node;

    return {
      ...node,
      ...(message !== undefined ? { message } : {}),
      ...(types !== undefined ? { types } : {}),
    };
  }

  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, child]) => [
        key,
        translateNode(child, translate),
      ]),
    );
  }

  return node;
};

export const translateFieldErrors = <T extends FieldValues>(
  errors: FieldErrors<T>,
  translate: Translate,
): FieldErrors<T> => translateNode(errors, translate) as FieldErrors<T>;
