import React, { useState } from "react";

const STATUS_ENUM = {
	OFFLINE: { label: "OFFLINE", color: "var(--status-offline)" },
	CONNECTING: { label: "CONNECTING", color: "#F59E0B" }, // Amber
	LIVE: { label: "LIVE", color: "var(--status-live)" },
};

export default function ChatPanel({ sessionActive }) {
	const [activeTab, setActiveTab] = useState("chat");
	const [currentStatus, setCurrentStatus] = useState("LIVE"); // Mocking status

	const toggleStatus = () => {
		// Cycle statuses for demo
		const keys = Object.keys(STATUS_ENUM);
		const currentIndex = keys.indexOf(currentStatus);
		const nextIndex = (currentIndex + 1) % keys.length;
		setCurrentStatus(keys[nextIndex]);
	};

	const statusConfig = STATUS_ENUM[currentStatus];

	return (
		<div className="chat-panel">
			{/* Header */}
			<div className="chat-header">
				<div
					className="status-pill"
					onClick={toggleStatus}
					style={{ "--status-color": statusConfig.color }}
				>
					<span className="status-dot"></span>
					<span className="status-text">{statusConfig.label}</span>
				</div>

				<button className="end-btn" disabled={!sessionActive}>
					Pause Session
				</button>
			</div>

			{/* Tabs */}
			<div className="tabs-container">
				<button
					className={`tab-btn ${activeTab === "chat" ? "selected" : ""}`}
					onClick={() => setActiveTab("chat")}
				>
					Chat
				</button>
				<button
					className={`tab-btn ${activeTab === "code" ? "selected" : ""}`}
					onClick={() => setActiveTab("code")}
				>
					Code
				</button>
			</div>

			{/* Content Area */}
			<div className="content-area">
				{activeTab === "chat" ? (
					<div className="empty-state">
						<p>Speak or start coding to begin...</p>
					</div>
				) : (
					<div className="code-vault">
						<p>// Code Vault Access</p>
					</div>
				)}
			</div>

			{/* Input Area */}
			<div className="input-area">
				<div className="input-bar">
					<input type="text" placeholder="Enter Text Here" />
					<button className="mic-btn">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
							<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
							<line x1="12" y1="19" x2="12" y2="23"></line>
							<line x1="8" y1="23" x2="16" y2="23"></line>
						</svg>
					</button>
				</div>
			</div>

			<style jsx="true">{`
				.chat-panel {
					background: var(--bg-panel);
					border: 1px solid var(--border-subtle);
					border-radius: var(--radius-lg);
					height: 100%;
					display: flex;
					flex-direction: column;
					overflow: hidden;
				}

				.chat-header {
					padding: 1rem 1.5rem;
					display: flex;
					justify-content: space-between;
					align-items: center;
					border-bottom: 1px solid var(--border-subtle);
				}

				.status-pill {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					background: rgba(0, 0, 0, 0.2);
					padding: 0.25rem 0.75rem;
					border-radius: 20px;
					cursor: pointer;
					border: 1px solid var(--border-subtle);
				}

				.status-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background-color: var(--status-color);
					box-shadow: 0 0 8px var(--status-color);
				}

				.status-text {
					font-size: 0.75rem;
					font-weight: 600;
					letter-spacing: 0.05em;
					color: var(--status-color);
				}

				.end-btn {
					background: #52525b;
					color: white;
					font-size: 0.8rem;
					padding: 0.35rem 0.85rem;
					border-radius: var(--radius-md);
					font-weight: 600;
				}

				.end-btn:disabled {
					background: var(--bg-highlight);
					color: var(--text-dim);
					cursor: not-allowed;
					opacity: 0.5;
				}

				.tabs-container {
					display: flex;
					border-bottom: 1px solid var(--border-subtle);
				}

				.tab-btn {
					flex: 1;
					padding: 1rem;
					background: var(--bg-surface);
					color: var(--text-muted);
					font-weight: 500;
					transition: all 0.2s;
					border-bottom: 2px solid transparent;
				}

				.tab-btn:hover {
					color: var(--text-main);
				}

				.tab-btn.selected {
					/* Darker gradient as requested */
					background: linear-gradient(
						180deg,
						var(--bg-highlight) 0%,
						var(--bg-panel) 100%
					);
					color: var(--primary);
					border-bottom-color: var(--primary);
				}

				.content-area {
					flex: 1;
					padding: 2rem;
					display: flex;
					align-items: center;
					justify-content: center;
					color: var(--text-dim);
				}

				.input-area {
					padding: 1.5rem;
					border-top: 1px solid var(--border-subtle);
				}

				.input-bar {
					background: var(--bg-highlight);
					border-radius: 24px;
					padding: 0.75rem 1.25rem;
					display: flex;
					align-items: center;
					gap: 1rem;
				}

				.input-bar input {
					flex: 1;
					font-size: 0.95rem;
				}

				.mic-btn {
					color: var(--text-main);
					opacity: 0.7;
					transition: opacity 0.2s;
				}

				.mic-btn:hover {
					opacity: 1;
				}
			`}</style>
		</div>
	);
}
