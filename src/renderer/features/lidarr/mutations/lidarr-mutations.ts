import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lidarrClient } from '/@/renderer/api/lidarr/lidarr-client';
import { lidarrQueryKeys } from '/@/renderer/features/lidarr/api/lidarr-queries';
import { useLidarrStore } from '/@/renderer/features/lidarr/store/lidarr.store';
import { toast } from '/@/shared/components/toast/toast';

interface AddArtistArgs {
    artistMbid: string;
    artistName: string;
}

interface MonitorAlbumArgs {
    albumId: number;
    artistId: number;
}

const getRequiredDefaults = () => {
    const state = useLidarrStore.getState();
    const { metadataProfileId, qualityProfileId, rootFolderPath } = state;

    if (!rootFolderPath || !qualityProfileId || !metadataProfileId) {
        throw new Error('error.lidarr.missingDefaults');
    }

    return { metadataProfileId, qualityProfileId, rootFolderPath };
};

export const useAddArtistMutation = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ artistMbid, artistName }: AddArtistArgs) => {
            const config = useLidarrStore.getState();
            const defaults = getRequiredDefaults();

            return lidarrClient.addArtist(config.url, config.apiKey, {
                addOptions: {
                    monitor: config.artistMonitorMode,
                    searchForMissingAlbums: config.searchForMissingAlbums,
                },
                artistName,
                foreignArtistId: artistMbid,
                metadataProfileId: defaults.metadataProfileId,
                monitored: config.artistMonitorMode !== 'none',
                qualityProfileId: defaults.qualityProfileId,
                rootFolderPath: defaults.rootFolderPath,
            });
        },
        onError: (error: Error) => {
            toast.error({
                message:
                    error.message === 'error.lidarr.missingDefaults'
                        ? t('error.lidarr.missingDefaults')
                        : t('error.lidarr.addArtistFailed'),
            });
        },
        onSuccess: (_data, variables) => {
            toast.success({ message: t('success.lidarr.artistAdded') });
            queryClient.invalidateQueries({ queryKey: lidarrQueryKeys.all });
            queryClient.invalidateQueries({
                queryKey: lidarrQueryKeys.artistByMbid(variables.artistMbid),
            });
        },
    });
};

export const useMonitorAlbumMutation = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ albumId }: MonitorAlbumArgs) => {
            const config = useLidarrStore.getState();

            await lidarrClient.monitorAlbums(config.url, config.apiKey, {
                albumIds: [albumId],
                monitored: true,
            });
            await lidarrClient.searchAlbums(config.url, config.apiKey, [albumId]);
        },
        onError: () => {
            toast.error({ message: t('error.lidarr.addAlbumFailed') });
        },
        onSuccess: (_data, variables) => {
            toast.success({ message: t('success.lidarr.albumAdded') });
            queryClient.invalidateQueries({
                queryKey: lidarrQueryKeys.albumsByArtist(variables.artistId),
            });
        },
    });
};
