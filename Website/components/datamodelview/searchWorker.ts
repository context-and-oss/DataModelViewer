import { columnMatchesSearch } from "@/lib/columnSearch";
import { GroupType, EntityType, AttributeType, RelationshipType } from "@/lib/Types";

// Worker message types
interface InitMessage {
  type: 'init';
  groups: GroupType[];
}

interface EntityFilterState {
  hideStandardFields: boolean;
  typeFilter: string;
}

interface SearchScope {
  columnNames: boolean;
  columnDescriptions: boolean;
  columnDataTypes: boolean;
  tableDescriptions: boolean;
  securityRoles: boolean;
  relationships: boolean;
}

interface SearchMessage {
  type: 'search';
  data: string;
  entityFilters?: Record<string, EntityFilterState>;
  searchScope?: SearchScope;
  selectedSecurityRoles?: string[];
  requestId?: number;
}

type WorkerMessage = InitMessage | SearchMessage | string;

interface ResultsMessage {
  type: 'results';
  data: Array<
    | { type: 'group'; group: GroupType }
    | { type: 'entity'; group: GroupType; entity: EntityType }
    | { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType }
    | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType }
  >;
  complete: boolean;
  progress?: number;
  requestId?: number;
}

interface StartedMessage {
  type: 'started';
  requestId?: number;
}

type WorkerResponse = ResultsMessage | StartedMessage;

let groups: GroupType[] | null = null;
const CHUNK_SIZE = 20; // Process results in chunks

self.onmessage = async function (e: MessageEvent<WorkerMessage>) {
  // Handle initialization
  if (e.data && typeof e.data === 'object' && 'type' in e.data && e.data.type === 'init') {
    groups = e.data.groups;
    return;
  }

  if (!groups) {
    const response: WorkerResponse = { type: 'results', data: [], complete: true };
    self.postMessage(response);
    return;
  }

  // Handle search
  const search = (typeof e.data === 'string' ? e.data : e.data?.data || '').trim().toLowerCase();
  const entityFilters: Record<string, EntityFilterState> = (typeof e.data === 'object' && 'entityFilters' in e.data) ? e.data.entityFilters || {} : {};
  const requestId = (typeof e.data === 'object' && 'requestId' in e.data) ? e.data.requestId : undefined;
  const selectedSecurityRoles: string[] = (typeof e.data === 'object' && 'selectedSecurityRoles' in e.data) ? e.data.selectedSecurityRoles || [] : [];
  const searchScope: SearchScope = (typeof e.data === 'object' && 'searchScope' in e.data) ? e.data.searchScope || {
    columnNames: true,
    columnDescriptions: true,
    columnDataTypes: false,
    tableDescriptions: false,
    securityRoles: false,
    relationships: false,
  } : {
    columnNames: true,
    columnDescriptions: true,
    columnDataTypes: false,
    tableDescriptions: false,
    securityRoles: false,
    relationships: false,
  };

  if (!search) {
    const response: WorkerResponse = { type: 'results', data: [], complete: true, requestId };
    self.postMessage(response);
    return;
  }

  // First quickly send back a "started" message
  const startedMessage: WorkerResponse = { type: 'started', requestId };
  self.postMessage(startedMessage);

  const allItems: Array<
    | { type: 'group'; group: GroupType }
    | { type: 'entity'; group: GroupType; entity: EntityType }
    | { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType }
    | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType }
  > = [];

  // Helper function to check if entity has access from selected security roles
  const hasSecurityRoleAccess = (entity: EntityType): boolean => {
    if (selectedSecurityRoles.length === 0) return true; // No filter means show all

    return entity.SecurityRoles.some(role =>
      selectedSecurityRoles.includes(role.Name) &&
      (role.Read !== null && role.Read >= 0) // Has any read access
    );
  };

  ////////////////////////////////////////////////
  // Finding matches part
  ////////////////////////////////////////////////
  for (const group of groups) {
    let groupUsed = false;
    for (const entity of group.Entities) {
      // Filter by security roles first - skip entity if no access
      if (!hasSecurityRoleAccess(entity)) {
        continue;
      }

      // Get entity-specific filters (default to showing all if not set)
      const entityFilter = entityFilters[entity.SchemaName] || { hideStandardFields: true, typeFilter: 'all' };

      // Find all matching attributes
      const matchingAttributes = entity.Attributes.filter((attr: AttributeType) => {
        // Apply hideStandardFields filter
        if (entityFilter.hideStandardFields) {
          const isStandardFieldHidden = !attr.IsCustomAttribute && !attr.IsStandardFieldModified;
          if (isStandardFieldHidden || attr.SchemaName.endsWith("Base")) return false;
        }

        // Apply type filter
        if (entityFilter.typeFilter && entityFilter.typeFilter !== 'all') {
          // Special case: ChoiceAttribute filter also includes StatusAttribute
          if (entityFilter.typeFilter === 'ChoiceAttribute') {
            if (attr.AttributeType !== 'ChoiceAttribute' && attr.AttributeType !== 'StatusAttribute') {
              return false;
            }
          } else {
            if (attr.AttributeType !== entityFilter.typeFilter) {
              return false;
            }
          }
        }

        return columnMatchesSearch(attr, search, searchScope);
      });

      // Check for table description matches
      let tableDescriptionMatches = false;
      if (searchScope.tableDescriptions) {
        if (entity.Description && entity.Description.toLowerCase().includes(search)) {
          tableDescriptionMatches = true;
        }
        if (entity.DisplayName && entity.DisplayName.toLowerCase().includes(search)) {
          tableDescriptionMatches = true;
        }
        if (entity.SchemaName.toLowerCase().includes(search)) {
          tableDescriptionMatches = true;
        }
      }

      // Check for security role matches
      let securityRoleMatches = false;
      if (searchScope.securityRoles && entity.SecurityRoles) {
        securityRoleMatches = entity.SecurityRoles.some(role =>
          role.Name.toLowerCase().includes(search) || role.LogicalName.toLowerCase().includes(search)
        );
      }

      // Check for relationship matches and collect matching relationships
      const matchingRelationships = [];
      if (searchScope.relationships && entity.Relationships && groups) {
        // Helper function to check if an entity is in the solution (exists in groups)
        const isEntityInSolution = (entitySchemaName: string): boolean => {
          return groups!.some(group =>
            group.Entities.some(e => e.SchemaName === entitySchemaName)
          );
        };

        for (const rel of entity.Relationships) {
          // Apply same default filters as the Relationships component:
          // 1. Hide implicit relationships by default (only show IsExplicit === true)
          // 2. Hide relationships to tables not in solution
          if (!rel.IsExplicit) continue;
          if (!isEntityInSolution(rel.TableSchema)) continue;

          if (
            rel.RelationshipSchema.toLowerCase().includes(search) ||
            (rel.LookupDisplayName && rel.LookupDisplayName.toLowerCase().includes(search))
          ) {
            matchingRelationships.push(rel);
          }
        }
      }
      const relationshipMatches = matchingRelationships.length > 0;

      // If we have any matches, add the entity
      const hasMatches = matchingAttributes.length > 0 || tableDescriptionMatches || securityRoleMatches || relationshipMatches;

      if (hasMatches) {
        if (!groupUsed) allItems.push({ type: 'group', group });
        groupUsed = true;
        allItems.push({ type: 'entity', group, entity });

        // Add matching attributes
        for (const attr of matchingAttributes) {
          allItems.push({ type: 'attribute', group, entity, attribute: attr });
        }

        // Add matching relationships
        for (const rel of matchingRelationships) {
          allItems.push({ type: 'relationship', group, entity, relationship: rel });
        }
      }
    }
  }

  if (allItems.length === 0) {
    const response: WorkerResponse = { type: 'results', data: [], complete: true, requestId };
    self.postMessage(response);
    return;
  }

  // Send results in chunks to prevent UI blocking
  for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
    const chunk = allItems.slice(i, i + CHUNK_SIZE);
    const isLastChunk = i + CHUNK_SIZE >= allItems.length;

    const response: WorkerResponse = {
      type: 'results',
      data: chunk,
      complete: isLastChunk,
      progress: Math.min(100, Math.round((i + CHUNK_SIZE) / allItems.length * 100)),
      requestId
    };

    self.postMessage(response);

    // Small delay between chunks to let the UI breathe
    if (!isLastChunk) {
      // Use a proper yielding mechanism to let the UI breathe
      await sleep(5);
    }
  }
};

// Helper function to pause execution for a specified duration
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
