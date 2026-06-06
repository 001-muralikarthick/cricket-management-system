import { useEffect, useState } from "react";
import API from "../api";

function Tournament() {
  const [tournaments, setTournaments] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await API.get("/tournaments");
    setTournaments(res.data);
  }

  async function createTournament() {
    await API.post("/tournaments", {
      name,
      groups: [
        {
          name: "Group A",
          teams: ["Team 1", "Team 2", "Team 3"],
          pointsTable: []
        }
      ],
      matches: []
    });

    setName("");
    fetchData();
  }

  async function generateMatches(id) {
    await API.post("/tournaments/generate", {
      tournamentId: id
    });

    fetchData();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🏆 Tournament System</h1>

      {/* CREATE */}
      <input
        value={name}
        placeholder="Tournament Name"
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={createTournament}>Create</button>

      {/* LIST */}
      {tournaments.map(t => (
        <div key={t._id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <h2>🏆 {t.name}</h2>
          <p>Stage: {t.stage}</p>

          {/* GROUPS */}
          <h3>Groups</h3>
          {t.groups.map((g, i) => (
            <div key={i}>
              <h4>{g.name}</h4>
              <p>Teams: {g.teams.join(", ")}</p>
            </div>
          ))}

          {/* MATCHES */}
          <h3>Matches</h3>
          {t.matches.map((m, i) => (
            <p key={i}>
              {m.teamA} vs {m.teamB} → {m.winner || "Pending"}
            </p>
          ))}

          <button onClick={() => generateMatches(t._id)}>
            Generate Matches
          </button>
        </div>
      ))}
    </div>
  );
}

export default Tournament;