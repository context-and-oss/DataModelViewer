import { DefaultAzureCredential } from '@azure/identity';

interface AdoConfig {
    organizationUrl: string;
    projectName: string;
    repositoryName: string;
}

class ManagedIdentityAuth {
    private credential: DefaultAzureCredential;
    private tokenCache: { token: string; expires: Date } | null = null;
    private config: AdoConfig;

    constructor() {
        this.credential = new DefaultAzureCredential();
        this.config = {
            organizationUrl: process.env.ADO_ORGANIZATION_URL || '',
            projectName: process.env.ADO_PROJECT_NAME || '',
            repositoryName: process.env.ADO_REPOSITORY_NAME || ''
        };
    }

    async getAccessToken(): Promise<string> {
        if (this.tokenCache && this.tokenCache.expires > new Date()) {
            return this.tokenCache.token;
        }

        try {
            const tokenResponse = await this.credential.getToken(
                'https://app.vssps.visualstudio.com/.default'
            );

            if (!tokenResponse) {
                throw new Error('Failed to get managed identity token');
            }

            this.tokenCache = {
                token: tokenResponse.token,
                expires: new Date(tokenResponse.expiresOnTimestamp)
            };

            return tokenResponse.token;
        } catch (error) {
            console.error('Error getting managed identity token:', error);
            throw error;
        }
    }

    /**
     * Rejects any URL that does not sit inside the configured organization and
     * project. Callers assemble URLs from request data, so this is the last
     * point at which a value that escaped its path segment can be caught -
     * before the managed-identity token is attached and sent. `new URL()`
     * resolves `..` first, so traversal is compared after normalization.
     */
    private assertConfiguredTarget(url: string): URL {
        const target = new URL(url);
        const allowed = new URL(`${this.config.organizationUrl}${this.config.projectName}/`);

        if (target.origin !== allowed.origin || !target.pathname.startsWith(allowed.pathname)) {
            throw new Error(
                `Refusing to send Azure DevOps credentials to ${target.origin}${target.pathname} - ` +
                `only ${allowed.origin}${allowed.pathname} is configured.`
            );
        }

        return target;
    }

    async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
        // Send the URL that was checked, not the string it was parsed from, so
        // the request cannot differ from what the guard approved.
        const target = this.assertConfiguredTarget(url);

        // Use PAT for local development, Managed Identity for production
        const pat = process.env.ADO_PAT;
        const isLocal = process.env.NODE_ENV === 'development' || pat;
        
        let authHeaders: Record<string, string>;
        
        if (isLocal && pat) {
            console.log('Using PAT authentication for local development');
            const basic = Buffer.from(`:${pat}`).toString('base64');
            authHeaders = {
                'Authorization': `Basic ${basic}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-TFS-FedAuthRedirect': 'Suppress'
            };
        } else {
            const token = await this.getAccessToken();
            authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
        }
         
        return fetch(target, {
            ...options,
            headers: {
                ...options.headers,
                ...authHeaders
            }
        });
    }

    getConfig(): AdoConfig {
        return this.config;
    }
}

export const managedAuth = new ManagedIdentityAuth();