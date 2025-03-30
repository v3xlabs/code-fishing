import { User } from "@/api/auth";
import { useSteamInventoryTotal } from "@/api/inventory";
import { useStats } from "@/api/stats";
import { Avatar } from "@/components/auth/Avatar";
import { Tooltip } from "@/components/helpers/Tooltip";
import { Modal } from "@/components/modal/Modal";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { FC, PropsWithChildren, ReactNode } from "react";
import { FaSteam } from "react-icons/fa";
import {
  LuClock,
  LuCalendarDays,
  LuBan,
  LuCheck,
  LuHourglass,
  LuUser,
  LuSword,
  LuCrosshair,
  LuActivity,
  LuDroplet,
  LuMedal,
  LuArmchair,
  LuCoins,
} from "react-icons/lu";

export const PartyMemberPreview: FC<PropsWithChildren<{ member?: User }>> = ({
  member,
  children,
}) => {
  const steam_id = member?.user_id.startsWith("steam:")
    ? member?.user_id.replace("steam:", "")
    : undefined;

  if (!steam_id) {
    return <>{children}</>;
  }

  const { data: stats } = useStats(steam_id);
  const { data: inventory } = useSteamInventoryTotal(steam_id);

  // Calculate account age from the creation date if available
  const calculateAccountAge = () => {
    if (!stats?.overview?.account_created) return "Unknown";

    const creationDate = new Date(stats.overview.account_created);
    const now = new Date();
    const years = now.getFullYear() - creationDate.getFullYear();
    const months = now.getMonth() - creationDate.getMonth();

    if (months < 0) {
      return `${years - 1} years, ${months + 12} months`;
    }
    return `${years} years, ${months} months`;
  };

  // Calculate death percentages
  const calculateDeathPercentages = () => {
    if (!stats?.deaths?.total)
      return { fall: 0, suicide: 0, selfInflicted: 0, other: 0 };

    const total = parseInt(stats.deaths.total.replace(/,/g, ""));
    const fall = parseInt(stats.deaths.fall.replace(/,/g, ""));
    const suicide = parseInt(stats.deaths.suicide.replace(/,/g, ""));
    const selfInflicted = parseInt(
      stats.deaths.self_inflicted.replace(/,/g, "")
    );
    const other = total - fall - suicide - selfInflicted;

    return {
      fall: Math.round((fall / total) * 100),
      suicide: Math.round((suicide / total) * 100),
      selfInflicted: Math.round((selfInflicted / total) * 100),
      other: Math.round((other / total) * 100),
    };
  };

  const deathPercentages = calculateDeathPercentages();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <Modal size="wide">
        <div className="w-full space-y-4">
          {/* Header with avatar and name */}
          <div className="bg-tertiary p-6 flex items-center gap-4 border-b border-neutral-700">
            <Avatar
              src={stats?.avatar_url || member.avatar_url}
              seed={member.user_id}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {stats?.personaname || member.name || "Unknown Player"}
                </h3>
                {!stats?.is_banned && (
                  <Tooltip
                    trigger={
                      <div className="flex items-center text-accent text-sm">
                        <LuCheck size={14} className="mr-1" />
                      </div>
                    }
                  >
                    <div className="text-xs text-secondary">
                      This player currently does not have any bans.
                    </div>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <LuUser size={14} />
                <span>{member.user_id}</span>
              </div>
              {stats?.is_banned && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center text-rust text-sm">
                    <LuBan size={14} className="mr-1" />
                    <span>Banned</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <a
                href={`https://steamcommunity.com/profiles/${member.user_id.replace(
                  "steam:",
                  ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-rust !px-4 !py-2 flex items-center gap-2"
              >
                <FaSteam size={16} />
                <span>View on Steam</span>
              </a>
            </div>
          </div>

          {stats?.is_private ? (
            <>
              <p>
                This user's Steam profile is private, so we can't display
                anything here
              </p>
              <a
                className="text-accent hover:underline"
                href="https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276"
              >
                Learn more
              </a>
            </>
          ) : (
            <div className="space-y-4">
              {/* Overview section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Account Overview
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <StatItem
                        icon={<LuHourglass className="text-accent" />}
                        label="Total Hours"
                        value={stats?.overview?.time_played || "Unknown"}
                      />
                      <StatItem
                        icon={<LuActivity className="text-accent" />}
                        label="Recent (2w)"
                        value={stats?.overview?.played_last_2weeks || "Unknown"}
                      />
                      <StatItem
                        icon={<LuCalendarDays className="text-secondary" />}
                        label="Account Age"
                        value={calculateAccountAge()}
                      />
                      <StatItem
                        icon={<LuMedal className="text-secondary" />}
                        label="Achievements"
                        value={stats?.overview?.achievement_count || "0"}
                      />
                    </div>
                  </div>
                  {inventory && (
                    <div className="card no-padding">
                      <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                        Inventory
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <StatItem
                          icon={<LuCoins className="text-accent" />}
                          label="Total Items"
                          value={inventory.items}
                        />
                        <StatItem
                          icon={<LuCoins className="text-accent" />}
                          label="NET WORTH"
                          value={new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(inventory.market_value / 100)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* PVP Statistics */}
                {stats?.pvp_stats && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      PVP Performance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <img
                              src="https://cdn.rusthelp.com/images/256/rifle-ak.webp"
                              className="w-6 h-6"
                              alt="Accuracy"
                            />
                            <span className="text-xs text-secondary">
                              Accuracy
                            </span>
                          </div>
                          <span className="text-xs text-secondary">
                            {stats.pvp_stats.bullets_hit_percent}
                          </span>
                        </div>
                        <div className="w-full bg-primarybg rounded-full h-2 mb-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{
                              width: `${
                                parseFloat(
                                  stats.pvp_stats.bullets_hit_percent
                                ) || 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-secondary mt-2">
                          <div>Bullets Hit: {stats.pvp_stats.bullets_hit}</div>
                          <div>
                            Bullets Fired: {stats.pvp_stats.bullets_fired}
                          </div>
                        </div>
                      </div>

                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <img
                              src="https://cdn.rusthelp.com/images/256/ammo-rifle-hv.webp"
                              className="w-6 h-6"
                              alt="Headshots"
                            />
                            <span className="text-xs text-secondary">
                              Headshot Ratio
                            </span>
                          </div>
                          <span className="text-xs text-secondary">
                            {stats.pvp_stats.headshot_percent}
                          </span>
                        </div>
                        <div className="w-full bg-primarybg rounded-full h-2 mb-2">
                          <div
                            className="bg-rust h-2 rounded-full"
                            style={{
                              width: `${
                                parseFloat(stats.pvp_stats.headshot_percent) ||
                                0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-secondary mt-2">
                          Headshots: {stats.pvp_stats.headshots}
                        </div>
                      </div>

                      <div className="bg-tertiary rounded p-3">
                        <div className="flex items-center mb-2">
                          <Tooltip
                            trigger={
                              <div className="flex items-center gap-2">
                                <img
                                  src="https://cdn.rusthelp.com/images/256/ammo-rifle.webp"
                                  className="w-8 h-8"
                                  alt="K/D"
                                />
                                <div>
                                  <div className="text-xs text-secondary">
                                    K/D Ratio
                                  </div>
                                  <div className="font-medium text-primary">
                                    {stats.pvp_stats.kdr}
                                  </div>
                                </div>
                              </div>
                            }
                          >
                            <div className="text-xs text-secondary">
                              Kill/Death Ratio: {stats.pvp_stats.kdr}
                              <br />
                              Higher is better!
                            </div>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="bg-tertiary rounded p-3 grid grid-cols-2 gap-2">
                        <Tooltip
                          trigger={
                            <div className="flex items-center gap-2">
                              <img
                                src="https://cdn.rusthelp.com/images/256/skull-human.webp"
                                className="w-6 h-6"
                                alt="Kills"
                              />
                              <div>
                                <div className="text-xs text-secondary">
                                  Kills
                                </div>
                                <div className="text-primary">
                                  {stats.pvp_stats.kills}
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <div className="text-xs text-secondary">
                            Total player kills: {stats.pvp_stats.kills}
                          </div>
                        </Tooltip>

                        <Tooltip
                          trigger={
                            <div className="flex items-center gap-2">
                              <img
                                src="https://cdn.rusthelp.com/images/256/gravestone.webp"
                                className="w-6 h-6"
                                alt="Deaths"
                              />
                              <div>
                                <div className="text-xs text-secondary">
                                  Deaths
                                </div>
                                <div className="text-primary">
                                  {stats.pvp_stats.deaths}
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <div className="text-xs text-secondary">
                            Total deaths: {stats.pvp_stats.deaths}
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kills section */}
                {stats?.kills && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Kills
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <KillStatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/deermeat-cooked.webp"
                            className="w-8 h-8"
                            alt="Deer"
                          />
                        }
                        value={stats.kills.deer || "0"}
                        label="Deer"
                      />
                      <KillStatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/bearmeat-cooked.webp"
                            className="w-8 h-8"
                            alt="Bear"
                          />
                        }
                        value={stats.kills.bears || "0"}
                        label="Bears"
                      />
                      <KillStatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/meat-pork-cooked.webp"
                            className="w-8 h-8"
                            alt="Boar"
                          />
                        }
                        value={stats.kills.boars || "0"}
                        label="Boars"
                      />
                      <KillStatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/wolfmeat-cooked.webp"
                            className="w-8 h-8"
                            alt="Wolf"
                          />
                        }
                        value={stats.kills.wolves || "0"}
                        label="Wolves"
                      />
                      <KillStatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/chicken-cooked.webp"
                            className="w-8 h-8"
                            alt="Chicken"
                          />
                        }
                        value={stats.kills.chickens || "0"}
                        label="Chickens"
                      />
                      <KillStatItem
                        icon={<LuCrosshair className="w-8 h-8 text-rust" />}
                        value={stats.kills.players || "0"}
                        label="Players"
                      />
                    </div>
                  </div>
                )}

                {/* Death statistics */}
                {stats?.deaths && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Deaths
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-secondary">Fall</span>
                          <span className="text-xs text-secondary">
                            {deathPercentages.fall}%
                          </span>
                        </div>
                        <div className="w-full bg-primarybg rounded-full h-2 mb-1">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${deathPercentages.fall}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-secondary text-center">
                          ({stats.deaths.fall})
                        </div>
                      </div>
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-secondary">
                            Suicide
                          </span>
                          <span className="text-xs text-secondary">
                            {deathPercentages.suicide}%
                          </span>
                        </div>
                        <div className="w-full bg-primarybg rounded-full h-2 mb-1">
                          <div
                            className="bg-rust h-2 rounded-full"
                            style={{ width: `${deathPercentages.suicide}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-secondary text-center">
                          ({stats.deaths.suicide})
                        </div>
                      </div>
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-secondary">
                            Self Inflicted
                          </span>
                          <span className="text-xs text-secondary">
                            {deathPercentages.selfInflicted}%
                          </span>
                        </div>
                        <div className="w-full bg-primarybg rounded-full h-2 mb-1">
                          <div
                            className="bg-rust-active h-2 rounded-full"
                            style={{
                              width: `${deathPercentages.selfInflicted}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-secondary text-center">
                          ({stats.deaths.self_inflicted})
                        </div>
                      </div>
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-secondary">Other</span>
                          <span className="text-xs text-secondary">
                            {deathPercentages.other}%
                          </span>
                        </div>
                        <div className="w-full bg-primarybg rounded-full h-2 mb-1">
                          <div
                            className="bg-secondarybg h-2 rounded-full"
                            style={{ width: `${deathPercentages.other}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-secondary text-center">
                          (
                          {parseInt(stats.deaths.total.replace(/,/g, "")) -
                            parseInt(stats.deaths.fall.replace(/,/g, "")) -
                            parseInt(stats.deaths.suicide.replace(/,/g, "")) -
                            parseInt(
                              stats.deaths.self_inflicted.replace(/,/g, "")
                            )}
                          )
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Melee statistics */}
                {stats?.melee && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Melee
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/spear-wooden.webp"
                            className="w-8 h-8"
                            alt="Throws"
                          />
                        }
                        label="Throws"
                        value={stats.melee.throws || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/knife-bone.webp"
                            className="w-8 h-8"
                            alt="Strikes"
                          />
                        }
                        label="Strikes"
                        value={stats.melee.strikes || "0"}
                      />
                    </div>
                  </div>
                )}

                {/* Bow hits statistics */}
                {stats?.bow_hits && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Bow Accuracy
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-secondary text-sm">
                            Overall
                          </span>
                          <span className="text-primary text-sm font-semibold">
                            {stats.bow_hits.rate || "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-secondary mt-1">
                          <span>
                            Shots: {stats.bow_hits.shots_fired || "0"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-secondary text-sm">
                            Players
                          </span>
                          <span className="text-primary text-sm font-semibold">
                            {stats.bow_hits.players || "0"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-secondary text-sm">
                            Buildings
                          </span>
                          <span className="text-primary text-sm font-semibold">
                            {stats.bow_hits.buildings || "0"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-tertiary rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-secondary text-sm">
                            Animals
                          </span>
                          <span className="text-primary text-sm font-semibold">
                            {parseInt(stats.bow_hits.deer || "0") +
                              parseInt(stats.bow_hits.bears || "0") +
                              parseInt(stats.bow_hits.boars || "0") +
                              parseInt(stats.bow_hits.chicken || "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Other stats */}
                {stats?.other && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Other Activities
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/research-table.webp"
                            className="w-8 h-8"
                            alt="BPs"
                          />
                        }
                        label="BPs Learned"
                        value={stats.other.bps_learned || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/modular-car.webp"
                            className="w-8 h-8"
                            alt="Cars"
                          />
                        }
                        label="Cars Shredded"
                        value={stats.other.cars_shredded || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/ammo-rocket-basic.webp"
                            className="w-8 h-8"
                            alt="Rockets"
                          />
                        }
                        label="Rockets Fired"
                        value={stats.other.rockets_fired || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/megaphone.webp"
                            className="w-8 h-8"
                            alt="Voice"
                          />
                        }
                        label="Voice Chat"
                        value={stats.other.voicechat_time || "0"}
                      />
                    </div>
                  </div>
                )}

                {/* Exposure statistics */}
                {stats?.exposure && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Environmental Exposure
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/snowball.webp"
                            className="w-8 h-8"
                            alt="Cold"
                          />
                        }
                        label="Cold Exposure"
                        value={stats.exposure.cold || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/cactusflesh.webp"
                            className="w-8 h-8"
                            alt="Heat"
                          />
                        }
                        label="Heat Exposure"
                        value={stats.exposure.heat || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/hazmatsuit.webp"
                            className="w-8 h-8"
                            alt="Radiation"
                          />
                        }
                        label="Radiation"
                        value={stats.exposure.radiation || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/sofa.webp"
                            className="w-8 h-8"
                            alt="Comfort"
                          />
                        }
                        label="Comfort Time"
                        value={stats.exposure.comfort || "0"}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gathered resources */}
                {stats?.gathered && (
                  <div className="card no-padding">
                    <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                      Resources Gathered
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/wood.webp"
                            className="w-8 h-8"
                            alt="Wood"
                          />
                        }
                        label="Wood"
                        value={stats.gathered.wood || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/stones.webp"
                            className="w-8 h-8"
                            alt="Stone"
                          />
                        }
                        label="Stone"
                        value={stats.gathered.stone || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/metal-ore.webp"
                            className="w-8 h-8"
                            alt="Metal"
                          />
                        }
                        label="Metal Ore"
                        value={stats.gathered.metal_ore || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/cloth.webp"
                            className="w-8 h-8"
                            alt="Cloth"
                          />
                        }
                        label="Cloth"
                        value={stats.gathered.cloth || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/leather.webp"
                            className="w-8 h-8"
                            alt="Leather"
                          />
                        }
                        label="Leather"
                        value={stats.gathered.leather || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/lowgradefuel.webp"
                            className="w-8 h-8"
                            alt="Low Grade"
                          />
                        }
                        label="Low Grade"
                        value={stats.gathered.low_grade_fuel || "0"}
                      />
                      <StatItem
                        icon={
                          <img
                            src="https://cdn.rusthelp.com/images/256/scrap.webp"
                            className="w-8 h-8"
                            alt="Scrap"
                          />
                        }
                        label="Scrap"
                        value={stats.gathered.scrap || "0"}
                      />
                    </div>
                  </div>
                )}

                {/* Building and travel */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Building blocks */}
                  {stats?.building_blocks && (
                    <div className="card no-padding">
                      <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                        Building
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <StatItem
                          icon={
                            <img
                              src="https://cdn.rusthelp.com/images/256/building-planner.webp"
                              className="w-8 h-8"
                              alt="Placed"
                            />
                          }
                          label="Blocks Placed"
                          value={stats.building_blocks.placed || "0"}
                        />
                        <StatItem
                          icon={
                            <img
                              src="https://cdn.rusthelp.com/images/256/hammer.webp"
                              className="w-8 h-8"
                              alt="Upgraded"
                            />
                          }
                          label="Blocks Upgraded"
                          value={stats.building_blocks.upgraded || "0"}
                        />
                      </div>
                    </div>
                  )}

                  {/* Horse distance */}
                  {stats?.horse_distance_ridden && (
                    <div className="card no-padding">
                      <h4 className="text-secondary uppercase text-xs font-semibold tracking-wider mb-3">
                        Travel
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <StatItem
                          icon={
                            <img
                              src="https://cdn.rusthelp.com/images/256/horse-armor-roadsign.webp"
                              className="w-8 h-8"
                              alt="Distance (mi)"
                            />
                          }
                          label="Horse Distance (mi)"
                          value={stats.horse_distance_ridden.miles || "0"}
                        />
                        <StatItem
                          icon={
                            <img
                              src="https://cdn.rusthelp.com/images/256/horse-saddle-single.webp"
                              className="w-8 h-8"
                              alt="Distance (km)"
                            />
                          }
                          label="Horse Distance (km)"
                          value={stats.horse_distance_ridden.kilometers || "0"}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Dialog>
  );
};

// Helper component for info items
const StatItem: FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <div className="flex items-center space-x-3 bg-tertiary rounded-lg p-3">
    <div className="text-primary">{icon}</div>
    <div>
      <div className="text-xs text-secondary">{label}</div>
      <div className="font-medium text-primary">{value}</div>
    </div>
  </div>
);

// Helper component for kill items with tooltips
const KillStatItem: FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <Tooltip
    trigger={
      <div className="flex flex-col items-center justify-center bg-tertiary rounded-lg p-3 text-center">
        <div className="text-primary mb-2">{icon}</div>
        <div className="font-semibold text-lg text-primary">{value}</div>
        <div className="text-xs text-secondary">{label}</div>
      </div>
    }
  >
    <div className="text-xs text-secondary">
      {label} Killed: {value}
    </div>
  </Tooltip>
);

// Helper component for stat value display
const StatValue: FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="text-center">
    <div className="text-xs text-secondary">{label}</div>
    <div className="font-medium text-primary">{value}</div>
  </div>
);
