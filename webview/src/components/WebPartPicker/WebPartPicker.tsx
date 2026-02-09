import React, { useState, useEffect, FC, useMemo } from 'react';
import { SearchBox, Text, Stack, Icon, css } from '@fluentui/react';
import type { IWebPartManifest } from '../../types';
import styles from './WebPartPicker.module.css';
import { getLocalizedString } from '../PropertyPanePanel/shared/utils';

interface IWebPartPickerProps {
    insertIndex: number;
    manifests: IWebPartManifest[];
    isOpen: boolean;
    onSelect: (insertIndex: number, manifestIndex: number) => void;
    locale?: string;
}

export const WebPartPicker: FC<IWebPartPickerProps> = ({
    insertIndex,
    manifests,
    isOpen,
    onSelect,
    locale
}) => {
    const [filter, setFilter] = useState('');

    // Reset filter when picker closes
    useEffect(() => {
        if (!isOpen) {
            setFilter('');
        }
    }, [isOpen]);


    const webParts = useMemo(() => {
        return manifests.filter(m => m.componentType === 'WebPart').map((wp, index) => {
            const title = getLocalizedString(wp.preconfiguredEntries?.[0]?.title, locale) || wp.alias;
            const description = getLocalizedString(wp.preconfiguredEntries?.[0]?.description, locale) || '';
            return { ...wp, title, description, manifestIndex:index };
        });
    }, [manifests, locale]);

    const filteredWebParts = webParts.filter(wp => {
        if (!filter) return true;
        return wp.title.toLowerCase().includes(filter.toLowerCase()) || wp.description.toLowerCase().includes(filter.toLowerCase());
    });

    return (
        <div className={css(styles.popup, isOpen && styles.open)} id={`wppicker-${insertIndex}`}>
            <Stack>
                <SearchBox
                    placeholder="Search"
                    className={styles.search}
                    value={filter}
                    onChange={(_, newValue) => setFilter(newValue || '')}
                    autoFocus={isOpen}
                />
                <Text variant="medium" className={styles.resultsLabel}>
                    Available web parts
                </Text>
                <div className={styles.results} id={`picker-results-${insertIndex}`}>
                    {filteredWebParts.length > 0 ? (
                        filteredWebParts.map((wp) => {
                            const iconName = wp.preconfiguredEntries?.[0]?.officeFabricIconFontName;
                            const iconSrc = wp.preconfiguredEntries?.[0]?.iconImageUrl;
                            return (
                                <div
                                    key={wp.id}
                                    className={styles.item}
                                    data-insert={insertIndex}
                                    data-manifest={wp.manifestIndex}
                                    onClick={() => onSelect(insertIndex, wp.manifestIndex)}
                                >
                                    {iconName && (
                                        <Icon iconName={iconName} className={styles.itemIcon} />
                                    )}
                                    {!iconName && iconSrc && (
                                        <img src={iconSrc} alt="" className={styles.itemIcon} />
                                    )}
                                    <Text className={styles.itemText}>{wp.title}</Text>
                                </div>
                            );
                        })
                    ) : (
                        <Stack horizontalAlign="center" styles={{ root: { padding: '12px' } }}>
                            <Text styles={{ root: { color: '#605e5c' } }}>
                                No web parts found
                            </Text>
                        </Stack>
                    )}
                </div>
            </Stack>
        </div>
    );
};
