// search menu that lets you search through servers
import { useState } from "react";
import { ServerResult, useMap, useServerSearch } from "@/api/maps";
import { formatDistanceToNow } from 'date-fns';

export const ServerFinder = () => {
    const [input, setInput] = useState('');
    const { data, isLoading, error } = useServerSearch(input);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <input type="text" placeholder="Server Name" className="input w-full" value={input} onChange={(e) => setInput(e.target.value)} />
                <button className="button" onClick={() => setInput('')}>CLEAR</button>
            </div>
            <ul className="flex flex-col gap-4">
                {data?.data.map((server) => (
                    <ServerPreview key={server.name} server={server} />
                ))}
            </ul>
        </div>
    )
}

export const ServerPreview = ({ server }: { server: ServerResult }) => {
    const { data: map } = useMap(server.map_id);

    return (
        <li key={server.name} className="bg-secondary p-4 rounded-md flex gap-4 items-center font-mono hover:bg-primary hover:text-tertiary transition-colors">
            <div className="w-32 h-32 border border-accent rounded-sm">
                {map && (
                    <img src={map.data.thumbnail_url} className="aspect-square max-h-48 object-cover" />
                )}
            </div>
            <div className="flex flex-col gap-1">
                <h3 className="font-bold">{server.name}</h3>
                <p className="text-secondary">{server.map_id}</p>
                <p>{server.ip}:{server.game_port}</p>
                <p>Wiped {formatDistanceToNow(new Date(server.last_wipe_utc))} ago</p>
            </div>
            {/* <img src={`https://content.rustmaps.com/maps/256/${server.map_id}/thumbnail.webp`} className="w-full h-48 object-cover" /> */}
        </li>
    )
}
