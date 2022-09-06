import { ValidationError } from 'https://deno.land/x/deno_class_validator@v1.0.0/mod.ts';

export const extractValidationErrorMessage = (
	errors: ValidationError[],
): string[] => {
	const ret: string[] = [];
	errors.forEach((error) => {
		if (error.constraints) {
			Object.keys(error.constraints).forEach((val) => {
				if (error.constraints) {
					ret.push(error.constraints[val]);
				}
			});
		}
	});
	return ret;
};
