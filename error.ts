export class ConfigurationError extends Error {
	private static default_configuration_message = 'missing configuration key❕';
	constructor(msg: string, options?: ErrorOptions) {
		super(
			msg ? msg : ConfigurationError.default_configuration_message,
			options,
		);
	}
}

export class ValidationError extends Error {
	private static default_validation_message =
		'Caught promise rejection (validation failed)🎯';
	constructor(msg: string, options?: ErrorOptions) {
		super(
			msg ? msg : ValidationError.default_validation_message,
			options,
		);
	}
}

export class AuthenticationError extends Error {
	private static default_authentication_message = 'Invalid Credentials 🎯';
	constructor(msg?: string, options?: ErrorOptions) {
		super(
			msg ? msg : AuthenticationError.default_authentication_message,
			options,
		);
	}
}

export class AuthorizationError extends Error {
	private static default_authorization_message =
		'Action not allowed for this role 🎯';
	constructor(msg?: string, options?: ErrorOptions) {
		super(
			msg ? msg : AuthorizationError.default_authorization_message,
			options,
		);
	}
}

export class ExistingUserError extends Error {
	private static default_user_exist_message =
		'User with this details exist before 🎯';
	constructor(msg?: string, options?: ErrorOptions) {
		super(
			msg ? msg : ExistingUserError.default_user_exist_message,
			options,
		);
	}
}

export class NoExistingLinkError extends Error {
	private static default_no_vault_exist_message =
		'No Link with this details exist before 🎯';
	constructor(msg?: string, options?: ErrorOptions) {
		super(
			msg ? msg : NoExistingLinkError.default_no_vault_exist_message,
			options,
		);
	}
}

