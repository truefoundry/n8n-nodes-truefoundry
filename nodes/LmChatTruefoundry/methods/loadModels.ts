import type {
    ILoadOptionsFunctions,
    INodeListSearchItems,
    INodeListSearchResult,
} from 'n8n-workflow';

interface GatewayModel {
    id: string;
    created: number;
}

interface ListModelsResponse {
    data?: GatewayModel[];
}

export async function searchModels(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
    const credentials = await this.getCredentials('truefoundryApi');

    const baseURL = ((credentials.gatewayURL as string) || 'https://gateway.truefoundry.ai/').replace(/\/$/, '');

    const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'truefoundryApi', {
        method: 'GET',
        url: `${baseURL}/models`,
        json: true,
    })) as ListModelsResponse;

    const models = response.data ?? [];

    // TODO: check openai node for agent logic
    let results: INodeListSearchItems[] = [];

    if (filter) {
        for (const model of models) {
            if (model.id.toLowerCase().includes(filter.toLowerCase())) {
                results.push({
                    name: model.id,
                    value: model.id,
                });
            }
        }
    } else {
        for (const model of models) {
            results.push({
                name: model.id,
                value: model.id,
            });
        }
    }

    // Sort models with more recent ones first
    results = results.sort((a, b) => {
        const modelA = models.find((m) => m.id === a.value);
        const modelB = models.find((m) => m.id === b.value);
        if (!modelA || !modelB) return 0;

        // Sort by created_at date, most recent first
        const dateA = new Date(modelA.created);
        const dateB = new Date(modelB.created);
        return dateB.getTime() - dateA.getTime();
    });

    return { results };
}