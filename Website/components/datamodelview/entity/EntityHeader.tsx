'use client'

import { useDatamodelData } from "@/contexts/DatamodelDataContext";
import { highlightMatch } from "@/lib/searchHighlight";
import { EntityType } from "@/lib/Types";
import { EntityDetails } from "./EntityDetails";
import { Box, Typography, Paper, useTheme, Tooltip } from '@mui/material';
import { LinkRounded } from "@mui/icons-material";
import { useCallback } from 'react';
import { copyToClipboard, generateSectionLink } from "@/lib/clipboard-utils";
import { useSnackbar } from "@/contexts/SnackbarContext";

export function EntityHeader({ entity }: { entity: EntityType }) {
    const theme = useTheme();
    const { search, searchScope } = useDatamodelData();
    const { showSnackbar } = useSnackbar();
    
    const handleCopyLink = useCallback(async () => {
        const link = generateSectionLink(entity.SchemaName);
        const success = await copyToClipboard(link);
        if (success) {
            showSnackbar('Link copied to clipboard!', 'success');
        } else {
            showSnackbar('Failed to copy link', 'error');
        }
    }, [entity.SchemaName, showSnackbar]);
    
    return (
        <Box 
            sx={{ 
                minWidth: 0, 
                width: { xl: '33.333333%', xs: '100%' }, 
                pr: { xl: 3, xs: 0 } 
            }}
        >
            <Box className="flex gap-1.5 mb-1.5 items-start">
                <Tooltip title="Copy link to this section">
                    <Box 
                        className="flex mt-1"
                        sx={{ 
                            flexShrink: 0,
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.7
                            }
                        }}
                        onClick={handleCopyLink}
                    >
                        {entity.IconBase64 == null ? 
                            <LinkRounded 
                                style={{ 
                                    height: '24px', 
                                    width: '24px', 
                                    color: theme.palette.text.secondary 
                                }} 
                            /> : 
                            <div 
                                className="h-6 w-6"
                                style={{
                                    maskImage: `url(data:image/svg+xml;base64,${entity.IconBase64})`,
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    backgroundColor: theme.palette.text.primary
                                }}
                            />
                        }
                    </Box>
                </Tooltip>
                <Box sx={{ minWidth: 0, flex: 1 }} className="flex items-center flex-wrap">
                    <Tooltip title="Copy link to this section">
                        <Typography 
                            variant="h5" 
                            component="h2"
                            className="entity-title mr-2"
                            sx={{ 
                                fontWeight: 600,
                                color: 'text.primary',
                                transition: 'color 0.2s',
                                minWidth: 0,
                                cursor: 'pointer',
                                '&:hover': {
                                    color: 'primary.main'
                                }
                            }}
                            onClick={handleCopyLink}
                        >
                            {entity.DisplayName}
                        </Typography>
                    </Tooltip>
                    <Tooltip title="Copy link to this section">
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                                flexShrink: 0,
                                cursor: 'pointer',
                                '&:hover': {
                                    color: 'primary.main'
                                }
                            }}
                            onClick={handleCopyLink}
                        >
                            {entity.SchemaName}
                        </Typography>
                    </Tooltip>
                </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
                <EntityDetails entity={entity} />
            </Box>

            {entity.Description && (
                <Paper 
                    variant="outlined"
                    sx={{ 
                        p: 2,
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.02)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        borderColor: 'border.main'
                    }}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'text.secondary',
                            lineHeight: 1.6
                        }}
                    >
                        {highlightMatch(entity.Description, searchScope.tableDescriptions ? search : "")}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}