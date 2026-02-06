"use client"

import { motion } from "framer-motion"

export default function AgentStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "12px 20px",
        background: "var(--bg-panel)",
        border: "1px solid var(--border-active)",
        boxShadow: "var(--shadow-brutal)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 1000,
        fontSize: "0.85rem",
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--accent-solana)",
          boxShadow: "0 0 10px var(--accent-solana)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
          AGENT ONLINE
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
          OpenClaw + Claude 4.5
        </div>
      </div>
    </motion.div>
  )
}
