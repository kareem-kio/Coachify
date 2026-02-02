import React from "react";
import "./Layout.css";

export default function Layout({ leftPanel, rightPanel }) {
	return (
		<div className="layout-container">
			<main className="main-grid">
				<section className="left-panel">{leftPanel}</section>
				<section className="right-panel">{rightPanel}</section>
			</main>
		</div>
	);
}
