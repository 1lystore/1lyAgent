"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LogEntry {
  id: string
  timestamp: string
  event: string
  data: string
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch initial logs
    fetchLogs()

    // Poll every 5 seconds for new logs
    const interval = setInterval(fetchLogs, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/activity?limit=50")
      const json = await response.json()

      if (json.ok && Array.isArray(json.data)) {
        setLogs(json.data.map((log: any) => ({
          id: log.id,
          timestamp: log.created_at,
          event: log.event,
          data: log.data,
        })))
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
    }
  }

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getEventColor = (event: string) => {
    const colorMap: Record<string, string> = {
      AGENT_ONLINE: "var(--accent-solana)",
      REQUEST_RECEIVED: "var(--accent-purple)",
      CLASSIFICATION: "var(--accent-purple)",
      LINK_CREATED: "var(--status-processing)",
      PAYMENT_CONFIRMED: "var(--accent-solana)",
      FULFILLED: "var(--accent-solana)",
      COFFEE_TIP: "var(--accent-purple)",
      CREDIT_SPONSORED: "var(--accent-purple)",
      CREDIT_AUTO_PURCHASE: "var(--accent-solana)",
      CREDIT_LOW: "var(--accent-warning)",
      ERROR: "var(--accent-error)",
    }
    return colorMap[event] || "var(--text-secondary)"
  }

  return (
    <div className="panel" style={{ padding: "0" }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h2 style={{ marginBottom: "4px" }}>
            <span className="text-accent">{"$"}</span> ACTIVITY LOG
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.75rem" }}>
            Real-time agent decision stream
          </p>
        </div>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className="btn"
          style={{
            padding: "6px 12px",
            fontSize: "0.75rem",
            opacity: autoScroll ? 1 : 0.5,
          }}
        >
          AUTO-SCROLL {autoScroll ? "ON" : "OFF"}
        </button>
      </div>

      {/* Terminal Log */}
      <div
        ref={scrollRef}
        className="terminal"
        style={{
          maxHeight: "400px",
          minHeight: "300px",
        }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="log-entry"
            >
              <div className="log-timestamp">
                [{formatTimestamp(log.timestamp)}]
              </div>
              <div
                className="log-event"
                style={{ color: getEventColor(log.event) }}
              >
                {log.event}
              </div>
              <div className="log-data">
                {log.data}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-tertiary)",
            fontSize: "0.85rem",
          }}>
            No activity yet. Waiting for requests...
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{
        padding: "12px 24px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        gap: "24px",
        fontSize: "0.75rem",
      }}>
        <div>
          <span className="text-tertiary">Total Events:</span>{" "}
          <span className="text-primary" style={{ fontWeight: 600 }}>{logs.length}</span>
        </div>
        <div>
          <span className="text-tertiary">Status:</span>{" "}
          <span className="text-accent" style={{ fontWeight: 600 }}>● LIVE</span>
        </div>
      </div>
    </div>
  )
}
