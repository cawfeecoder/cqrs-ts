export function staticImplements<T>() {
	// rome-ignore lint: Required for enforcing something implemented as static for decorator
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
