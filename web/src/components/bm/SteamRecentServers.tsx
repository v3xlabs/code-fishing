import { useBattleMetricsRecentServers } from "@/api/bm";
import { FC } from "react";
import { LuUser } from "react-icons/lu";

export const SteamRecentServers: FC = () => {
    const { data: servers } = useBattleMetricsRecentServers();

    if (!servers) {
        return null;
    }

    return (
        <div className="card flex flex-col gap-2">
            <h3>Recent Servers</h3>
            <div className="flex flex-col gap-2">
                {servers.servers.slice(0, 3).map((server) => (
                    <div key={server.bm_id} className="flex gap-2 p-1 flex-col bg-[#1C221B]">
                        {
                            server.header_url && (
                                <div className="relative w-full aspect-[2/1] overflow-hidden">
                                    <img src={server.header_url} alt={server.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                                </div>
                            )
                        }
                        <div className="text-center text-roboto -mt-4 px-1 z-10">
                            {server.name}
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="flex gap-1 items-center">
                                <LuUser />
                                {server.players}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
