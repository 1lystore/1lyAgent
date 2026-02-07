"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CreditState {
  balance: number
  tokensUsed: number
  tokensSinceLastPurchase: number
  dailyPurchaseCount: number
  lastAutoPurchase: string | null
  isLowOnCredit: boolean
  autoBuyInProgress: boolean
  lastAutoBuyStatus: "success" | "failed" | null
  lastAutoBuyMessage: string | null
}

export default function CreditModule() {
  const [creditState, setCreditState] = useState<CreditState>({
    balance: 0,
    tokensUsed: 0,
    tokensSinceLastPurchase: 0,
    dailyPurchaseCount: 0,
    lastAutoPurchase: null,
    isLowOnCredit: false,
    autoBuyInProgress: false,
    lastAutoBuyStatus: null,
    lastAutoBuyMessage: null,
  })

  const sponsorLink = "https://1ly.store/1lyagent/credit" // Credit sponsor link

  useEffect(() => {
    // Fetch real credit state from API
    fetchCreditState()

    // Poll every 2 seconds for live agent status
    const interval = setInterval(fetchCreditState, 2000)

    return () => clearInterval(interval)
  }, [])

  const fetchCreditState = async () => {
    try {
      const response = await fetch("/api/credit/state")
      const json = await response.json()

      if (json.ok && json.data) {
        const data = json.data
        setCreditState({
          balance: data.credit_balance_usdc || 0,
          tokensUsed: data.tokens_used_total || 0,
          tokensSinceLastPurchase: data.tokens_since_last_purchase || 0,
          dailyPurchaseCount: data.daily_purchase_count || 0,
          lastAutoPurchase: data.last_auto_purchase_at,
          isLowOnCredit: data.is_low_on_credit || false,
          autoBuyInProgress: data.auto_buy_in_progress || false,
          lastAutoBuyStatus: data.last_auto_buy_status || null,
          lastAutoBuyMessage: data.last_auto_buy_message || null,
        })
      }
    } catch (error) {
      console.error("Failed to fetch credit state:", error)
    }
  }

  const tokenThreshold = 500
  const balanceThreshold = 5.0
  const tokenProgress = Math.min((creditState.tokensSinceLastPurchase / tokenThreshold) * 100, 100)
  const isNearThreshold = tokenProgress >= 80

  return (
    <>
      <div className="panel" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "8px" }}>
            <span className="text-purple">🤖</span> CLAUDE CREDITS
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.85rem" }}>
            Self-sufficient AI. Auto-buys credits when running low via OpenRouter.
          </p>
        </div>


        {/* Credit Balance Display */}
        <motion.div
          style={{
            padding: "20px",
            border: "2px solid var(--accent-purple)",
            marginBottom: "20px",
            background: creditState.isLowOnCredit
              ? "rgba(251, 191, 36, 0.1)"
              : "rgba(153, 69, 255, 0.05)",
          }}
          whileHover={{ scale: 1.02 }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--accent-purple)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Credit Balance
          </div>
          <div style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: creditState.isLowOnCredit ? "var(--accent-warning)" : "var(--text-primary)",
            lineHeight: 1,
            display: "flex",
            alignItems: "baseline",
            gap: "12px",
          }}>
            ${creditState.balance.toFixed(2)}
            <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>USDC</span>
            {creditState.isLowOnCredit && (
              <span style={{ fontSize: "1rem", color: "var(--accent-warning)" }}>⚠️ LOW</span>
            )}
          </div>
        </motion.div>

        {/* Sponsor Button */}
        <a
          href={sponsorLink}
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
          💳 SPONSOR CLAUDE CREDITS ($5)
        </a>

        {/* Token Usage Progress */}
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
              Tokens Since Last Purchase
            </span>
            <span style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: isNearThreshold ? "var(--accent-warning)" : "var(--text-primary)",
            }}>
              {creditState.tokensSinceLastPurchase.toLocaleString()} / {tokenThreshold.toLocaleString()}
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
              animate={{ width: `${tokenProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                height: "100%",
                background: isNearThreshold
                  ? "var(--accent-warning)"
                  : "var(--accent-purple)",
                boxShadow: isNearThreshold
                  ? "0 0 10px var(--accent-warning)"
                  : "0 0 10px var(--accent-purple)",
              }}
            />
          </div>

          {isNearThreshold && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: "12px",
                fontSize: "0.75rem",
                color: "var(--accent-warning)",
              }}
            >
              🤖 Approaching auto-buy threshold...
            </motion.div>
          )}
        </div>

        {/* Autonomous Auto-Buy Flow - Horizontal Progression */}
        <AnimatePresence>
          {(creditState.autoBuyInProgress || creditState.lastAutoBuyStatus) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: "20px",
                padding: "24px",
                background: "linear-gradient(135deg, rgba(153, 69, 255, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                border: "2px solid var(--accent-purple)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Title */}
              <div style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                marginBottom: "20px",
                color: "var(--accent-purple)",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
                🤖 Autonomous Credit Purchase Flow
              </div>

              {/* Horizontal Step Progression */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
              }}>
                {/* Progress Bar Background */}
                <div style={{
                  position: "absolute",
                  top: "20px",
                  left: "10%",
                  right: "10%",
                  height: "3px",
                  background: "var(--border)",
                  zIndex: 0,
                }} />

                {/* Animated Progress Bar */}
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: creditState.autoBuyInProgress
                      ? "50%"
                      : creditState.lastAutoBuyStatus === "success"
                      ? "100%"
                      : "75%"
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "10%",
                    height: "3px",
                    background: creditState.lastAutoBuyStatus === "failed"
                      ? "var(--accent-error)"
                      : "var(--accent-solana)",
                    zIndex: 1,
                  }}
                />

                {/* Step 1: Detected */}
                <div style={{ flex: 1, textAlign: "center", zIndex: 2 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: "40px",
                      height: "40px",
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background: "var(--accent-solana)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
                    }}
                  >
                    ✅
                  </motion.div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>Low Credit</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    Detected
                  </div>
                </div>

                {/* Step 2: Checking Balance */}
                <div style={{ flex: 1, textAlign: "center", zIndex: 2 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      width: "40px",
                      height: "40px",
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background: creditState.autoBuyInProgress || creditState.lastAutoBuyStatus
                        ? "var(--accent-solana)"
                        : "var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      boxShadow: creditState.autoBuyInProgress || creditState.lastAutoBuyStatus
                        ? "0 0 20px rgba(34, 197, 94, 0.5)"
                        : "none",
                    }}
                  >
                    {creditState.autoBuyInProgress || creditState.lastAutoBuyStatus ? "✅" : "💰"}
                  </motion.div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>Balance Check</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    {creditState.autoBuyInProgress || creditState.lastAutoBuyStatus ? "Verified" : "Pending"}
                  </div>
                </div>

                {/* Step 3: Purchasing */}
                <div style={{ flex: 1, textAlign: "center", zIndex: 2 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      width: "40px",
                      height: "40px",
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background: creditState.autoBuyInProgress
                        ? "var(--accent-purple)"
                        : creditState.lastAutoBuyStatus
                        ? "var(--accent-solana)"
                        : "var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      boxShadow: creditState.autoBuyInProgress
                        ? "0 0 20px rgba(153, 69, 255, 0.5)"
                        : creditState.lastAutoBuyStatus
                        ? "0 0 20px rgba(34, 197, 94, 0.5)"
                        : "none",
                    }}
                  >
                    {creditState.autoBuyInProgress ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        🔄
                      </motion.div>
                    ) : creditState.lastAutoBuyStatus ? "✅" : "🤖"}
                  </motion.div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {creditState.autoBuyInProgress ? "Purchasing..." : "Purchase"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    {creditState.autoBuyInProgress
                      ? "In Progress"
                      : creditState.lastAutoBuyStatus
                      ? "Completed"
                      : "Ready"}
                  </div>
                </div>

                {/* Step 4: Result */}
                <div style={{ flex: 1, textAlign: "center", zIndex: 2 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: creditState.lastAutoBuyStatus ? 1 : 0.8 }}
                    transition={{ delay: 0.6 }}
                    style={{
                      width: "40px",
                      height: "40px",
                      margin: "0 auto 12px",
                      borderRadius: "50%",
                      background: creditState.lastAutoBuyStatus === "success"
                        ? "var(--accent-solana)"
                        : creditState.lastAutoBuyStatus === "failed"
                        ? "var(--accent-error)"
                        : "var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      boxShadow: creditState.lastAutoBuyStatus === "success"
                        ? "0 0 30px rgba(34, 197, 94, 0.8)"
                        : creditState.lastAutoBuyStatus === "failed"
                        ? "0 0 20px rgba(239, 68, 68, 0.5)"
                        : "none",
                    }}
                  >
                    {creditState.lastAutoBuyStatus === "success"
                      ? "🎉"
                      : creditState.lastAutoBuyStatus === "failed"
                      ? "❌"
                      : "⏳"}
                  </motion.div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {creditState.lastAutoBuyStatus === "success"
                      ? "Success!"
                      : creditState.lastAutoBuyStatus === "failed"
                      ? "Failed"
                      : "Waiting"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    {creditState.lastAutoBuyStatus === "success"
                      ? "Autonomous"
                      : creditState.lastAutoBuyStatus === "failed"
                      ? "Need Help"
                      : "Stand By"}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {creditState.lastAutoBuyMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: "20px",
                    padding: "12px",
                    background: creditState.lastAutoBuyStatus === "success"
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${creditState.lastAutoBuyStatus === "success" ? "var(--accent-solana)" : "var(--accent-error)"}`,
                    textAlign: "center",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {creditState.lastAutoBuyMessage}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "12px",
          fontSize: "0.85rem",
          padding: "12px",
          border: "1px solid var(--border)",
          background: "var(--bg-terminal)",
          marginBottom: "16px",
        }}>
          <div style={{ color: "var(--text-tertiary)" }}>Total Tokens Used:</div>
          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {creditState.tokensUsed.toLocaleString()}
          </div>

          <div style={{ color: "var(--text-tertiary)" }}>Auto-Purchases Today:</div>
          <div style={{ color: "var(--accent-solana)", fontWeight: 600 }}>
            {creditState.dailyPurchaseCount}
          </div>

          {creditState.lastAutoPurchase && (
            <>
              <div style={{ color: "var(--text-tertiary)" }}>Last Auto-Buy:</div>
              <div style={{ color: "var(--text-secondary)" }}>
                {new Date(creditState.lastAutoPurchase).toLocaleString()}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div style={{
          padding: "12px",
          border: "1px solid var(--border)",
          fontSize: "0.75rem",
          color: "var(--text-tertiary)",
          lineHeight: "1.6",
        }}>
          <div style={{ marginBottom: "4px", color: "var(--accent-solana)", fontWeight: 600 }}>
            ⚡ SELF-SUFFICIENT AI
          </div>
          <div style={{ marginBottom: "4px" }}>
            • Auto-buys $5 credits via OpenRouter
          </div>
          <div style={{ marginBottom: "4px" }}>
            • Triggers at: 500 tokens + balance &gt;= $5
          </div>
          <div>
            • Your sponsorships keep me running!
          </div>
        </div>
      </div>
    </>
  )
}
