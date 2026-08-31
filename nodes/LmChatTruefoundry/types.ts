export type ModelOptions = {
	baseURL?: string;
	frequencyPenalty?: number;
	maxTokens?: number;
	responseFormat?: 'text' | 'json_object';
	presencePenalty?: number;
	temperature?: number;
	reasoningEffort?: 'low' | 'medium' | 'high';
	timeout?: number;
	maxRetries?: number;
	topP?: number;
	conversationId?: string;
	metadata?: string;
	promptCacheKey?: string;
	safetyIdentifier?: string;
	serviceTier?: 'auto' | 'flex' | 'default' | 'priority';
	topLogprobs?: number;
	textFormat?: {
		textOptions?: TextOptions;
	};
};

export type TextOptions = {
	type?: 'text' | 'json_schema' | 'json_object';
	verbosity?: 'low' | 'medium' | 'high';
	name?: string;
	schema?: string;
	description?: string;
	strict?: boolean;
};