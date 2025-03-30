import { useBattleMetricsRecentServers } from '@/api/bm';
import { FC } from 'react';
import { LuClock, LuGlobe, LuGlobeLock, LuMapPin, LuUser } from 'react-icons/lu';
import { Tooltip } from '../helpers/Tooltip';
import { parseISO, formatDistanceToNow } from 'date-fns';

// Add this helper function
const formatTimePlayed = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours}h${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return '< 1m'; // For times less than a minute
    }
};

export const SteamRecentServers: FC = () => {
    const { data: servers } = useBattleMetricsRecentServers();

    if (!servers) {
        return null;
    }

    return (
        <div className="card flex flex-col gap-2 col-span-full w-full">
            <h3>Recent Servers</h3>
            <div className="flex flex-wrap gap-2">
                {servers.servers.slice(0, 4).map((server) => (
                    <div
                        key={server.bm_id}
                        className="flex gap-0 p-1 flex-col bg-[#1C221B] w-full md:max-w-[calc(50%-0.4rem)] xl:max-w-[calc(25%-0.4rem)]"
                    >
                        {server.header_url && (
                            <Tooltip
                                trigger={
                                    <button className="relative w-full aspect-[2/1] overflow-hidden">
                                        <img
                                            src={server.header_url}
                                            alt={server.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                                    </button>
                                }
                                side="right"
                            >
                                <div className="space-y-4 max-w-md">
                                    <div className="text-primary font-bold text-roboto">
                                        {server.name}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-sm text-roboto">
                                        <div className="flex items-center gap-1">
                                            <LuUser className="text-primary" />
                                            <span>{server.players} Players</span>
                                            <span
                                                className={`pl-2 px-1.5 py-0.5 rounded text-xs ${server.status === 'online' ? 'bg-green-700' : 'bg-red-700'}`}
                                            >
                                                {server.status === 'online' ? 'Online' : 'Offline'}
                                            </span>
                                        </div>

                                        {server.time_played && (
                                            <div className="flex items-center gap-1">
                                                <LuClock className="text-primary" />
                                                <span>
                                                    Played: {formatTimePlayed(server.time_played)}
                                                </span>
                                            </div>
                                        )}

                                        {server.last_seen && (
                                            <div className="flex items-center gap-1">
                                                <LuGlobe className="text-primary" />
                                                <span>
                                                    Last visit:{' '}
                                                    {formatDistanceToNow(
                                                        parseISO(server.last_seen),
                                                        {
                                                            addSuffix: true,
                                                        }
                                                    ).replace(/^about /, '')}
                                                </span>
                                            </div>
                                        )}

                                        {server.first_seen && (
                                            <div className="flex items-center gap-1">
                                                <LuMapPin className="text-primary" />
                                                <span>
                                                    First visit:{' '}
                                                    {formatDistanceToNow(
                                                        parseISO(server.first_seen),
                                                        {
                                                            addSuffix: true,
                                                        }
                                                    ).replace(/^about /, '')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {server.map_name && (
                                        <div className="flex flex-col gap-1 text-sm text-roboto">
                                            <span className="font-semibold">Map:</span>
                                            <span className="text-gray-300">{server.map_name}</span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {server.is_official && (
                                            <span className="px-2 py-1 bg-blue-700 rounded">
                                                Official
                                            </span>
                                        )}
                                        {server.rust_type && (
                                            <span className="px-2 py-1 bg-orange-700 rounded capitalize">
                                                {server.rust_type}
                                            </span>
                                        )}
                                        {server.gamemode && (
                                            <span className="px-2 py-1 bg-purple-700 rounded capitalize">
                                                {server.gamemode}
                                            </span>
                                        )}
                                    </div>

                                    {server.url && (
                                        <div className="text-sm text-roboto">
                                            <a
                                                href={server.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:underline"
                                            >
                                                {server.url}
                                            </a>
                                        </div>
                                    )}

                                    {server.description && (
                                        <div className="text-roboto border-t border-gray-700 pt-2 mt-2">
                                            <p className="text-sm whitespace-pre-line">
                                                {server.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                        )}
                        <div className="text-start text-roboto px-1 z-10 overflow-ellipsis overflow-hidden w-full whitespace-nowrap">
                            {server.name}
                        </div>
                        <div className="flex gap-1 items-center text-roboto flex-wrap px-2">
                            <div className="flex gap-1 items-center">
                                <LuUser />
                                {server.players}
                            </div>
                            {server.styled_ip && (
                                <Tooltip
                                    trigger={
                                        <div className="flex gap-1 items-center">
                                            <LuGlobeLock />
                                            {server.styled_ip}
                                        </div>
                                    }
                                >
                                    <div className="text-roboto">
                                        <p>The server address is stylized to be</p>
                                        <p className="font-bold">{server.styled_ip}</p>
                                    </div>
                                </Tooltip>
                            )}
                            {server.time_played && (
                                <div className="flex gap-1 items-center">
                                    <LuClock />
                                    {formatTimePlayed(server.time_played)}
                                </div>
                            )}
                        </div>
                        {server.last_seen && (
                            <div className="text-roboto text-secondary text-end pb-1 px-1">
                                Last online{' '}
                                {formatDistanceToNow(parseISO(server.last_seen), {
                                    addSuffix: true,
                                }).replace(/^about /, '')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
