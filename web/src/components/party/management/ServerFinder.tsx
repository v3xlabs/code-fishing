// search menu that lets you search through servers
import 'leaflet/dist/leaflet.css';

import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { formatDistanceToNow } from 'date-fns';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { AttributionControl, MapContainer, Marker, Tooltip } from 'react-leaflet';

import { ServerResult, useMap, useServerSearch } from '@/api/maps';
import { usePartySettings } from '@/api/party';
import { Modal } from '@/components/modal/Modal';

// Component to fix Leaflet's default icon issue in React
const LeafletIconFix = () => {
    useEffect(() => {
        // Fix for Leaflet's default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    return null;
};

export const ServerFinder = ({ partyId }: { partyId: string }) => {
    const [input, setInput] = useState('');
    const { data } = useServerSearch(input);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Server Name"
                    className="input w-full"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button className="button" onClick={() => setInput('')}>
                    CLEAR
                </button>
            </div>
            <ul className="flex flex-col gap-4">
                {data?.data.map((server) => (
                    <ServerPreview key={server.name} server={server} partyId={partyId} />
                ))}
                {input.trim().length == 0 && (
                    <div className="flex flex-col gap-2 text-center">
                        <p>Type the server name</p>
                        <p className="text-secondary">or connect steam to find a server</p>
                    </div>
                )}
            </ul>
        </div>
    );
};

const tileMapIconOverride = {
    Three_Wall_Rock: 'https://cdn.rusthelp.com/images/thumbnails/rock.webp',
    Medium_God_Rock: 'https://cdn.rusthelp.com/images/thumbnails/rock.webp',
    Tiny_God_Rock: 'https://cdn.rusthelp.com/images/thumbnails/rock.webp',
    Ice_Lake_3: 'https://cdn.rusthelp.com/images/thumbnails/rock.webp',
    Ice_Lake_4: 'https://cdn.rusthelp.com/images/thumbnails/rock.webp',
};

export const ServerMapModel = ({
    server,
    children,
    partyId,
}: {
    server: ServerResult;
    children: React.ReactNode;
    partyId: string;
}) => {
    const mapRef = useRef<L.Map | null>(null);

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <Modal size="large">
                <h3 className="font-bold text-lg">{server.name}</h3>
                <div className="flex gap-2 text-sm">
                    <p>Map ID {server.map_id}</p>
                    <p>•</p>
                    <p>
                        Server: {server.ip}:{server.game_port}
                    </p>
                    <p>•</p>
                    <p>Wiped {formatDistanceToNow(new Date(server.last_wipe_utc))} ago</p>
                </div>
                <ServerMapModelInner mapId={server.map_id} partyId={partyId} mapRef={mapRef} />
                <ServerSelectButton
                    server={server}
                    partyId={partyId}
                    mapRef={mapRef as React.RefObject<L.Map>}
                />
            </Modal>
        </Dialog>
    );
};

export const ServerMapModelInner = ({
    mapId,
    partyId,
    mapRef,
    frozen = false,
}: {
    mapId: string;
    partyId: string;
    mapRef: React.RefObject<L.Map | null>;
    frozen?: boolean;
}) => {
    const { data: map } = useMap(mapId);
    const { data: partySettings } = usePartySettings(partyId);

    // Handle map initialization and manually create our TileLayer
    const handleMapCreated = (mapInstance: L.Map) => {
        mapRef.current = mapInstance;

        // Set background color for the map
        mapInstance.getContainer().style.backgroundColor = '#0B3B4B';

        // Only proceed if we have the map data
        if (!map?.data?.extra?.tileBaseUrl) return;

        // Remove any existing layers
        mapInstance.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                mapInstance.removeLayer(layer);
            }
        });

        // Create a custom TileLayer with proper URL handling for all zoom levels
        const tileLayer = L.tileLayer(map.data.extra.tileBaseUrl, {
            noWrap: true,
            minZoom: -4,
            maxZoom: 4,
            maxNativeZoom: 0,
            tileSize: 256,
            errorTileUrl:
                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            keepBuffer: 10,
            updateWhenZooming: false,
            updateWhenIdle: false,
            attribution: 'Map from RustMaps.com',
        });

        tileLayer.addTo(mapInstance);
    };

    useEffect(() => {
        if (mapRef.current && partySettings?.location) {
            const { lng, lat } = partySettings.location;

            mapRef.current.setView([lat, lng], 0);
        }
    }, [partySettings]);

    return (
        <div className="flex flex-col gap-4">
            {map && map.data && map.data.extra?.tileBaseUrl && (
                <div className="w-full h-[600px] relative rounded-md overflow-hidden border border-accent bg-[#0B3B4B]">
                    <LeafletIconFix />
                    <MapContainer
                        center={[0, 0]}
                        zoom={0}
                        zoomDelta={0.25}
                        style={{ height: '100%', width: '100%' }}
                        crs={L.CRS.Simple}
                        minZoom={-3}
                        maxZoom={3}
                        zoomControl={!frozen}
                        inertia={false}
                        zoomAnimation={true}
                        bounceAtZoomLimits={true}
                        attributionControl={false}
                        dragging={!frozen}
                        touchZoom={!frozen}
                        doubleClickZoom={!frozen}
                        boxZoom={!frozen}
                        keyboard={false}
                        scrollWheelZoom={!frozen}
                        ref={(mapInstance: L.Map | null) => {
                            if (mapInstance) {
                                handleMapCreated(mapInstance);
                            }
                        }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-16 h-16 bg-[url('/crosshair.svg')] bg-contain bg-center bg-no-repeat" />
                        {/* We'll create the TileLayer manually in the handleMapCreated function */}
                        {/* Add monuments as markers */}
                        {map.data.monuments &&
                            map.data.monuments.map((monument, index) => {
                                // Convert monument coordinates to match the map scale
                                const { x } = monument.coordinates;
                                const y = -monument.coordinates.y; // Negate y as Leaflet's y axis is inverted

                                // Create custom icon using monument.iconPath
                                const customIcon = monument.iconPath
                                    ? L.icon({
                                          iconUrl:
                                              tileMapIconOverride[
                                                  monument.iconPath as keyof typeof tileMapIconOverride
                                              ] ||
                                              `https://content.rustmaps.com/assets/${monument.iconPath}.svg`,
                                          iconSize: [32, 32],
                                          iconAnchor: [16, 16],
                                          popupAnchor: [0, -16],
                                      })
                                    : undefined;

                                return (
                                    <Marker
                                        key={`${monument.type}-${index}`}
                                        position={[-y, x]}
                                        icon={customIcon}
                                    >
                                        <Tooltip>
                                            {'nameOverride' in monument &&
                                            typeof monument.nameOverride === 'string'
                                                ? monument.nameOverride
                                                : monument.type}
                                        </Tooltip>
                                    </Marker>
                                );
                            })}
                        <AttributionControl prefix="Code Fishing" position="bottomright" />
                    </MapContainer>
                </div>
            )}
        </div>
    );
};

export const ServerSelectButton = ({
    server,
    partyId,
    mapRef,
}: {
    server: ServerResult;
    partyId: string;
    mapRef: React.RefObject<L.Map>;
}) => {
    const partySettings = usePartySettings(partyId);

    const handler = () => {
        partySettings.update('location', {
            map_id: server.map_id,
            lng: mapRef.current.getCenter().lng || 0,
            lat: mapRef.current.getCenter().lat || 0,
        });
    };

    return (
        <button className="bg-rust p-8 text-white rounded-lg" onClick={handler}>
            Select
        </button>
    );
};

export const ServerPreview = ({ server, partyId }: { server: ServerResult; partyId: string }) => {
    const { data: map } = useMap(server.map_id);

    return (
        <li key={server.name} className="flex flex-col gap-2">
            <ServerMapModel server={server} partyId={partyId}>
                <button className="bg-secondary p-4 rounded-md flex gap-4 items-center text-start font-mono hover:bg-primary hover:text-tertiary transition-colors">
                    <div className="w-32 h-32 border border-accent rounded-sm">
                        {map && (
                            <img
                                src={map.data.thumbnail_url}
                                className="aspect-square max-h-48 object-cover"
                            />
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-bold">{server.name}</h3>
                        <p className="text-secondary">{server.map_id}</p>
                        <p>
                            {server.ip}:{server.game_port}
                        </p>
                        <p>Wiped {formatDistanceToNow(new Date(server.last_wipe_utc))} ago</p>
                    </div>
                </button>
            </ServerMapModel>
        </li>
    );
};
