import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';


export class TruefoundryApi implements ICredentialType {
	name = 'truefoundryApi';
	displayName = 'Truefoundry API';
	documentationUrl = 'https://docs.n8n.io/integrations/builtin/credentials/openai/'; // TODO: update to truefoundry
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
            default: 'https://truefoundry.com/your-gateway-url',
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
            baseURL: '={{$credentials.gatewayURL}}', // TODO: what url is passed to test we are hitting the gateway? 
            url: '/models', 
            method: 'GET',
        },
    };
}
