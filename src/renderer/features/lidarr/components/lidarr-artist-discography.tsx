import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lidarr-artist-discography.module.css';

import {
    isLidarrAlbumInLibrary,
    normalizeLidarrAlbum,
} from '/@/renderer/api/lidarr/lidarr-normalize';
import { LidarrAlbum } from '/@/renderer/api/lidarr/lidarr-types';
import { MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useArtistAlbumsGrouped } from '/@/renderer/features/artists/hooks/use-artist-albums-grouped';
import { lidarrQueries } from '/@/renderer/features/lidarr/api/lidarr-queries';
import {
    useAddArtistMutation,
    useMonitorAlbumMutation,
} from '/@/renderer/features/lidarr/mutations/lidarr-mutations';
import {
    useLidarrConfig,
    useLidarrDefaults,
    useLidarrEnabled,
} from '/@/renderer/features/lidarr/store/lidarr.store';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { Album, LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface LidarrAlbumSectionProps {
    albums: Album[];
    itemsPerRow: number;
    lidarrAlbumByForeignId: Map<string, LidarrAlbum>;
    onAddAlbum: (album: Album) => void;
    pendingAlbumId: null | number;
    releaseType: string;
    title: React.ReactNode | string;
}

const getItemsPerRow = (cq: ReturnType<typeof useContainerQuery>) => {
    if (cq.is3xl) return 8;
    if (cq.is2xl) return 7;
    if (cq.isXl) return 6;
    if (cq.isLg) return 5;
    if (cq.isMd) return 4;
    if (cq.isSm) return 3;
    if (cq.isXs) return 2;
    return 2;
};

const LidarrMissingAlbumCard = memo(function LidarrMissingAlbumCard({
    album,
    lidarrAlbum,
    onAddAlbum,
    pendingAlbumId,
}: {
    album: Album;
    lidarrAlbum?: LidarrAlbum;
    onAddAlbum: (album: Album) => void;
    pendingAlbumId: null | number;
}) {
    const { t } = useTranslation();
    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);

    const isMonitored = lidarrAlbum?.monitored ?? false;
    const isPending = Boolean(lidarrAlbum?.id && pendingAlbumId === lidarrAlbum.id);

    return (
        <div className={styles.albumCard}>
            <MemoizedItemCard
                data={album}
                enableDrag={false}
                enableExpansion
                enableNavigation={false}
                itemType={LibraryItem.ALBUM}
                rows={rows}
                type="poster"
            />
            <div className={styles.albumCardOverlay}>
                {isMonitored ? (
                    <Badge variant="filled">{t('action.monitoredInLidarr')}</Badge>
                ) : (
                    <Tooltip label={t('action.addToLidarr')}>
                        <PlayButton
                            icon="plus"
                            loading={isPending}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onAddAlbum(album);
                            }}
                        />
                    </Tooltip>
                )}
            </div>
        </div>
    );
});

const LidarrAlbumSection = memo(function LidarrAlbumSection({
    albums,
    itemsPerRow,
    lidarrAlbumByForeignId,
    onAddAlbum,
    pendingAlbumId,
    releaseType,
    title,
}: LidarrAlbumSectionProps) {
    return (
        <Stack gap="md">
            <div className={styles.albumSectionTitle}>
                <Group gap="md">
                    <TextTitle fw={600} order={4}>
                        {title}
                    </TextTitle>
                    <Badge size="sm" variant="default">
                        {albums.length}
                    </Badge>
                </Group>
                <div className={styles.albumSectionDivider} />
            </div>
            <div
                className={styles.albumGrid}
                style={
                    {
                        '--items-per-row': itemsPerRow,
                    } as React.CSSProperties
                }
            >
                {albums.map((album) => (
                    <LidarrMissingAlbumCard
                        album={album}
                        key={`${releaseType}-${album.id}`}
                        lidarrAlbum={lidarrAlbumByForeignId.get(album.id)}
                        onAddAlbum={onAddAlbum}
                        pendingAlbumId={pendingAlbumId}
                    />
                ))}
            </div>
        </Stack>
    );
});

interface LidarrArtistDiscographyProps {
    artistMbid?: string;
    artistName: string;
    libraryAlbums: Album[];
    order?: number;
}

export const LidarrArtistDiscography = memo(
    ({ artistMbid, artistName, libraryAlbums, order }: LidarrArtistDiscographyProps) => {
        const { t } = useTranslation();
        const enabled = useLidarrEnabled();
        const lidarrConfig = useLidarrConfig();
        const defaults = useLidarrDefaults();
        const addArtistMutation = useAddArtistMutation();
        const monitorAlbumMutation = useMonitorAlbumMutation();

        const shouldUseLidarrLookup = enabled && !artistMbid && artistName.length > 0;

        const artistLookupQuery = useQuery({
            ...lidarrQueries.artistLookup({
                enabled: shouldUseLidarrLookup,
                term: artistName,
            }),
            staleTime: 1000 * 60 * 5,
        });

        const lidarrLookupArtist = useMemo(() => {
            const results = artistLookupQuery.data || [];
            if (results.length === 0) {
                return null;
            }

            const normalizedArtistName = artistName.toLowerCase().trim();
            const exactMatch = results.find(
                (artist) => artist.artistName.toLowerCase().trim() === normalizedArtistName,
            );
            return exactMatch || results[0];
        }, [artistLookupQuery.data, artistName]);

        const effectiveArtistMbid = artistMbid || lidarrLookupArtist?.foreignArtistId || '';

        const artistByMbidQuery = useQuery({
            ...lidarrQueries.artistByMbid({
                enabled: enabled && effectiveArtistMbid.length > 0,
                mbid: effectiveArtistMbid,
            }),
            staleTime: 1000 * 60 * 5,
        });

        const lidarrArtist = artistByMbidQuery.data;
        const lidarrArtistId = lidarrArtist?.id && lidarrArtist.id > 0 ? lidarrArtist.id : null;

        const albumsByArtistQuery = useQuery({
            ...lidarrQueries.albumsByArtist({
                artistId: lidarrArtistId || 0,
                enabled: enabled && Boolean(lidarrArtistId),
            }),
        });

        const lidarrAlbumByForeignId = useMemo(() => {
            return new Map(
                (albumsByArtistQuery.data || []).map((album) => [album.foreignAlbumId, album]),
            );
        }, [albumsByArtistQuery.data]);

        const missingAlbums = useMemo(() => {
            if (!lidarrArtistId) {
                return [];
            }

            const albums = albumsByArtistQuery.data || [];
            return albums
                .map((album) =>
                    normalizeLidarrAlbum(
                        album,
                        lidarrArtist || undefined,
                        lidarrConfig.url,
                        lidarrConfig.apiKey,
                    ),
                )
                .filter((album) => !isLidarrAlbumInLibrary(album, libraryAlbums));
        }, [
            lidarrArtistId,
            albumsByArtistQuery.data,
            lidarrArtist,
            lidarrConfig.apiKey,
            lidarrConfig.url,
            libraryAlbums,
        ]);

        const { releaseTypeEntries } = useArtistAlbumsGrouped(missingAlbums, effectiveArtistMbid);

        const cq = useContainerQuery({
            '2xl': 1280,
            '3xl': 1440,
            lg: 960,
            md: 720,
            sm: 520,
            xl: 1152,
            xs: 360,
        });

        const itemsPerRow = getItemsPerRow(cq);

        const canAddArtist = Boolean(
            effectiveArtistMbid &&
            defaults.rootFolderPath &&
            defaults.qualityProfileId &&
            defaults.metadataProfileId,
        );

        const handleAddArtist = useCallback(() => {
            if (!effectiveArtistMbid) {
                return;
            }

            addArtistMutation.mutate({
                artistMbid: effectiveArtistMbid,
                artistName,
            });
        }, [addArtistMutation, artistName, effectiveArtistMbid]);

        const handleAddAlbum = useCallback(
            (album: Album) => {
                const lidarrAlbum = lidarrAlbumByForeignId.get(album.id);
                if (!lidarrAlbum?.id || !lidarrArtistId) {
                    return;
                }

                monitorAlbumMutation.mutate({
                    albumId: lidarrAlbum.id,
                    artistId: lidarrArtistId,
                });
            },
            [lidarrAlbumByForeignId, lidarrArtistId, monitorAlbumMutation],
        );

        if (!enabled) {
            return null;
        }

        const isLookupLoading = shouldUseLidarrLookup && artistLookupQuery.isLoading;
        const isArtistLoading = effectiveArtistMbid.length > 0 && artistByMbidQuery.isLoading;
        const isAlbumsLoading = Boolean(lidarrArtistId) && albumsByArtistQuery.isLoading;
        const isLoading = isLookupLoading || isArtistLoading || isAlbumsLoading;

        const isLookupError = shouldUseLidarrLookup && artistLookupQuery.isError;
        const isArtistError = effectiveArtistMbid.length > 0 && artistByMbidQuery.isError;
        const isAlbumsError = Boolean(lidarrArtistId) && albumsByArtistQuery.isError;
        const isError = isLookupError || isArtistError || isAlbumsError;

        if (isLoading) {
            return (
                <Grid.Col order={order} span={12}>
                    <Stack gap="md">
                        <Skeleton enableAnimation height="2rem" width="30%" />
                        <Group gap="md">
                            <Skeleton enableAnimation height="180px" width="150px" />
                            <Skeleton enableAnimation height="180px" width="150px" />
                            <Skeleton enableAnimation height="180px" width="150px" />
                        </Group>
                    </Stack>
                </Grid.Col>
            );
        }

        if (isError) {
            return (
                <Grid.Col order={order} span={12}>
                    <Center py="xl">
                        <Text isMuted size="sm">
                            {t('page.albumArtistDetail.lidarrError')}
                        </Text>
                    </Center>
                </Grid.Col>
            );
        }

        if (!effectiveArtistMbid || !lidarrArtistId) {
            return (
                <Grid.Col order={order} span={12}>
                    <Stack align="center" gap="sm" py="xl">
                        <Text isMuted size="sm">
                            {t('page.albumArtistDetail.lidarrNotFound')}
                        </Text>
                        {effectiveArtistMbid && (
                            <Button
                                disabled={!canAddArtist || addArtistMutation.isPending}
                                leftSection={
                                    addArtistMutation.isPending ? (
                                        <Spinner size={16} />
                                    ) : (
                                        <Icon icon="plus" size="sm" />
                                    )
                                }
                                onClick={handleAddArtist}
                                size="compact-sm"
                                variant="subtle"
                            >
                                {t('action.addArtistToLidarr')}
                            </Button>
                        )}
                    </Stack>
                </Grid.Col>
            );
        }

        if (missingAlbums.length === 0) {
            return (
                <Grid.Col order={order} span={12}>
                    <Center py="xl">
                        <Text isMuted size="sm">
                            {t('page.albumArtistDetail.lidarrAllAlbumsInLibrary')}
                        </Text>
                    </Center>
                </Grid.Col>
            );
        }

        return (
            <Grid.Col order={order} span={12}>
                <Stack gap="md">
                    <div className={styles.sectionTitle}>
                        <Group gap="md">
                            <TextTitle fw={700} order={3}>
                                {t('page.albumArtistDetail.lidarrMissingAlbums')}
                            </TextTitle>
                            <Badge variant="default">{missingAlbums.length}</Badge>
                        </Group>
                        <div className={styles.albumSectionDivider} />
                    </div>
                    <div ref={cq.ref}>
                        {cq.isCalculated && (
                            <Stack gap="xl">
                                {releaseTypeEntries.map(({ albums, displayName, releaseType }) => (
                                    <LidarrAlbumSection
                                        albums={albums}
                                        itemsPerRow={itemsPerRow}
                                        key={releaseType}
                                        lidarrAlbumByForeignId={lidarrAlbumByForeignId}
                                        onAddAlbum={handleAddAlbum}
                                        pendingAlbumId={
                                            monitorAlbumMutation.isPending
                                                ? (monitorAlbumMutation.variables?.albumId ?? null)
                                                : null
                                        }
                                        releaseType={releaseType}
                                        title={displayName}
                                    />
                                ))}
                            </Stack>
                        )}
                    </div>
                </Stack>
            </Grid.Col>
        );
    },
);
