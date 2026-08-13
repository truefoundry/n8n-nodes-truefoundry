import type {
    ILoadOptionsFunctions,
    INodeListSearchItems,
    INodeListSearchResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

interface PromptVersion {
    fqn: string;
    updated_at?: string | null;
    created_at?: string | null;
}

interface ListPromptVersionsResponse {
    data?: PromptVersion[];
}

export async function searchPrompts(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
    const credentials = await this.getCredentials('truefoundryApi');

    const controlPlaneURL = (credentials.controlPlaneURL as string | undefined)?.trim();

    if (!controlPlaneURL) {
        throw new NodeOperationError(
            this.getNode(),
            'Control Plane URL is not set on the Truefoundry API credential. Set it to browse prompts from the Prompt Registry, or paste a prompt FQN directly in the "FQN" field instead.',
        );
    }

    const baseURL = controlPlaneURL.replace(/\/$/, '');

    const response = (await this.helpers.httpRequest({
        method: 'GET',
        url: `${baseURL}/api/svc/v1/prompt-versions`,
        qs: {
            limit: 100,
        },
        headers: {
            Authorization: `Bearer ${credentials.apiKey as string}`,
        },
        json: true,
    })) as ListPromptVersionsResponse;

    const promptVersions = response.data ?? [];

    let results: INodeListSearchItems[] = promptVersions
        .filter((promptVersion) => {
            if (!filter) return true;
            return promptVersion.fqn.toLowerCase().includes(filter.toLowerCase());
        })
        .map((promptVersion) => ({
            name: promptVersion.fqn,
            value: promptVersion.fqn,
        }));

    // Sort with more recently updated prompts first
    results = results.sort((a, b) => {
        const versionA = promptVersions.find((p) => p.fqn === a.value);
        const versionB = promptVersions.find((p) => p.fqn === b.value);
        if (!versionA || !versionB) return 0;

        const dateA = new Date(versionA.updated_at || versionA.created_at || 0);
        const dateB = new Date(versionB.updated_at || versionB.created_at || 0);
        return dateB.getTime() - dateA.getTime();
    });

    return { results };
}
