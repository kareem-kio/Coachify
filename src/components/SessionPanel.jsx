import React, { useState } from "react";

export default function SessionPanel({ sessionActive, setSessionActive }) {
	const [screenShareActive, setScreenShareActive] = useState(false);
	const [title, setTitle] = useState("");

	return (
		<div className="session-container">
			{/* Top Bar: Title & Session Control */}
			<div className="control-bar">
				<div className="input-wrapper">
					<input
						type="text"
						placeholder="Session Title..."
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="session-input"
					/>
				</div>

				<button
					className={`action-btn ${sessionActive ? "active" : ""}`}
					onClick={() => setSessionActive(!sessionActive)}
				>
					{sessionActive ? "End Session" : "Start Session"}
				</button>
			</div>

			{/* Screen Share Area */}
			<div className="screen-share-area">
				<div className="screen-content">
					<div className="icon-placeholder">
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect
								x="2"
								y="3"
								width="20"
								height="14"
								rx="2"
								ry="2"
							></rect>
							<line x1="8" y1="21" x2="16" y2="21"></line>
							<line x1="12" y1="17" x2="12" y2="21"></line>
						</svg>
						<span className="status-text">
							{screenShareActive
								? "Sharing Screen..."
								: "Screen Share Inactive"}
						</span>
					</div>
				</div>

				{/* Screen Share Controls at Bottom */}
				<div className="screen-controls">
					<button
						className={`secondary-btn ${screenShareActive ? "active" : ""}`}
						onClick={() => setScreenShareActive(!screenShareActive)}
					>
						{screenShareActive
							? "Stop Sharing"
							: "Start Screen Share"}
					</button>
				</div>
			</div>

			<style jsx="true">{`
				.session-container {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
					height: 100%;
				}

				.control-bar {
					display: flex;
					gap: 1rem;
					align-items: center;
				}

				.input-wrapper {
					flex: 1;
					background: var(--bg-highlight);
					border: 1px solid var(--border-subtle);
					border-radius: var(--radius-lg);
					padding: 0.75rem 1rem;
					transition: border-color 0.2s;
				}

				.input-wrapper:focus-within {
					border-color: var(--primary);
				}

				.session-input {
					width: 100%;
					font-size: 1.1rem;
					font-weight: 500;
				}

				.action-btn {
					background: var(--primary);
					color: white;
					padding: 0.75rem 1.5rem;
					border-radius: var(--radius-lg);
					font-weight: 600;
					white-space: nowrap;
					transition: all 0.2s;
					box-shadow: 0 4px 12px var(--primary-glow);
				}

				.action-btn:hover {
					background: var(--primary-hover);
					transform: translateY(-1px);
				}

				.action-btn.active {
					background: var(--status-live);
					border: 1px solid var(--status-live);
					color: white;
					box-shadow: none;
				}

				.screen-share-area {
					flex: 1;
					background: var(--bg-panel);
					border: 1px solid var(--border-subtle);
					border-radius: var(--radius-lg);
					padding: 1rem;
					display: flex;
					flex-direction: column;
					position: relative;
					overflow: hidden;
				}

				.screen-content {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					color: var(--text-dim);
				}

				.icon-placeholder {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 1rem;
				}

				.screen-controls {
					position: absolute;
					bottom: 1.5rem;
					left: 50%;
					transform: translateX(-50%);
					z-index: 10;
				}

				.secondary-btn {
					background: var(--bg-highlight);
					color: var(--text-main);
					border: 1px solid var(--border-default);
					padding: 0.5rem 1.25rem;
					border-radius: 20px;
					font-size: 0.9rem;
					font-weight: 500;
					transition: all 0.2s;
				}

				.secondary-btn:hover {
					background: var(--border-default);
				}

				.secondary-btn.active {
					background: var(--status-live);
					color: white;
					border-color: var(--status-live);
				}
			`}</style>
		</div>
	);
}
