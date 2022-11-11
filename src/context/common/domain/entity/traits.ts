export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}

export interface From<T, Q> {
  from(val: T): Q;
}

export interface To<T> {
  to(): T;
}
