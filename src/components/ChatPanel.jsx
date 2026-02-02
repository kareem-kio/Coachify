import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./ChatPanel.css";

const STATUS_ENUM = {
	OFFLINE: { label: "OFFLINE", color: "var(--status-offline)" },
	CONNECTING: { label: "CONNECTING", color: "#F59E0B" }, // Amber
	LIVE: { label: "LIVE", color: "var(--status-live)" },
};

// Helper to generate unique IDs (more robust than Date.now())
let messageIdCounter = 0;
const generateId = () => `msg-${Date.now()}-${++messageIdCounter}`;

// Initial message content (createdAt set dynamically in component)
const INITIAL_MESSAGE_CONTENT = {
	id: "init-1",
	role: "assistant",
	content:
		"## System Online\nI am ready to assist you. You can speak naturally or type your commands.\n\n- Real-time transcription\n- Live code generation\n- Context-aware assistance",
};

export default function ChatPanel({ sessionActive }) {
	// State
	const [activeTab, setActiveTab] = useState("chat");
	const [currentStatus, setCurrentStatus] = useState("LIVE");
	const [messages, setMessages] = useState(() => [
		// Initialize with dynamic timestamp
		{ ...INITIAL_MESSAGE_CONTENT, createdAt: new Date().toISOString() },
	]);
	const [inputText, setInputText] = useState("");
	const [isTyping, setIsTyping] = useState(false);

	// Refs (grouped at top for clarity)
	const messagesEndRef = useRef(null);
	const typingIntervalRef = useRef(null);
	const aiTimeoutRef = useRef(null); // Track pending AI response timeout

	// Cleanup interval and timeout on unmount to prevent memory leaks
	useEffect(() => {
		return () => {
			if (typingIntervalRef.current) {
				clearInterval(typingIntervalRef.current);
			}
			if (aiTimeoutRef.current) {
				clearTimeout(aiTimeoutRef.current);
			}
		};
	}, []);

	// Auto-scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const toggleStatus = () => {
		const keys = Object.keys(STATUS_ENUM);
		const currentIndex = keys.indexOf(currentStatus);
		const nextIndex = (currentIndex + 1) % keys.length;
		setCurrentStatus(keys[nextIndex]);
	};

	// Helper to clear any active typing interval AND pending AI timeout
	const stopTyping = () => {
		if (typingIntervalRef.current) {
			clearInterval(typingIntervalRef.current);
			typingIntervalRef.current = null;
		}
		if (aiTimeoutRef.current) {
			clearTimeout(aiTimeoutRef.current);
			aiTimeoutRef.current = null;
		}
		setIsTyping(false);
	};

	const streamText = (text, role, onComplete) => {
		setIsTyping(true);

		let currentText = "";
		const chars = text.split(""); // Character-based streaming
		let i = 0;
		const streamId = generateId(); // Robust ID generation
		const startTime = new Date().toISOString();

		// Initialize message
		setMessages((prev) => [
			...prev,
			{
				id: streamId,
				role: role,
				content: "",
				createdAt: startTime,
			},
		]);

		typingIntervalRef.current = setInterval(() => {
			if (i < chars.length) {
				currentText += chars[i];
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === streamId
							? { ...msg, content: currentText }
							: msg,
					),
				);
				i++;
			} else {
				stopTyping();
				if (onComplete) onComplete();
			}
		}, 70); // Character typing speed
	};

	const handleSendMessage = (e) => {
		e?.preventDefault();
		if (!inputText.trim()) return;

		const textToSend = inputText;
		setInputText(""); // Clear input immediately

		// Interruption Logic: Stop any active typing AND pending AI timeout
		stopTyping();

		// User Streaming: stream user text
		streamText(textToSend, "user", () => {
			// On User Complete: Trigger AI Response (store timeout ID)
			aiTimeoutRef.current = setTimeout(() => {
				const response =
					"### Received\nI have processed your request: **" +
					textToSend +
					"**.\n\nHere is how I can help:\n1. Analyze the context\n2. Provide real-time feedback\n3. Suggest improvements";
				streamText(response, "assistant");
			}, 500);
		});
	};

	const formatTime = (isoString) => {
		if (!isoString) return "";
		const date = new Date(isoString);
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDateGroup = (isoString) => {
		if (!isoString) return "";
		const date = new Date(isoString);
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString();
		}
	};

	const renderMessagesWithDates = () => {
		const elements = [];
		let lastDate = null;

		messages.forEach((msg) => {
			const msgDate = msg.createdAt
				? formatDateGroup(msg.createdAt)
				: null;

			if (msgDate && msgDate !== lastDate) {
				elements.push(
					<div key={`date-${msgDate}`} className="date-divider">
						<span>{msgDate}</span>
					</div>,
				);
				lastDate = msgDate;
			}

			elements.push(
				<div key={msg.id} className={`message-row ${msg.role}`}>
					<div className="message-bubble">
						{msg.role === "assistant" ? (
							<ReactMarkdown>{msg.content}</ReactMarkdown>
						) : (
							msg.content
						)}
						<span className="timestamp">
							{formatTime(msg.createdAt)}
						</span>
					</div>
				</div>,
			);
		});
		return elements;
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
					<div className="messages-list">
						{renderMessagesWithDates()}
						{isTyping && (
							<div className="typing-indicator">...</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				) : (
					<div className="code-vault">
						<p>// Code Vault Access</p>
					</div>
				)}
			</div>

			{/* Input Area */}
			<div className="input-area">
				<form className="input-bar" onSubmit={handleSendMessage}>
					<input
						type="text"
						placeholder={
							isTyping
								? "Type to interrupt..."
								: "Enter Text Here"
						}
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
					/>
					<button type="submit" className="mic-btn">
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
				</form>
			</div>
		</div>
	);
}
