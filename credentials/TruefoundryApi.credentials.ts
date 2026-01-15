import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';


export class TruefoundryApi implements ICredentialType {
	name = 'truefoundryApi';
	displayName = 'Truefoundry API';
	documentationUrl = 'https://truefoundry.com/docs/ai-gateway/n8n'
	icon = 'file:../nodes/LmChatTruefoundry/icons/truefoundry.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
			description: 'Your API key for the AI Gateway',
		},
        {
            displayName: 'Gateway URL',
            name: 'gatewayURL',
            type: 'string',
            default: 'https://gateway.truefoundry.ai/',
            required: true,
            description: 'The base URL of the AI Gateway',
        },
	];

	// Authenticate using Bearer token
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.gatewayURL}}',
            url: '/models', 
            method: 'GET',
        },
    };
}
