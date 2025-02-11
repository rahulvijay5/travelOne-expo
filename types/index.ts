export * from './common';
export * from './user';
export * from './hotel';
export * from './payment';
export * from './hotelRules';
export * from './statusEnums';
export * from './booking';
export * from './room';

export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;