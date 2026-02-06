"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Request {
  id: string
  prompt?: string
  classification?: string
  price_usdc?: number
  status: string
  payment_link?: string
  payment_ref?: string
  deliverable?: string
  delivery_url?: string
  created_at: string
}

export default function RequestModule() {
  const [prompt, setPrompt] = useState("")
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(false)
  const [rateLimitError, setRateLimitError] = useState<{
    message: string
    coffeeLink: string
    retryAfter: number
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setRateLimitError(null)
    setCurrentRequest(null)

    try {
      const response = await fetch("/api/agent/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const json = await response.json()

      // Handle rate limit (429)
      if (response.status === 429) {
        setRateLimitError({
          message: json.message || "Rate limit exceeded",
          coffeeLink: json.coffeeLink || "https://1ly.store/1lyagent/tip",
          retryAfter: json.retryAfter || 60,
        })
        setLoading(false)
        return
      }

      // Handle both direct response and wrapped response
      const requestId = json.id || json.data?.id

      if (requestId) {
        // Poll for status updates
        pollRequestStatus(requestId)
      } else {
        console.error("No request ID in response:", json)
        setLoading(false)
      }
    } catch (error) {
      console.error("Request failed:", error)
      setLoading(false)
    }
  }

  const pollRequestStatus = async (requestId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/status/${requestId}`)
        const json = await response.json()

        // Unwrap the response { ok: true, data: {...} }
        const data = json.ok ? json.data : json

        // If deliverable is null but status is FULFILLED, fetch answer via proxy
        if (data.status === "FULFILLED" && !data.deliverable) {
          try {
            const answerResponse = await fetch(`/api/answer/${requestId}`)
            const answerJson = await answerResponse.json()

            if (answerJson.ok && answerJson.data) {
              data.deliverable = answerJson.data.answer || JSON.stringify(answerJson.data, null, 2)
            }
          } catch (err) {
            console.error("Could not fetch answer:", err)
          }
        }

        setCurrentRequest(data)

        // Continue polling if not in final state
        if (!["FULFILLED", "FAILED"].includes(data.status)) {
          setTimeout(poll, 2000)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Polling failed:", error)
        setLoading(false)
      }
    }

    poll()
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      NEW: "NEW",
      LINK_CREATED: "PROCESSING",
      PAID: "PAID",
      FULFILLED: "FULFILLED",
      FAILED: "FAILED",
    }
    return statusMap[status] || status
  }

  return (
    <div className="panel" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ marginBottom: "8px" }}>
          <span className="text-accent">{">"}</span> ASK AGENT
        </h2>
        <p className="text-secondary" style={{ fontSize: "0.85rem" }}>
          Submit your question. Agent will classify and price autonomously.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: "32px" }}>
        <textarea
          className="input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="// What do you want to know?"
          rows={4}
          style={{
            resize: "vertical",
            marginBottom: "16px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          disabled={loading}
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !prompt.trim()}
          style={{ width: "100%" }}
        >
          {loading ? "AGENT PROCESSING..." : "SUBMIT REQUEST"}
        </button>
      </form>

      {/* Rate Limit Error - Low on Energy */}
      <AnimatePresence>
        {rateLimitError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              padding: "24px",
              border: "2px solid var(--accent-warning)",
              background: "rgba(251, 191, 36, 0.1)",
              marginBottom: "24px",
            }}
          >
            <div style={{
              fontSize: "1.5rem",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <span>⚡</span>
              <span style={{ fontWeight: 700, color: "var(--accent-warning)" }}>
                LOW ON ENERGY
              </span>
            </div>

            <div style={{
              fontSize: "0.9rem",
              lineHeight: "1.6",
              marginBottom: "20px",
              whiteSpace: "pre-wrap",
              color: "var(--text-primary)",
            }}>
              {rateLimitError.message}
            </div>

            <a
              href={rateLimitError.coffeeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-coffee"
              style={{
                width: "100%",
                textAlign: "center",
                textDecoration: "none",
                display: "block",
              }}
            >
              ☕ FUEL ME UP NOW ($5 USDC) →
            </a>

            <div style={{
              marginTop: "12px",
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              textAlign: "center",
            }}>
              Or wait {rateLimitError.retryAfter} seconds for rate limit to reset
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              border: "1px solid var(--border-active)",
              padding: "20px",
              background: "var(--bg-terminal)",
            }}
          >
            {/* Status */}
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span className={`status status-${getStatusDisplay(currentRequest.status).toLowerCase()}`}>
                {getStatusDisplay(currentRequest.status)}
              </span>
              <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                {new Date(currentRequest.created_at).toLocaleTimeString()}
              </span>
            </div>

            {/* Classification */}
            {currentRequest.classification && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginBottom: "16px" }}
              >
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  CLASSIFICATION:
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}>
                  <span className="text-purple">{currentRequest.classification}</span>
                  {currentRequest.price_usdc !== undefined && (
                    <span className="text-accent">
                      ${currentRequest.price_usdc.toFixed(2)} USDC
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Payment Link */}
            {currentRequest.payment_link && currentRequest.status === "LINK_CREATED" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: "16px",
                  border: "2px solid var(--accent-solana)",
                  marginBottom: "16px",
                  background: "rgba(20, 241, 149, 0.05)",
                }}
              >
                <div style={{ fontSize: "0.85rem", marginBottom: "8px", color: "var(--accent-solana)" }}>
                  ⚡ PAYMENT REQUIRED
                </div>
                <a
                  href={currentRequest.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
                >
                  PAY WITH 1LY →
                </a>
                <div style={{ fontSize: "0.75rem", marginTop: "8px", color: "var(--text-tertiary)" }}>
                  Agent will fulfill after payment confirmation
                </div>
              </motion.div>
            )}

            {/* Deliverable */}
            {currentRequest.deliverable && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: "16px",
                  border: "1px solid var(--accent-solana)",
                  background: "rgba(20, 241, 149, 0.03)",
                }}
              >
                <div style={{ fontSize: "0.85rem", marginBottom: "8px", color: "var(--accent-solana)" }}>
                  ✓ DELIVERABLE:
                </div>
                <div style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  color: "var(--text-primary)",
                }}>
                  {currentRequest.deliverable}
                </div>
              </motion.div>
            )}

            {/* Prompt Display */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>
                ORIGINAL PROMPT:
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                "{currentRequest.prompt}"
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
