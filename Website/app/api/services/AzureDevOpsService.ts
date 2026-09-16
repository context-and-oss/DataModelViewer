/* eslint-disable @typescript-eslint/no-explicit-any */
import { managedAuth } from '../auth/azuredevops/ManagedIdentityAuthService';

interface CreateFileOptions {
    filePath: string;
    content: string;
    commitMessage?: string;
    branch?: string;
    repositoryName?: string; // Optional override
    isUpdate?: boolean; // Flag to indicate if this is updating an existing file
    isBinary?: boolean; // Flag to indicate content is binary data encoded as latin1 string
}

interface LoadFileOptions {
    filePath: string;
    branch?: string;
    repositoryName?: string; // Optional override
}

interface GitItem {
    objectId: string;
    gitObjectType: string;
    commitId: string;
    path: string;
    isFolder: boolean;
}

interface GitFileResponse {
    objectId: string;
    gitObjectType: string;
    commitId: string;
    path: string;
    content?: string;
}

interface GitCommitResponse {
    commitId: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    committer: {
        name: string;
        email: string;
        date: string;
    };
    comment: string;
}

interface FileVersionOptions {
    filePath: string;
    repositoryName?: string;
    maxVersions?: number; // Optional limit on number of versions to return
}

interface FileVersion {
    commitId: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    committer: {
        name: string;
        email: string;
        date: string;
    };
    comment: string;
    changeType: string; // add, edit, delete, etc.
    objectId: string;
}

interface LoadFileVersionOptions {
    filePath: string;
    commitId: string;
    repositoryName?: string;
}

class AzureDevOpsError extends Error {
    constructor(message: string, public statusCode?: number, public response?: unknown) {
        super(message);
        this.name = 'AzureDevOpsError';
    }
}

/**
 * Builds a URL for the Azure DevOps Git REST API.
 *
 * The organization and project come from configuration, but the repository
 * name and the query values are routinely taken from a request. Interpolating
 * those straight into the URL lets a `../` walk out of the repositories path
 * and an `&` append parameters the caller never wrote - on a request that
 * carries the managed-identity token. Encoding each part keeps every value
 * inside the slot it was meant for.
 */
function buildGitApiUrl(
    repositoryName: string | undefined,
    resourcePath = '',
    query: Record<string, string | number | undefined> = {}
): string {
    const config = managedAuth.getConfig();

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
            params.set(key, String(value));
        }
    }
    params.set('api-version', '7.0');

    const repository = encodeURIComponent(repositoryName ?? '');
    const resource = resourcePath ? `/${resourcePath}` : '';

    return `${config.organizationUrl}${config.projectName}/_apis/git/repositories/${repository}${resource}?${params}`;
}

/**
 * Lists files in the Azure DevOps Git repository
 * @param options Configuration for file retrieval
 * @returns Promise with array of file items
 */
export async function listFilesFromRepo(options: LoadFileOptions): Promise<GitItem[]> {
    const {
        filePath,
        branch = 'main',
        repositoryName
    } = options;

    try {
        // Construct the API URL for listing items in a folder
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const itemsUrl = buildGitApiUrl(repositoryName, 'items', {
            scopePath: `/${normalizedPath}`,
            version: branch,
            recursionLevel: 'OneLevel'
        });

        const response = await managedAuth.makeAuthenticatedRequest(itemsUrl);

        if (!response.ok) {
            if (response.status === 404) {
                throw new AzureDevOpsError(`Folder not found: ${filePath}`, 404);
            }
            const errorText = await response.text();
            throw new AzureDevOpsError(`Failed to list files: ${response.status} - ${errorText}`, response.status);
        }

        const data = await response.json();

        if (!data.value || !Array.isArray(data.value)) {
            return [];
        }

        // Filter for files only (not folders) and return as GitItem array
        return data.value
            .filter((item: any) => !item.isFolder)
            .map((item: any) => ({
                objectId: item.objectId,
                gitObjectType: item.gitObjectType,
                commitId: item.commitId,
                path: item.path,
                isFolder: item.isFolder,
                contentMetadata: item.contentMetadata
            }));

    } catch (error) {
        if (error instanceof AzureDevOpsError) {
            throw error;
        }
        throw new AzureDevOpsError(`Unexpected error listing files: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Creates a JSON file in the Azure DevOps Git repository
 * @param options Configuration for file creation
 * @returns Promise with commit information
 */
export async function commitFileToRepo(options: CreateFileOptions): Promise<GitCommitResponse> {
    const {
        filePath,
        content,
        commitMessage = `Add ${filePath}`,
        branch = 'main',
        repositoryName,
        isUpdate = false,
        isBinary = false
    } = options;

    try {
        // Validate inputs
        if (!filePath || content === undefined) {
            throw new AzureDevOpsError('File path and content are required');
        }

        // Convert content to base64
        // For binary data, content is latin1 encoded string, so we need to use latin1 encoding
        // For text data, use default utf8 encoding
        const base64Content = isBinary
            ? Buffer.from(content, 'latin1').toString('base64')
            : Buffer.from(content).toString('base64');

        // Get the latest commit ID for the branch (needed for push operation)
        const refsUrl = buildGitApiUrl(repositoryName, 'refs', { filter: `heads/${branch}` });
        const refsResponse = await managedAuth.makeAuthenticatedRequest(refsUrl);

        if (!refsResponse.ok) {
            const errorText = await refsResponse.text();
            throw new AzureDevOpsError(`Failed to get branch refs: ${refsResponse.status} - ${errorText}`, refsResponse.status);
        }

        const refsData = await refsResponse.json();
        const currentCommitId = refsData.value?.[0]?.objectId;

        if (!currentCommitId) {
            throw new AzureDevOpsError(`Branch '${branch}' not found or has no commits`);
        }

        // Create the push payload
        const pushPayload = {
            refUpdates: [
                {
                    name: `refs/heads/${branch}`,
                    oldObjectId: currentCommitId
                }
            ],
            commits: [
                {
                    comment: commitMessage,
                    author: {
                        name: "DataModelViewer",
                        email: "system@datamodelviewer.com"
                    },
                    changes: [
                        {
                            changeType: isUpdate ? "edit" : "add",
                            item: {
                                path: filePath.startsWith('/') ? filePath : `/${filePath}`
                            },
                            newContent: {
                                content: base64Content,
                                contentType: "base64encoded"
                            }
                        }
                    ]
                }
            ]
        };

        // Push the changes
        const pushUrl = buildGitApiUrl(repositoryName, 'pushes');
        const pushResponse = await managedAuth.makeAuthenticatedRequest(pushUrl, {
            method: 'POST',
            body: JSON.stringify(pushPayload)
        });

        if (!pushResponse.ok) {
            const errorText = await pushResponse.text();
            throw new AzureDevOpsError(`Failed to create file: ${pushResponse.status} - ${errorText}`, pushResponse.status);
        }

        const pushData = await pushResponse.json();

        return {
            commitId: pushData.commits[0].commitId,
            author: pushData.commits[0].author,
            committer: pushData.commits[0].committer,
            comment: pushData.commits[0].comment
        };

    } catch (error) {
        if (error instanceof AzureDevOpsError) {
            throw error;
        }
        throw new AzureDevOpsError(`Unexpected error creating file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Loads a JSON file from the Azure DevOps Git repository
 * @param options Configuration for file loading
 * @returns Promise with parsed JSON content
 */
export async function pullFileFromRepo<T>(options: LoadFileOptions): Promise<T> {
    const {
        filePath,
        branch = 'main',
        repositoryName
    } = options;

    try {
        // Validate inputs
        if (!filePath) {
            throw new AzureDevOpsError('File path is required');
        }

        // Construct the API URL for getting file content
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const fileUrl = buildGitApiUrl(repositoryName, 'items', {
            path: `/${normalizedPath}`,
            'versionDescriptor.version': branch,
            'versionDescriptor.versionType': 'branch',
            includeContent: 'true'
        });

        const response = await managedAuth.makeAuthenticatedRequest(fileUrl);

        if (!response.ok) {
            if (response.status === 404) {
                throw new AzureDevOpsError(`File not found: ${filePath}`, 404);
            }
            const errorText = await response.text();
            throw new AzureDevOpsError(`Failed to load file: ${response.status} - ${errorText}`, response.status);
        }

        const fileData: GitFileResponse = await response.json();

        if (!fileData.content) {
            throw new AzureDevOpsError(`File content is empty: ${fileUrl}`);
        }

        try {
            return JSON.parse(fileData.content) as T;
        } catch (parseError) {
            throw new AzureDevOpsError(`Failed to parse JSON content: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }

    } catch (error) {
        if (error instanceof AzureDevOpsError) {
            throw error;
        }
        throw new AzureDevOpsError(`Unexpected error loading file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Lists all versions (commits) of a specific file in the Azure DevOps Git repository
 * @param options Configuration for file version retrieval
 * @returns Promise with array of file versions
 */
export async function listFileVersions(options: FileVersionOptions): Promise<FileVersion[]> {
    const {
        filePath,
        repositoryName,
        maxVersions = 50 // Default to 50 versions
    } = options;

    try {
        // Validate inputs
        if (!filePath) {
            throw new AzureDevOpsError('File path is required');
        }

        // Construct the API URL for getting file commit history
        const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
        const commitsUrl = buildGitApiUrl(repositoryName, 'commits', {
            'searchCriteria.$top': maxVersions,
            'searchCriteria.itemPath': normalizedPath
        });

        const response = await managedAuth.makeAuthenticatedRequest(commitsUrl);

        if (!response.ok) {
            if (response.status === 404) {
                throw new AzureDevOpsError(`File not found: ${filePath}`, 404);
            }
            const errorText = await response.text();
            throw new AzureDevOpsError(`Failed to get file versions: ${response.status} - ${errorText}`, response.status);
        }

        const commitsData = await response.json();

        if (!commitsData.value || !Array.isArray(commitsData.value)) {
            return [];
        }

        // Get detailed change information for each commit
        const versions: FileVersion[] = [];

        for (const commit of commitsData.value) {
            try {
                // Get the changes for this specific commit to determine the change type
                const changesUrl = buildGitApiUrl(repositoryName, `commits/${encodeURIComponent(commit.commitId)}/changes`);
                const changesResponse = await managedAuth.makeAuthenticatedRequest(changesUrl);

                if (changesResponse.ok) {
                    const changesData = await changesResponse.json();
                    const fileChange = changesData.changes?.find((change: any) =>
                        change.item?.path === normalizedPath
                    );

                    if (fileChange) {
                        versions.push({
                            commitId: commit.commitId,
                            author: commit.author,
                            committer: commit.committer,
                            comment: commit.comment,
                            changeType: fileChange.changeType || 'edit',
                            objectId: fileChange.item?.objectId || commit.commitId
                        });
                    }
                } else {
                    // Fallback: add commit without detailed change info
                    versions.push({
                        commitId: commit.commitId,
                        author: commit.author,
                        committer: commit.committer,
                        comment: commit.comment,
                        changeType: 'edit', // Default assumption
                        objectId: commit.commitId
                    });
                }
            } catch (error) {
                // Continue with other commits if one fails
                console.warn(`Failed to get changes for commit ${commit.commitId}:`, error);
            }
        }

        return versions;

    } catch (error) {
        if (error instanceof AzureDevOpsError) {
            throw error;
        }
        throw new AzureDevOpsError(`Unexpected error listing file versions: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Loads a specific version of a file from the Azure DevOps Git repository
 * @param options Configuration for file version loading
 * @returns Promise with parsed JSON content from the specified version
 */
export async function pullFileVersion<T>(options: LoadFileVersionOptions): Promise<T> {
    const {
        filePath,
        commitId,
        repositoryName
    } = options;

    try {
        // Validate inputs
        if (!filePath || !commitId) {
            throw new AzureDevOpsError('File path and commit ID are required');
        }

        // Construct the API URL for getting file content at specific commit
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const fileUrl = buildGitApiUrl(repositoryName, 'items', {
            path: `/${normalizedPath}`,
            'versionDescriptor.version': commitId,
            'versionDescriptor.versionType': 'commit',
            includeContent: 'true'
        });

        const response = await managedAuth.makeAuthenticatedRequest(fileUrl);

        if (!response.ok) {
            if (response.status === 404) {
                throw new AzureDevOpsError(`File not found at commit ${commitId}: ${filePath}`, 404);
            }
            const errorText = await response.text();
            throw new AzureDevOpsError(`Failed to load file version: ${response.status} - ${errorText}`, response.status);
        }

        const fileData: GitFileResponse = await response.json();

        if (!fileData.content) {
            throw new AzureDevOpsError(`File content is empty at commit ${commitId}: ${filePath}`);
        }

        try {
            return JSON.parse(fileData.content) as T;
        } catch (parseError) {
            throw new AzureDevOpsError(`Failed to parse JSON content: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }

    } catch (error) {
        if (error instanceof AzureDevOpsError) {
            throw error;
        }
        throw new AzureDevOpsError(`Unexpected error loading file version: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Helper function to get repository information using environment variable
export async function getRepositoryInfo(repositoryName?: string): Promise<{ id: string; name: string; webUrl: string }> {
    try {
        const config = managedAuth.getConfig();
        const repoName = repositoryName || process.env.AdoRepositoryName || config.repositoryName;

        if (!repoName) {
            throw new AzureDevOpsError('Repository name not found. Set AdoRepositoryName environment variable or pass repositoryName parameter.');
        }

        const repoUrl = buildGitApiUrl(repoName);
        const response = await managedAuth.makeAuthenticatedRequest(repoUrl);

        if (!response.ok) {
            const errorText = await response.text();
            throw new AzureDevOpsError(`Failed to get repository info: ${response.status} - ${errorText}`, response.status);
        }

        const repoData = await response.json();

        return {
            id: repoData.id,
            name: repoData.name,
            webUrl: repoData.webUrl
        };

    } catch (error) {
        if (error instanceof AzureDevOpsError) {
            throw error;
        }
        throw new AzureDevOpsError(`Unexpected error getting repository info: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Export types for external use
export type {
    CreateFileOptions,
    LoadFileOptions,
    FileVersionOptions,
    LoadFileVersionOptions,
    GitCommitResponse,
    GitFileResponse,
    GitItem,
    FileVersion
};
export { AzureDevOpsError };