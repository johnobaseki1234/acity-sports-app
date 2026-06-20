"use client";

type Player = {
  id: string;
  name: string;
  jersey_number: string | number;
};

type Props = {
  players: Player[];
  scorerId: string;
  onSelect: (player: Player | null) => void;
  onCancel: () => void;
};

export function AssistPicker({ players, scorerId, onSelect, onCancel }: Props) {
  const assistPlayers = players.filter((player) => player.id !== scorerId);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-md p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Select Assister</h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <button
            onClick={() => onSelect(null)}
            className="w-full p-4 rounded-xl bg-gray-800 text-white text-left hover:bg-gray-700 font-semibold"
          >
            No Assist
          </button>
          {assistPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className="w-full p-4 rounded-xl bg-gray-800 text-white text-left hover:bg-gray-700"
            >
              <div className="font-semibold">#{player.jersey_number}</div>
              <div className="text-gray-300">{player.name}</div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="w-full mt-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl py-3">
          Cancel
        </button>
      </div>
    </div>
  );
}