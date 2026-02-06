"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface CoffeeState {
  balance: number
  dailyExecutionCount: number
  nextBatchWindow: string
  maxExecutionsPerDay: number
}

export default function CoffeeModule() {
  const [coffeeState, setCoffeeState] = useState<CoffeeState>({
    balance: 0,
    dailyExecutionCount: 0,
    nextBatchWindow: "",
    maxExecutionsPerDay: 3,
  })

  const tipJarLink = "https://1ly.store/1lyagent/tip" // Fixed coffee tip link

  useEffect(() => {
    // TODO: Fetch actual coffee state from API
    // For now using mock data
    setCoffeeState({
      balance: 15.50,
      dailyExecutionCount: 1,
      nextBatchWindow: "4:00 PM",
      maxExecutionsPerDay: 3,
    })
  }, [])

  const progressPercent = (coffeeState.dailyExecutionCount / coffeeState.maxExecutionsPerDay) * 100

  return (
    <div className="panel" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ marginBottom: "8px" }}>
          <span className="text-purple">☕</span> COFFEE SPONSORSHIP
        </h2>
        <p className="text-secondary" style={{ fontSize: "0.85rem" }}>
          Keep the agent running. Real food delivered via Bitrefill → Swiggy.
        </p>
      </div>

      {/* Balance Display */}
      <motion.div
        style={{
          padding: "20px",
          border: "2px solid var(--accent-purple)",
          marginBottom: "20px",
          background: "rgba(153, 69, 255, 0.05)",
        }}
        whileHover={{ scale: 1.02 }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--accent-purple)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Coffee Balance
        </div>
        <div style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}>
          ${coffeeState.balance.toFixed(2)}
          <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginLeft: "8px" }}>USDC</span>
        </div>
      </motion.div>

      {/* Tip Jar Button */}
      <a
        href={tipJarLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-coffee"
        style={{
          width: "100%",
          textAlign: "center",
          textDecoration: "none",
          marginBottom: "24px",
          display: "block",
        }}
      >
        ☕ BUY AGENT COFFEE ($5)
      </a>

      {/* Execution Status */}
      <div style={{
        padding: "16px",
        border: "1px solid var(--border)",
        background: "var(--bg-terminal)",
        marginBottom: "16px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Daily Executions
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
            {coffeeState.dailyExecutionCount} / {coffeeState.maxExecutionsPerDay}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: "100%",
          height: "8px",
          background: "var(--border)",
          position: "relative",
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              background: progressPercent >= 100
                ? "var(--accent-warning)"
                : "var(--accent-purple)",
              boxShadow: progressPercent >= 100
                ? "0 0 10px var(--accent-warning)"
                : "0 0 10px var(--accent-purple)",
            }}
          />
        </div>

        {progressPercent >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: "12px",
              fontSize: "0.75rem",
              color: "var(--accent-warning)",
            }}
          >
            ⚠ Daily limit reached. Orders queued for tomorrow.
          </motion.div>
        )}
      </div>

      {/* Next Batch Window */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "12px",
        fontSize: "0.85rem",
        padding: "12px",
        border: "1px solid var(--border)",
        background: "var(--bg-terminal)",
      }}>
        <div style={{ color: "var(--text-tertiary)" }}>Next Batch:</div>
        <div style={{ color: "var(--accent-solana)", fontWeight: 600 }}>
          {coffeeState.nextBatchWindow}
        </div>
        <div style={{ color: "var(--text-tertiary)" }}>Interval:</div>
        <div style={{ color: "var(--text-secondary)" }}>Every 4 hours</div>
      </div>

      {/* Info */}
      <div style={{
        marginTop: "16px",
        padding: "12px",
        border: "1px solid var(--border)",
        fontSize: "0.75rem",
        color: "var(--text-tertiary)",
        lineHeight: "1.6",
      }}>
        <div style={{ marginBottom: "4px" }}>
          • Max 3 executions per day
        </div>
        <div style={{ marginBottom: "4px" }}>
          • Orders batched every 4 hours
        </div>
        <div>
          • Real food delivered via Swiggy
        </div>
      </div>
    </div>
  )
}
