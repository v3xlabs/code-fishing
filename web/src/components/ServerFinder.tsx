// search menu that lets you search through servers
import { useState } from "react";
import { ServerResult, useMap, useServerSearch } from "../api/maps";

export const ServerFinder = () => {
    const [input, setInput] = useState('');
    const { data, isLoading, error } = useServerSearch(input);

    return (
        <div>
            <input type="text" placeholder="Server Name" value={input} onChange={(e) => setInput(e.target.value)} />
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
        <li key={server.name} className="bg-secondary p-4 rounded-md">
            {map && (
                <div className="w-32 h-32">
                    <img src={map.data.thumbnail_url} className="aspect-square max-h-48 object-cover" />
                </div>
            )}
            <h3 className="font-bold">{server.name}</h3>
            <p>{server.map_id}</p>
            <p>{server.ip}</p>
            <p>{server.game_port}</p>
            <p>{server.last_wipe_utc}</p>
            {/* <img src={`https://content.rustmaps.com/maps/256/${server.map_id}/thumbnail.webp`} className="w-full h-48 object-cover" /> */}
        </li>
    )
}