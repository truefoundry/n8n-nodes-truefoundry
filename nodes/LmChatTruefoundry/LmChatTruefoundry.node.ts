import {
    type INodeType,
    type INodeTypeDescription,
    type ISupplyDataFunctions,
    type SupplyData,
    type INodeProperties,
    NodeConnectionTypes,
} from 'n8n-workflow';
import { searchModels } from './methods/loadModels';
import { searchPrompts } from './methods/loadPrompts';
import { getConnectionHintNoticeField } from './utils/sharedFields';
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { ChatOpenAI } from '@langchain/openai';
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import type { ClientOptions } from 'openai';
import { ModelOptions } from './types';

const INCLUDE_JSON_WARNING: INodeProperties = {
    displayName:
        'If using JSON response format, you must include word "json" in the prompt in your chain or agent. Also, make sure to select latest models released post November 2023.',
    name: 'notice',
    type: 'notice',
    default: '',
};

export interface AttributionSettings {
    applicationName?: string;
    costCenter?: string;
    department?: string;
    environment?: string;
    fallbackUserEmail?: string;
}

export interface TruefoundryMetadata {
    user_id: string;
    workflow_id: string;
    workflow_name: string;
    execution_id: string;
    execution_mode: string;
    project_id: string;
    environment: string;
    n8n_app_name: string;
    instance_id: string;
    cost_center?: string;
}

export function getTruefoundryMetadata(
    node: ISupplyDataFunctions,
    attributionSettings: AttributionSettings
): TruefoundryMetadata { 
    
    // 1. Context Extraction
    const rawUserId = (node as { additionalData?: { userId?: string } }).additionalData?.userId;
    const projectId = (node as { additionalData?: { projectId?: string } }).additionalData?.projectId || 'unknown-project';
    
    // 2. Fallback Logic
    const fallbackUserEmail = attributionSettings.fallbackUserEmail || '';
    const userId = rawUserId || fallbackUserEmail || 'unknown-user';

    // 3. Workflow & Execution Data
    const workflow = node.getWorkflow();
    const workflowId = workflow.id || 'unknown-workflow';
    const workflowName = workflow.name || 'unknown-workflow-name';
    const executionId = node.getExecutionId() || 'unknown-execution';
    const executionMode = node.getMode();
    const instanceId = node.getInstanceId();

    // 4. Attribution Settings
    const department = attributionSettings.department || '';
    const costCenter = attributionSettings.costCenter || '';
    const applicationName = attributionSettings.applicationName || '';
    const environment = attributionSettings.environment || 'production';

    // 5. Construct Metadata Object
    const metadata: TruefoundryMetadata = {
        user_id: String(userId),
        workflow_id: String(workflowId),
        workflow_name: String(workflowName),
        execution_id: String(executionId),
        execution_mode: executionMode,
        project_id: String(projectId),
        environment: environment,
        instance_id: String(instanceId),
        n8n_app_name: applicationName || 'n8n-ai-agent',
    };

    if (department && costCenter) {
        metadata.cost_center = `${costCenter}, ${department}`;
    } else if (costCenter) {
        metadata.cost_center = costCenter;
    } else if (department) {
        metadata.cost_center = department;
    }

    return metadata;
}

function createTfyFetch(tfyMetadata: TruefoundryMetadata): typeof fetch {
    return async(input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {

        // Truefoundry logic: inject metadata headers, a failsafe in case langchain drops the below header
        const headers = new Headers(init?.headers);
        headers.set('X-TFY-METADATA', JSON.stringify(tfyMetadata));

        const newInit = {
            ...init,
            headers,
        }

        const response = await fetch(input, newInit);

        return response;
    }
}

export class LmChatTruefoundry implements INodeType {

    methods = {
        listSearch: {
            searchModels,
            searchPrompts,
        },
    };

    description: INodeTypeDescription = {
        usableAsTool: true, // to avoid linting error
        displayName: 'Truefoundry Chat Model', 
        name: 'lmChatTruefoundry', 
        icon: 'file:icons/truefoundry.svg', 
        group: ['transform'],
        version: 1,
        description: 'Truefoundry Chat Model with automatic user attribution', 
        defaults: {
            name: 'Truefoundry Chat Model', 
        },
        codex: {
            categories: ['AI'],
            subcategories: {
                AI: ['Language Models', 'Root Nodes'],
                'Language Models': ['Chat Models(Recommended)'],
            },
            resources: {
                primaryDocumentation: [
                    {
                        url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/',
                    },
                ],
            },
        },
        inputs: [],
        outputs: [NodeConnectionTypes.AiLanguageModel], 
        credentials: [
            {
                name: 'truefoundryApi',
                required: true,
            },
        ],
        requestDefaults: {
            ignoreHttpStatusErrors: true,
            baseURL:
                '={{ $parameter.options?.baseURL?.split("/").slice(0,-1).join("/") || $credentials?.gatewayURL?.split("/").slice(0,-1).join("/") || "https://api.openai.com" }}',
        },
        properties: [
            getConnectionHintNoticeField([NodeConnectionTypes.AiChain, NodeConnectionTypes.AiAgent]),
            {
                ...INCLUDE_JSON_WARNING,
                displayOptions: {
                    show: {
                        '/options.responseFormat': ['json_object'],
                    },
                },
            },
            {
                ...INCLUDE_JSON_WARNING,
                displayOptions: {
                    show: {
                        '/options.textFormat.textOptions.type': ['json_object'],
                    },
                },
            },
            {
                displayName: 'Model',
                name: 'model',
                type: 'resourceLocator',
                default: { mode: 'list', value: '' },
                required: true,
                description: 'The model to use for generating completions. Models are loaded from your AI gateway.',
                modes: [
                    {
                        displayName: 'From List',
                        name: 'list',
                        type: 'list',
                        typeOptions: {
                            searchListMethod: 'searchModels',
                            searchable: true,
                        },
                    },
                    {
                        displayName: 'ID',
                        name: 'id',
                        type: 'string',
                        placeholder: 'gpt-4o-mini',
                    },
                ],
            },
            {
                displayName: 'Prompt',
                name: 'prompt',
                type: 'resourceLocator',
                default: { mode: 'id', value: '' },
                description: 'Optionally bind a saved prompt from the Truefoundry Prompt Registry. The prompt\'s messages are sent first, followed by the messages from the connected AI Agent/Chain. Note: the Model selected above always overrides the model configured in the prompt.',
                modes: [
                    {
                        displayName: 'From List',
                        name: 'list',
                        type: 'list',
                        typeOptions: {
                            searchListMethod: 'searchPrompts',
                            searchable: true,
                        },
                    },
                    {
                        displayName: 'FQN',
                        name: 'id',
                        type: 'string',
                        placeholder: 'chat_prompt:truefoundry/default/my-prompt:1',
                    },
                ],
            },
            {
                displayName: 'Prompt Variables',
                name: 'promptVariables',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                placeholder: 'Add Variable',
                default: {},
                description: 'Values for the {{variable}} placeholders defined in the selected prompt',
                options: [
                    {
                        name: 'variables',
                        displayName: 'Variables',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                default: '',
                                required: true,
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                            },
                        ],
                    },
                ],
            },
            {
                displayName: 'Attribution Settings',
                name: 'attributionSettings',
                type: 'collection',
                placeholder: 'Add Attribution Option',
                default: {},
                description: 'Configure fallback attribution values for when n8n context is unavailable (e.g., webhook triggers, scheduled executions)',
                options: [
                    {
                        displayName: 'Application/Feature Name',
                        name: 'applicationName',
                        type: 'string',
                        default: '',
                        placeholder: 'customer-support-bot',
                        description: 'Optional application or feature name for categorization',
                    },
                    {
                        displayName: 'Cost Center',
                        name: 'costCenter',
                        type: 'string',
                        default: '',
                        placeholder: 'CC-12345',
                        description: 'Optional cost center code for billing attribution',
                    },
                    {
                        displayName: 'Department/Team',
                        name: 'department',
                        type: 'string',
                        default: '',
                        placeholder: 'engineering',
                        description: 'Optional team identifier for cost allocation and reporting',
                    },
                    {
                        displayName: 'Environment',
                        name: 'environment',
                        type: 'options',
                        default: 'production',
                        options: [
                            { name: 'Production', value: 'production' },
                            { name: 'Staging', value: 'staging' },
                            { name: 'Development', value: 'development' },
                            { name: 'Test', value: 'test' },
                        ],
                        description: 'Environment identifier for the workflow',
                    },
                    {
                        displayName: 'Fallback User Email',
                        name: 'fallbackUserEmail',
                        type: 'string',
                        default: '',
                        placeholder: 'workflow-owner@company.com',
                        description: 'Used when n8n userId is unavailable (production webhooks, scheduled triggers). Provides guaranteed attribution.',
                    },
                ],
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Frequency Penalty',
                        name: 'frequencyPenalty',
                        type: 'number',
                        typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 1 },
                        default: 0,
                        description: 'Penalize frequent tokens',
                    },
                    {
                        displayName: 'Maximum Number of Tokens',
                        name: 'maxTokens',
                        type: 'number',
                        default: -1,
                        description: 'The maximum number of tokens to generate. -1 for no limit.',
                    },
                    {
                        displayName: 'Presence Penalty',
                        name: 'presencePenalty',
                        type: 'number',
                        typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 1 },
                        default: 0,
                        description: 'Penalize tokens based on presence',
                    },
                    {
                        displayName: 'Sampling Temperature',
                        name: 'temperature',
                        type: 'number',
                        typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 1 },
                        default: 0.7,
                        description: 'Controls randomness. Lower is more deterministic.',
                    },
                    {
                        displayName: 'Timeout',
                        name: 'timeout',
                        type: 'number',
                        default: 60000,
                        description: 'Request timeout in milliseconds',
                    },
                    {
                        displayName: 'Top P',
                        name: 'topP',
                        type: 'number',
                        typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 1 },
                        default: 1,
                        description: 'Nucleus sampling parameter',
                    },
                ],
            },
        ],
    };

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const credentials = await this.getCredentials('truefoundryApi');


        const modelParameter = this.getNodeParameter('model', itemIndex) as { value: string } | string;
        const modelName = typeof modelParameter === 'string' ? modelParameter : modelParameter.value;
        const options = this.getNodeParameter('options', itemIndex, {}) as ModelOptions;

        // Prompt Registry: optionally bind a saved prompt (and its variables) to this model
        const promptParameter = this.getNodeParameter('prompt', itemIndex, { mode: 'id', value: '' }) as
            | { value: string }
            | string;
        const promptFqn = (typeof promptParameter === 'string' ? promptParameter : promptParameter.value)?.trim();

        const promptVariablesParameter = this.getNodeParameter('promptVariables', itemIndex, {}) as {
            variables?: Array<{ name: string; value: string }>;
        };
        const promptVariables = (promptVariablesParameter.variables ?? []).reduce<Record<string, string>>(
            (acc, { name, value }) => {
                if (name) acc[name] = value;
                return acc;
            },
            {},
        );

        // truefoundry logic begin
        const attributionSettings = this.getNodeParameter('attributionSettings', itemIndex, {}) as AttributionSettings;

        const tfyMetadata = getTruefoundryMetadata(this, attributionSettings);

        const configuration: ClientOptions = {
            apiKey: credentials.apiKey as string,
            baseURL: credentials.gatewayURL as string,
            // Headers are injected here because LangChain drops some defaultHeaders through to fetch
            fetch: createTfyFetch(tfyMetadata),
            defaultHeaders: {
                'X-TFY-METADATA': JSON.stringify(tfyMetadata),
            },
        };
        // truefoundry logic end

        const modelKwargs: Record<string, unknown> = {
            user: `n8n-user-${tfyMetadata.user_id}-workflow-${tfyMetadata.workflow_id}`,
        };

        if (promptFqn) {
            modelKwargs.prompt_version_fqn = promptFqn;
            if (Object.keys(promptVariables).length > 0) {
                modelKwargs.prompt_variables = promptVariables;
            }
        }

        const model = new ChatOpenAI({
            modelName,
            apiKey: credentials.apiKey as string,
            maxTokens: options.maxTokens && options.maxTokens > 0 ? options.maxTokens : undefined,
            temperature: options.temperature,
            topP: options.topP,
            frequencyPenalty: options.frequencyPenalty,
            presencePenalty: options.presencePenalty,
            timeout: options.timeout || 60000,
            maxRetries: options.maxRetries || 2,
            configuration,
            modelKwargs,
        });

        return {
            response: model,
        };
    }
}

