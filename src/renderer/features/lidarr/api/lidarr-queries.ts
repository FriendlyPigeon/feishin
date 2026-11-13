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

interface AlbumsByArtistArgs {
    artistId: number;
    enabled?: boolean;
}

interface ArtistArgs {
    artistId: number;
    enabled?: boolean;
}

interface ArtistByMbidArgs {
    enabled?: boolean;
    mbid: string;
}

interface ArtistLookupArgs {
    enabled?: boolean;
    term: string;
}

interface ConfigListArgs {
    enabled?: boolean;
}

export const lidarrQueryKeys = {
    album: (albumId: number) => [LIDARR_QUERY_KEY, 'album', albumId] as const,
    albumLookup: (term: string) => [LIDARR_QUERY_KEY, 'albumLookup', term] as const,
    albumsByArtist: (artistId: number) => [LIDARR_QUERY_KEY, 'albumsByArtist', artistId] as const,
    all: [LIDARR_QUERY_KEY] as const,
    artist: (artistId: number) => [LIDARR_QUERY_KEY, 'artist', artistId] as const,
    artistByMbid: (mbid: string) => [LIDARR_QUERY_KEY, 'artistByMbid', mbid] as const,
    artistLookup: (term: string) => [LIDARR_QUERY_KEY, 'artistLookup', term] as const,
    metadataProfiles: () => [LIDARR_QUERY_KEY, 'metadataProfiles'] as const,
    qualityProfiles: () => [LIDARR_QUERY_KEY, 'qualityProfiles'] as const,
    rootFolders: () => [LIDARR_QUERY_KEY, 'rootFolders'] as const,
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
    albumsByArtist: (args: AlbumsByArtistArgs) => {
        return queryOptions({
            enabled: args.enabled,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getAlbumsByArtist(config.url, config.apiKey, args.artistId);
            },
            queryKey: lidarrQueryKeys.albumsByArtist(args.artistId),
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
    artistByMbid: (args: ArtistByMbidArgs) => {
        return queryOptions({
            enabled: args.enabled && args.mbid.length > 0,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getArtistByMbid(config.url, config.apiKey, args.mbid);
            },
            queryKey: lidarrQueryKeys.artistByMbid(args.mbid),
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
    metadataProfiles: (args: ConfigListArgs) => {
        return queryOptions({
            enabled: args.enabled,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getMetadataProfiles(config.url, config.apiKey);
            },
            queryKey: lidarrQueryKeys.metadataProfiles(),
            staleTime: 1000 * 60 * 5,
        });
    },
    qualityProfiles: (args: ConfigListArgs) => {
        return queryOptions({
            enabled: args.enabled,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getQualityProfiles(config.url, config.apiKey);
            },
            queryKey: lidarrQueryKeys.qualityProfiles(),
            staleTime: 1000 * 60 * 5,
        });
    },
    rootFolders: (args: ConfigListArgs) => {
        return queryOptions({
            enabled: args.enabled,
            queryFn: async () => {
                const config = useLidarrStore.getState();
                return lidarrClient.getRootFolders(config.url, config.apiKey);
            },
            queryKey: lidarrQueryKeys.rootFolders(),
            staleTime: 1000 * 60 * 5,
        });
    },
};
