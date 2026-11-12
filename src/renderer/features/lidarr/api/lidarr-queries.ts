import { queryOptions } from '@tanstack/react-query';

import { lidarrClient } from '/@/renderer/api/lidarr/lidarr-client';
import { useLidarrStore } from '/@/renderer/features/lidarr/store/lidarr.store';

const LIDARR_QUERY_KEY = 'lidarr';

interface AlbumArgs {
    albumId: number;
    enabled?: boolean;
}

interface AlbumLookupArgs {
    enabled?: boolean;
    term: string;
}

interface ArtistArgs {
    artistId: number;
    enabled?: boolean;
}

interface ArtistLookupArgs {
    enabled?: boolean;
    term: string;
}

export const lidarrQueryKeys = {
    album: (albumId: number) => [LIDARR_QUERY_KEY, 'album', albumId] as const,
    albumLookup: (term: string) => [LIDARR_QUERY_KEY, 'albumLookup', term] as const,
    artist: (artistId: number) => [LIDARR_QUERY_KEY, 'artist', artistId] as const,
    artistLookup: (term: string) => [LIDARR_QUERY_KEY, 'artistLookup', term] as const,
};

export const lidarrQueries = {
    album: (args: AlbumArgs) => {
        return queryOptions({
            enabled: args.enabled,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getAlbum(config.url, config.apiKey, args.albumId);
            },
            queryKey: lidarrQueryKeys.album(args.albumId),
        });
    },
    albumLookup: (args: AlbumLookupArgs) => {
        return queryOptions({
            enabled: args.enabled && args.term.length > 0,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.lookupAlbum(config.url, config.apiKey, args.term);
            },
            queryKey: lidarrQueryKeys.albumLookup(args.term),
        });
    },
    artist: (args: ArtistArgs) => {
        return queryOptions({
            enabled: args.enabled,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getArtist(config.url, config.apiKey, args.artistId);
            },
            queryKey: lidarrQueryKeys.artist(args.artistId),
        });
    },
    artistLookup: (args: ArtistLookupArgs) => {
        return queryOptions({
            enabled: args.enabled && args.term.length > 0,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.lookupArtist(config.url, config.apiKey, args.term);
            },
            queryKey: lidarrQueryKeys.artistLookup(args.term),
        });
    },
};
