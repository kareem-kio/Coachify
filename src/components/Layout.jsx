import React from "react";

export default function Layout({ leftPanel, rightPanel }) {
	return (
		<div className="layout-container">
			<main className="main-grid">
				<section className="left-panel">{leftPanel}</section>
				<section className="right-panel">{rightPanel}</section>
			</main>

			<style jsx="true">{`
				.layout-container {
					min-height: 100vh;
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2rem;
				}

				.main-grid {
					display: grid;
					grid-template-columns: 1fr 400px; /* Fixed width chat, fluid session */
					gap: 1.5rem;
					width: 100%;
					max-width: 1400px;
					height: 800px; /* Fixed height for dashboard feel */
				}

				.left-panel {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
					height: 100%;
				}

				.right-panel {
					height: 100%;
				}

				@media (max-width: 1024px) {
					.main-grid {
						grid-template-columns: 1fr;
						height: auto;
					}
					.right-panel {
						height: 600px;
					}
				}
			`}</style>
		</div>
	);
}
