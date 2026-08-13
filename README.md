# n8n-nodes-truefoundry

This is an n8n community node that integrates Truefoundry's LLM chat capabilities with n8n workflows. It provides a LangChain-compatible chat node with built-in metadata tracking for attribution, cost tracking, and monitoring.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Install the package from npm:

```bash
npm install n8n-nodes-truefoundry
```

Or follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

**NPM Package**: [n8n-nodes-truefoundry](https://www.npmjs.com/package/n8n-nodes-truefoundry)

## Operations

- **Chat with LLM**: Interact with OpenAI-compatible language models through Truefoundry
- **Metadata Tracking**: Automatically tracks workflow execution metadata for attribution and cost monitoring
- **LangChain Integration**: Compatible with LangChain's ChatOpenAI interface

## Credentials

This node requires Truefoundry API credentials. For detailed setup instructions, see the [Truefoundry n8n Integration Guide](https://truefoundry.com/docs/ai-gateway/n8n#what-is-n8n).

Quick setup:

1. Sign up for a Truefoundry account
2. Obtain your API key and base URL from the Truefoundry dashboard
3. Configure the credentials in n8n:
   - Go to Credentials → Add Credential
   - Select "Truefoundry API"
   - Enter your API key and base URL

## Features

- **Automatic Metadata Injection**: Tracks user ID, workflow ID, execution ID, and more
- **Cost Attribution**: Supports cost center and department tracking
- **Environment Management**: Configure different environments (production, staging, etc.)
- **Fallback User Email**: Set fallback user identification when n8n context is unavailable
- **Prompt Registry**: Bind a saved prompt from Truefoundry's Prompt Registry to the model

## Using the Prompt Registry

You can optionally bind a saved prompt from your Truefoundry [Prompt Registry](https://docs.truefoundry.com/docs/ai-gateway/prompt-management) to the model:

1. In the node's **Prompt** field, either:
   - Select **From List** to browse and search prompts (requires setting **Control Plane URL** on the credential), or
   - Select **FQN** and paste the prompt version FQN directly, e.g. `chat_prompt:truefoundry/default/my-prompt:1`
2. If the prompt has `{{variable}}` placeholders, fill in their values under **Prompt Variables**.

The prompt's messages are sent to the model first, followed by whatever messages the connected AI Agent/Chain sends. Note that the **Model** field always overrides any model configured on the prompt itself.

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Node.js version**: 18.x or higher
- **Tested with**: n8n 1.0+

## Usage

1. Add the "Truefoundry Chat" node to your workflow
2. Configure your Truefoundry API credentials
3. Select your model from the available options
4. Set up your chat prompt and parameters
5. Configure attribution settings (optional):
   - Application name
   - Cost center
   - Department
   - Environment
   - Fallback user email

The node automatically injects metadata headers for tracking and monitoring purposes.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Truefoundry n8n Integration Guide](https://truefoundry.com/docs/ai-gateway/n8n#what-is-n8n) - Complete setup and configuration guide
* [Truefoundry Documentation](https://docs.truefoundry.com/)
* [NPM Package](https://www.npmjs.com/package/n8n-nodes-truefoundry)
* [GitHub Repository](https://github.com/truefoundry/n8n-nodes-truefoundry)

## Version history

### 0.1.0
- Initial release
- LangChain ChatOpenAI integration
- Automatic metadata tracking
- Cost attribution support
- Environment configuration
