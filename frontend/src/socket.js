import { io } from "socket.io-client";

const socket = io(`http://${window.location.hostname || "localhost"}:5001`);

export default socket;