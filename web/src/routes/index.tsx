// import { CodeListOrder } from '@/components/CodeListOrder'
// import { PartyProgress } from '@/components/PartyProgress'
// import { ServerFinder } from '@/components/ServerFinder'
import { useUser } from '@/api/auth'
import { usePartyCreate } from '@/api/party'
import { SteamRecentServers } from '@/components/bm/SteamRecentServers'
import { useApp } from '@/hooks/context'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LuGithub, LuHeart } from 'react-icons/lu'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="mx-auto w-full max-w-4xl pt-8 px-2 space-y-4">
    <div className="flex flex-wrap gap-4">
      <div className="card flex-1 flex flex-col gap-1 h-fit">
        <h1 className="">Let&apos;s fish some base codes!</h1>
        <p className="text-secondary">Code raiding is the age-old process of endlessly trying codes on your enemies base until you find one that works.</p>
        <h2 className="text-accent pt-4">How-to Code Raid:</h2>
        <p className="text-secondary">
          Code raiding generally involves three steps:
        </p>
        <ul>
          <li>
            - Place bags
          </li>
          <li>
            - Try codes
          </li>
          <li>
            - Profit
          </li>
        </ul>
        <h2 className="text-accent pt-4">Let&apos;s go!</h2>
        <p className="text-secondary">Use this site to coordinate with ur group. And profit efficiently.</p>
      </div>
      <div className="flex h-fit gap-4 flex-col w-full sm:max-w-sm">
        <div className="card flex-1 flex flex-col gap-1">
          <h2>Create a party</h2>
          <p className="text-secondary">Start a code raid</p>
          <PartyCreateButton />
        </div>
        <div className="card flex-1 flex flex-col gap-1">
          <h2>Join a party</h2>
          <p className="text-secondary">Enter party code to join a party.</p>
          <PartyJoinButton />
        </div>
        <SteamRecentServers />
      </div>
    </div>
    <div className="w-full flex items-center justify-center text-secondary gap-4 text-sm">
      <div className="flex items-center gap-1">
        Made with <LuHeart className="size-4" /> by <a href="https://v3x.company" className="text-accent" target="_blank">v3xlabs</a>
      </div>
      <a href="https://github.com/v3xlabs/code-fishing" className="hover:text-accent transition-colors flex items-center gap-1" target="_blank">
        <LuGithub className="size-4" />
        <span>Contribute</span>
      </a>
    </div>
  </div>
}

export const PartyCreateButton = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { mutate, isPending } = usePartyCreate({
    onMutate() {
      console.log('mutate')
    },
    onSuccess(data) {
      console.log('success')
      console.log(data)
      navigate({ to: '/$partyId', params: { partyId: data.id } });
    }
  });

  const { openLogin } = useApp();
  const isSignedIn = !!user;

  return (
    <button className="button" onClick={() => {
      if (isSignedIn) {
        mutate({});
      } else {
        openLogin();
      }
    }}>{isPending ? 'Creating...' : 'Create'}</button>
  );
}

export const PartyJoinButton = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { openLogin } = useApp();
  const isSignedIn = !!user;
  const [partyCode, setPartyCode] = useState('');
  const validInput = partyCode.trim().length > 0;

  // const { mutate, isPending } = usePartyJoin({
  //   onSuccess(data) {
  //     navigate({ to: '/$partyId', params: { partyId: data.id } });
  //   }
  // });

  const handleJoin = () => {
    if (!partyCode.trim()) return;

    if (isSignedIn) {
      // mutate({ partyCode });
      navigate({ to: '/$partyId', params: { partyId: partyCode } });
    } else {
      openLogin();
    }
  };

  return (
    <div className="flex gap-2 w-full flex-wrap">
      <input
        type="text"
        placeholder="Party code"
        className="input"
        value={partyCode}
        onChange={(e) => setPartyCode(e.target.value)}
      />
      <button
        className="button grow h-full"
        onClick={handleJoin}
        disabled={!validInput}
      >
        {/* {isPending ? 'Joining...' : 'Join'} */}
        Join
      </button>
    </div>
  );
};