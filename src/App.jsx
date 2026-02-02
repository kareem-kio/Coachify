import React, { useState } from "react";
import Layout from "./components/Layout";
import SessionPanel from "./components/SessionPanel";
import ChatPanel from "./components/ChatPanel";

function App() {
	const [sessionActive, setSessionActive] = useState(false);

	return (
		<Layout
			leftPanel={
				<SessionPanel
					sessionActive={sessionActive}
					setSessionActive={setSessionActive}
				/>
			}
			rightPanel={<ChatPanel sessionActive={sessionActive} />}
		/>
	);
}

export default App;
