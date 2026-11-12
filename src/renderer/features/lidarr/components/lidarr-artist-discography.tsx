import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './lidarr-artist-discography.module.css';

import {
    isLidarrAlbumInLibrary,
    normalizeLidarrAlbum,
} from '/@/renderer/api/lidarr/lidarr-normalize';
import { MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { useArtistAlbumsGrouped } from '/@/renderer/features/artists/hooks/use-artist-albums-grouped';
import { lidarrQueries } from '/@/renderer/features/lidarr/api/lidarr-queries';
import { useLidarrEnabled } from '/@/renderer/features/lidarr/store/lidarr.store';
import { useContainerQuery } from '/@/renderer/hooks';
import { Badge } from '/@/shared/components/badge/badge';
import { Center } from '/@/shared/components/center/center';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { Album, LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface LidarrAlbumSectionProps {
    albums: Album[];
    itemsPerRow: number;
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

const LidarrAlbumSection = memo(function LidarrAlbumSection({
    albums,
    itemsPerRow,
    releaseType,
    title,
}: LidarrAlbumSectionProps) {
    const rows = useGridRows(LibraryItem.ALBUM, ItemListKey.ALBUM);

    return (
        <Stack gap="md">
            <div className={styles.albumSectionTitle}>
                <Group gap="md">
                    <TextTitle fw={700} order={3}>
                        {title}
                    </TextTitle>
                    <Badge variant="default">{albums.length}</Badge>
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
                    <div className={styles.albumGridItem} key={`${releaseType}-${album.id}`}>
                        <MemoizedItemCard
                            data={album}
                            enableDrag={false}
                            enableExpansion
                            enableNavigation={false}
                            itemType={LibraryItem.ALBUM}
                            rows={rows}
                            type="poster"
                        />
                    </div>
                ))}
            </div>
        </Stack>
    );
});

interface LidarrArtistDiscographyProps {
    artistName: string;
    libraryAlbums: Album[];
}

export const LidarrArtistDiscography = memo(
    ({ artistName, libraryAlbums }: LidarrArtistDiscographyProps) => {
        const { t } = useTranslation();
        const enabled = useLidarrEnabled();

        const artistLookupQuery = useQuery({
            ...lidarrQueries.artistLookup({
                enabled,
                term: artistName,
            }),
            staleTime: 1000 * 60 * 5,
        });

        const lidarrArtist = useMemo(() => {
            const results = artistLookupQuery.data || [];
            if (results.length === 0) {
                return null;
            }

            // Prefer an exact name match, otherwise use the first result.
            const normalizedArtistName = artistName.toLowerCase().trim();
            const exactMatch = results.find(
                (artist) => artist.artistName.toLowerCase().trim() === normalizedArtistName,
            );
            return exactMatch || results[0];
        }, [artistLookupQuery.data, artistName]);

        const missingAlbums = useMemo(() => {
            if (!lidarrArtist?.albums) {
                return [];
            }

            return lidarrArtist.albums
                .map((album) => normalizeLidarrAlbum(album, lidarrArtist))
                .filter((album) => !isLidarrAlbumInLibrary(album, libraryAlbums));
        }, [lidarrArtist, libraryAlbums]);

        const { releaseTypeEntries } = useArtistAlbumsGrouped(
            missingAlbums,
            lidarrArtist?.foreignArtistId || '',
        );

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

        if (!enabled) {
            return null;
        }

        if (artistLookupQuery.isLoading) {
            return (
                <Grid.Col span={12}>
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

        if (artistLookupQuery.isError) {
            return (
                <Grid.Col span={12}>
                    <Center py="xl">
                        <Text isMuted size="sm">
                            {t('page.albumArtistDetail.lidarrError')}
                        </Text>
                    </Center>
                </Grid.Col>
            );
        }

        if (!lidarrArtist) {
            return (
                <Grid.Col span={12}>
                    <Center py="xl">
                        <Text isMuted size="sm">
                            {t('page.albumArtistDetail.lidarrNotFound')}
                        </Text>
                    </Center>
                </Grid.Col>
            );
        }

        if (missingAlbums.length === 0) {
            return (
                <Grid.Col span={12}>
                    <Center py="xl">
                        <Text isMuted size="sm">
                            {t('page.albumArtistDetail.lidarrAllAlbumsInLibrary')}
                        </Text>
                    </Center>
                </Grid.Col>
            );
        }

        return (
            <Grid.Col span={12}>
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
                    {cq.isCalculated && (
                        <Stack gap="xl">
                            {releaseTypeEntries.map(({ albums, displayName, releaseType }) => (
                                <LidarrAlbumSection
                                    albums={albums}
                                    itemsPerRow={itemsPerRow}
                                    key={releaseType}
                                    releaseType={releaseType}
                                    title={displayName}
                                />
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Grid.Col>
        );
    },
);
