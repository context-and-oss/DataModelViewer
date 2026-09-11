import { LookupAttributeType } from "@/lib/Types"
import { useDatamodelView, useDatamodelViewDispatch } from "@/contexts/DatamodelViewContext"
import { Box, Typography, Button, Chip } from "@mui/material"
import { ContentPasteOffRounded, ContentPasteSearchRounded } from "@mui/icons-material";

export default function LookupAttribute({ attribute }: { attribute: LookupAttributeType }) {

    const { scrollToSection } = useDatamodelView();
    const dispatch = useDatamodelViewDispatch();

    return (
        <Box className="flex flex-wrap items-center gap-1 md:gap-2">
            <Typography className="font-semibold text-xs md:font-bold md:text-sm">Lookup</Typography>
            <Box className="flex flex-wrap gap-1">
                {attribute.Targets
                    .map(target => target.IsInSolution ? 
                        <Button
                            key={target.Name}
                            variant="outlined"
                            size="small"
                            startIcon={<ContentPasteSearchRounded className="w-2 h-2 md:w-3 md:h-3" />}
                            onClick={() => {
                                dispatch({ type: 'SET_LOADING_SECTION', payload: target.Name });
                                dispatch({ type: "SET_CURRENT_SECTION", payload: target.Name });
                                scrollToSection(target.Name, true);
                            }}
                            sx={{
                                fontSize: { xs: '0.625rem', md: '0.875rem' },
                                height: { xs: '16px', md: '24px' },
                                minWidth: 'auto',
                                px: { xs: 0.75, md: 1 },
                                '& .MuiButton-startIcon': {
                                    marginLeft: 0,
                                    marginRight: { xs: '2px', md: '4px' }
                                }
                            }}
                        >
                            {target.Name}
                        </Button> : 
                        <Chip 
                            key={target.Name}
                            icon={<ContentPasteOffRounded className="w-2 h-2 md:w-3 md:h-3" />}
                            label={target.Name}
                            size="small"
                            disabled
                            sx={{
                                fontSize: { xs: '0.625rem', md: '0.875rem' },
                                height: { xs: '16px', md: '24px' },
                                backgroundColor: 'grey.100',
                                color: 'grey.600',
                                '& .MuiChip-icon': {
                                    fontSize: { xs: '0.5rem', md: '0.75rem' }
                                }
                            }}
                        />
                    )}
            </Box>
        </Box>
    )
}