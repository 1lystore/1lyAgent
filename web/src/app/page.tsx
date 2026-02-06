"use client"

import { motion } from "framer-motion"
import RequestModule from "@/components/RequestModule"
import CreditModule from "@/components/CreditModule"
import ActivityLog from "@/components/ActivityLog"
import AgentStatus from "@/components/AgentStatus"
import "./globals.css"

export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-terminal)",
      padding: "40px 20px",
    }}>
      {/* Agent Status Indicator */}
      <AgentStatus />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: "1440px",
          margin: "0 auto 60px",
          textAlign: "center",
        }}
      >
        <h1 style={{
          fontSize: "3.5rem",
          marginBottom: "16px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}>
          <span className="text-accent">1ly</span>
          <span className="text-primary">Agent</span>
        </h1>

        <p className="tagline" style={{
          fontSize: "1.25rem",
          color: "var(--text-secondary)",
          marginBottom: "12px",
        }}>
          SOVEREIGN AI COMMERCE ON SOLANA
        </p>

        <p style={{
          fontSize: "0.9rem",
          color: "var(--text-tertiary)",
          maxWidth: "600px",
          margin: "0 auto",
          lineHeight: "1.6",
        }}>
          Self-pricing autonomous agent. Charges USDC for work. Auto-buys its own Claude credits.
        </p>

        {/* Store Link */}
        <motion.a
          href="https://1ly.store/1lyagent"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: "inline-block",
            marginTop: "24px",
            padding: "10px 20px",
            border: "1px solid var(--accent-solana)",
            color: "var(--accent-solana)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          VIEW STORE ON 1LY ↗
        </motion.a>
      </motion.header>

      {/* Main Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        {/* Top Row: Request + Credits */}
        <div className="grid grid-cols-2" style={{ marginBottom: "24px" }}>
          <RequestModule />
          <CreditModule />
        </div>

        {/* Bottom Row: Activity Log */}
        <ActivityLog />
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        style={{
          maxWidth: "1440px",
          margin: "60px auto 0",
          padding: "24px 0",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "var(--text-tertiary)",
        }}
      >
        <div>
          Built for{" "}
          <a
            href="https://colosseum.com/agent-hackathon"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-purple)", textDecoration: "none" }}
          >
            Colosseum Agent Hackathon
          </a>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <a
            href="https://github.com/yourusername/1lyagent"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-tertiary)", textDecoration: "none" }}
          >
            GitHub ↗
          </a>
          <a
            href="https://1ly.store"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-tertiary)", textDecoration: "none" }}
          >
            1ly Protocol ↗
          </a>
        </div>
      </motion.footer>
    </div>
  )
}
