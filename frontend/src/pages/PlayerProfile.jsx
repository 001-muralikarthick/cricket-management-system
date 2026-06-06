import { useEffect, useState } from "react";
import API from "../api";
import { useParams } from "react-router-dom";

function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const res = await API.get(`/players/${id}`);
        if (!ignore) setPlayer(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [id]);

  if (loading) return <p>Loading player...</p>;
  if (!player) return <p>Player not found</p>;

  const strikeRate =
    player.batting?.balls > 0
      ? ((player.batting.runs / player.batting.balls) * 100).toFixed(2)
      : 0;

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🧑‍💻 Player Profile</h1>

      <h2>{player.name}</h2>

      {/* 🟠 Batting */}
      <div style={{ border: "1px solid orange", padding: 10, marginTop: 10 }}>
        <h3>🟠 Batting Stats</h3>
        <p>Runs: {player.batting?.runs || 0}</p>
        <p>Balls: {player.batting?.balls || 0}</p>
        <p>Strike Rate: {strikeRate}</p>
        <p>4s: {player.batting?.fours || 0}</p>
        <p>6s: {player.batting?.sixes || 0}</p>
      </div>

      {/* 🟣 Bowling */}
      <div style={{ border: "1px solid purple", padding: 10, marginTop: 10 }}>
        <h3>🟣 Bowling Stats</h3>
        <p>Wickets: {player.bowling?.wickets || 0}</p>
        <p>Overs: {player.bowling?.overs || 0}</p>
        <p>Runs Given: {player.bowling?.runs || 0}</p>

        <p>
          Economy:{" "}
          {player.bowling?.overs > 0
            ? (player.bowling.runs / player.bowling.overs).toFixed(2)
            : 0}
        </p>
      </div>
    </div>
  );
}

export default PlayerProfile;